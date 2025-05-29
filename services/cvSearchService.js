import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Search for CVs with filters
 * @param {string} userId - User ID
 * @param {Object} filters - Search filters
 * @param {Array} filters.keywords - Keywords to search for
 * @param {string} filters.experienceYears - Years of experience filter
 * @param {string} filters.educationLevel - Education level filter
 * @param {string} filters.location - Location filter
 * @returns {Promise<Array>} - Array of CV results
 */
export async function searchCvs(userId, filters) {
  try {
    let q = query(
      collection(db, 'cvs'),
      where('userId', '==', userId)
    );

    // Filtros directos en Firestore
    if (filters.keywords?.length > 0) {
      q = query(q, where('analysis.skills', 'array-contains-any', filters.keywords));
    }

    if (filters.experienceYears) {
      const [minExp, maxExp] = parseExperienceRange(filters.experienceYears);
      q = query(q, where('analysis.experienceLevel', '>=', minExp));
      q = query(q, where('analysis.experienceLevel', '<=', maxExp));
    }

    const querySnapshot = await getDocs(q);
    
    let results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      matchScore: calculateBasicMatchScore(doc.data(), filters)
    }));

    // Filtros adicionales en memoria
    results = results.filter(cv => {
      let isMatch = true;
      
      // Filtro de educación
      if (filters.educationLevel && !checkEducationLevel(cv.analysis?.education, filters.educationLevel)) {
        isMatch = false;
      }
      
      // Filtro de ubicación
      if (filters.location && !checkLocationMatch(cv.analysis, filters.location)) {
        isMatch = false;
      }

      return isMatch;
    });

    return results.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error searching CVs:', error);
    throw new Error('Failed to search CVs');
  }
}

// Función auxiliar para calcular coincidencia básica
function calculateBasicMatchScore(cvData, filters) {
  let score = 0;
  
  // Coincidencia de habilidades
  if (filters.keywords?.length > 0 && cvData.analysis?.skills) {
    const matchedSkills = cvData.analysis.skills.filter(skill =>
      filters.keywords.includes(skill.toLowerCase())
    ).length;
    
    score += (matchedSkills / filters.keywords.length) * 100;
  }

  // Coincidencia de experiencia
  if (filters.experienceYears) {
    const [minExp] = parseExperienceRange(filters.experienceYears);
    if (cvData.analysis?.experienceLevel >= minExp) {
      score += 25;
    }
  }

  return Math.min(score, 100);
}

// Función para parsear rangos de experiencia
function parseExperienceRange(range) {
  switch(range) {
    case '0-1': return [0, 1];
    case '1-3': return [1, 3];
    case '3-5': return [3, 5];
    case '5-10': return [5, 10];
    case '10+': return [10, 100];
    default: return [0, 100];
  }
}

/**
 * Filter CV results based on search criteria
 * @param {Array} results - Initial CV results
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Filtered CV results with match scores
 */
async function filterResults(results, filters) {
  // If no filters, return all results
  if (!filters || (
    !filters.keywords?.length &&
    !filters.experienceYears &&
    !filters.educationLevel &&
    !filters.location
  )) {
    return results;
  }

  // Create a job-like description from keywords for matching
  const jobDescription = filters.keywords?.length > 0
    ? `Looking for a candidate with the following skills: ${filters.keywords.join(', ')}.`
    : '';

  // Process each result to calculate match and apply filters
  const processedResults = await Promise.all(results.map(async (cv) => {
    let isMatch = true;
    let matchScore = 0;
    
    // Skip filtering if CV has no analysis data
    if (!cv.analysis) {
      return { ...cv, matchScore: 0, isMatch: false };
    }

    // Calculate match score based on keywords/skills
    if (filters.keywords?.length > 0 && cv.analysis?.skills) {
      // Calculate how many keywords match in the skills array
      const matchingSkills = filters.keywords.filter(keyword => 
        cv.analysis.skills.some(skill => 
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
      );
        // Calculate percentage of matching skills
      matchScore = (matchingSkills.length / filters.keywords.length) * 100;
      
      // If no skills match at all, this result doesn't qualify
      if (matchingSkills.length === 0) {
        isMatch = false;
      }
    }

    // Filter by years of experience
    if (isMatch && filters.experienceYears && cv.analysis?.experience) {
      const totalExperience = calculateTotalExperience(cv.analysis.experience);
      
      switch(filters.experienceYears) {
        case '0-1':
          isMatch = totalExperience < 1;
          break;
        case '1-3':
          isMatch = totalExperience >= 1 && totalExperience <= 3;
          break;
        case '3-5':
          isMatch = totalExperience >= 3 && totalExperience <= 5;
          break;
        case '5-10':
          isMatch = totalExperience >= 5 && totalExperience <= 10;
          break;
        case '10+':
          isMatch = totalExperience > 10;
          break;
      }
    }

    // Filter by education level
    if (isMatch && filters.educationLevel && cv.analysis?.education) {
      const highestEducation = findHighestEducation(cv.analysis.education);
      
      isMatch = checkEducationLevel(highestEducation, filters.educationLevel);
    }

    // Filter by location
    if (isMatch && filters.location && cv.analysis) {
      const locationMatches = checkLocationMatch(cv.analysis, filters.location);
      isMatch = locationMatches;
    }

    return { ...cv, matchScore, isMatch };
  }));

  // Return only matching results
  return processedResults.filter(cv => cv.isMatch);
}

/**
 * Calculate total years of experience from experience array
 * @param {Array} experience - Experience array from CV analysis
 * @returns {number} - Total years of experience
 */
function calculateTotalExperience(experience) {
  let totalYears = 0;
  
  experience.forEach(job => {
    // Parse start date
    const startYear = parseInt(job.startDate?.split('-')[0]);
    const startMonth = parseInt(job.startDate?.split('-')[1]) || 1;
    
    // Parse end date (handle 'Present')
    let endYear, endMonth;
    if (job.endDate?.toLowerCase() === 'present') {
      const now = new Date();
      endYear = now.getFullYear();
      endMonth = now.getMonth() + 1;
    } else {
      endYear = parseInt(job.endDate?.split('-')[0]);
      endMonth = parseInt(job.endDate?.split('-')[1]) || 12;
    }
    
    // Calculate years between dates
    if (startYear && endYear) {
      const yearsWorked = (endYear - startYear) + (endMonth - startMonth) / 12;
      totalYears += yearsWorked > 0 ? yearsWorked : 0;
    }
  });
  
  return totalYears;
}

/**
 * Find highest education level from education array
 * @param {Array} education - Education array from CV analysis
 * @returns {Object|null} - Highest education entry or null
 */
function findHighestEducation(education) {
  // Education level ranking
  const levelRanks = {
    'phd': 5,
    'doctorate': 5,
    'master': 4,
    'mba': 4,
    'bachelor': 3,
    'associate': 2,
    'high school': 1,
    'diploma': 1
  };
  
  let highestRank = 0;
  let highestEducation = null;
  
  education.forEach(edu => {
    // Check degree text for education level keywords
    const degreeText = edu.degree?.toLowerCase() || '';
    
    // Find the highest rank that matches this degree
    let degreeRank = 0;
    for (const [level, rank] of Object.entries(levelRanks)) {
      if (degreeText.includes(level)) {
        degreeRank = Math.max(degreeRank, rank);
      }
    }
    
    if (degreeRank > highestRank) {
      highestRank = degreeRank;
      highestEducation = edu;
    }
  });
  
  return highestEducation;
}

/**
 * Check if education meets minimum level
 * @param {Object} education - Education entry
 * @param {string} requiredLevel - Required education level
 * @returns {boolean} - Whether education meets requirement
 */
function checkEducationLevel(education, requiredLevel) {
  if (!education) return false;
  
  const levelRanks = {
    'high-school': 1,
    'associate': 2,
    'bachelor': 3,
    'master': 4,
    'phd': 5
  };
  
  const requiredRank = levelRanks[requiredLevel] || 0;
  
  // Get rank of this education
  let educationRank = 0;
  const degreeText = education.degree?.toLowerCase() || '';
  
  if (degreeText.includes('phd') || degreeText.includes('doctorate')) {
    educationRank = 5;
  } else if (degreeText.includes('master') || degreeText.includes('mba')) {
    educationRank = 4;
  } else if (degreeText.includes('bachelor')) {
    educationRank = 3;
  } else if (degreeText.includes('associate')) {
    educationRank = 2;
  } else if (degreeText.includes('high school') || degreeText.includes('diploma')) {
    educationRank = 1;
  }
  
  return educationRank >= requiredRank;
}

/**
 * Check if CV matches location filter
 * @param {Object} analysis - CV analysis
 * @param {string} location - Location to check for
 * @returns {boolean} - Whether location matches
 */
function checkLocationMatch(analysis, location) {
  if (!location) return true;
  
  const locationLower = location.toLowerCase();
  let isMatch = false;
  
  // Check in summary
  if (analysis.summary?.toLowerCase().includes(locationLower)) {
    isMatch = true;
  }
  
  // Check in experience
  if (!isMatch && analysis.experience) {
    isMatch = analysis.experience.some(job => 
      job.description?.toLowerCase().includes(locationLower) ||
      job.company?.toLowerCase().includes(locationLower)
    );
  }
  
  // Check in education
  if (!isMatch && analysis.education) {
    isMatch = analysis.education.some(edu => 
      edu.institution?.toLowerCase().includes(locationLower)
    );
  }
  
  return isMatch;
}

/**
 * Get all unique skills from a user's CVs (for autocomplete)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of unique skills
 */
export async function getAllSkills(userId) {
  try {
    const q = query(
      collection(db, 'cvs'),
      where('userId', '==', userId),
      limit(50) // Limit to avoid performance issues
    );
    
    const querySnapshot = await getDocs(q);
    const allSkills = new Set();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.analysis?.skills && Array.isArray(data.analysis.skills)) {
        data.analysis.skills.forEach(skill => allSkills.add(skill));
      }
    });
    
    return Array.from(allSkills);
  } catch (error) {
    console.error('Error getting all skills:', error);
    return [];
  }
}
