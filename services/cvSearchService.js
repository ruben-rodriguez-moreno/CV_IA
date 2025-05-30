import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Search for CVs with filters (includes both AI-analyzed and shared link CVs)
 * @param {string} userId - User ID (creator ID for shared link CVs)
 * @param {Object} filters - Search filters
 * @param {Array} filters.keywords - Keywords to search for
 * @param {string} filters.experienceYears - Years of experience filter
 * @param {string} filters.educationLevel - Education level filter
 * @param {string} filters.location - Location filter
 * @returns {Promise<Array>} - Array of CV results
 */
export async function searchCvs(userId, filters) {
  try {
    // Query for both direct uploads and shared link uploads
    let q1 = query(
      collection(db, 'cvs'),
      where('userId', '==', userId) // Direct uploads
    );

    let q2 = query(
      collection(db, 'cvs'),
      where('creatorId', '==', userId) // Shared link uploads
    );

    // Execute both queries
    const [directSnapshot, sharedSnapshot] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    // Combine results and remove duplicates
    const allDocs = new Map();
    
    directSnapshot.docs.forEach(doc => {
      allDocs.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    sharedSnapshot.docs.forEach(doc => {
      allDocs.set(doc.id, { id: doc.id, ...doc.data() });
    });

    let results = Array.from(allDocs.values());    // Apply filters in memory
    results = results.filter(cv => {
      let isMatch = true;
      
      // Source type filter
      if (filters.sourceType && filters.sourceType !== 'all') {
        if (filters.sourceType === 'direct' && cv.fromSharedLink) {
          isMatch = false;
        } else if (filters.sourceType === 'shared' && !cv.fromSharedLink) {
          isMatch = false;
        }
      }
      
      // Analysis type filter
      if (filters.analysisType && filters.analysisType !== 'all') {
        if (filters.analysisType !== cv.analysisType) {
          isMatch = false;
        }
      }
      
      // Text-based keyword search for all CVs (AI-analyzed and text-only)
      if (filters.keywords?.length > 0 && isMatch) {
        const keywordMatch = checkKeywordMatch(cv, filters.keywords);
        if (!keywordMatch) isMatch = false;
      }
      
      // AI-analysis based filters (only for CVs with analysis)
      if (cv.analysis && isMatch) {
        // Experience years filter
        if (filters.experienceYears && !checkExperienceMatch(cv.analysis, filters.experienceYears)) {
          isMatch = false;
        }
        
        // Education level filter
        if (filters.educationLevel && !checkEducationLevel(cv.analysis.education, filters.educationLevel)) {
          isMatch = false;
        }
        
        // Location filter
        if (filters.location && !checkLocationMatch(cv.analysis, filters.location)) {
          isMatch = false;
        }
      }

      return isMatch;
    });

    // Calculate match scores and sort
    results = results.map(cv => ({
      ...cv,
      matchScore: calculateMatchScore(cv, filters)
    }));

    return results.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('Error searching CVs:', error);
    throw new Error('Failed to search CVs');
  }
}

/**
 * Check if CV matches keyword search (searches in both AI analysis and extracted text)
 * @param {Object} cv - CV document
 * @param {Array} keywords - Keywords to search for
 * @returns {boolean} - Whether keywords match
 */
function checkKeywordMatch(cv, keywords) {
  if (!keywords || keywords.length === 0) return true;
  
  let searchText = '';
  
  // Add filename for search
  if (cv.fileName) {
    searchText += cv.fileName + ' ';
  }
  
  // Add AI analysis text if available
  if (cv.analysis) {
    // Add summary
    if (cv.analysis.summary) {
      searchText += cv.analysis.summary + ' ';
    }
    
    // Add skills
    if (cv.analysis.skills && Array.isArray(cv.analysis.skills)) {
      searchText += cv.analysis.skills.join(' ') + ' ';
    }
    
    // Add experience descriptions
    if (cv.analysis.experience && Array.isArray(cv.analysis.experience)) {
      cv.analysis.experience.forEach(exp => {
        searchText += (exp.descripcion || exp.description || '') + ' ';
        searchText += (exp.empresa || exp.company || '') + ' ';
        searchText += (exp.puesto || exp.position || '') + ' ';
      });
    }
    
    // Add education info
    if (cv.analysis.education && Array.isArray(cv.analysis.education)) {
      cv.analysis.education.forEach(edu => {
        searchText += (edu.institucion || edu.institution || '') + ' ';
        searchText += (edu.titulo || edu.degree || '') + ' ';
        searchText += (edu.descripcion || edu.description || '') + ' ';
      });
    }
    
    // Add languages
    if (cv.analysis.idiomas && Array.isArray(cv.analysis.idiomas)) {
      searchText += cv.analysis.idiomas.join(' ') + ' ';
    }
  }
  
  // Add extracted text for text-only CVs or as fallback
  if (cv.extractedText) {
    searchText += cv.extractedText + ' ';
  }
  
  // Convert to lowercase for case-insensitive search
  searchText = searchText.toLowerCase();
  
  // Check if ALL keywords match (AND logic) for better precision
  const matchedKeywords = keywords.filter(keyword => 
    searchText.includes(keyword.toLowerCase())
  );
  
  // Return true if at least 70% of keywords match, or if there's only 1-2 keywords, all must match
  const threshold = keywords.length <= 2 ? keywords.length : Math.ceil(keywords.length * 0.7);
  return matchedKeywords.length >= threshold;
}

/**
 * Calculate match score for CV based on filters
 * @param {Object} cv - CV document
 * @param {Object} filters - Search filters
 * @returns {number} - Match score (0-100)
 */
function calculateMatchScore(cv, filters) {
  let score = 0;
  let maxPossibleScore = 0;
  
  // Base score for all CVs
  maxPossibleScore += 10;
  score += 10;
  
  // Boost score for shared link CVs to show their origin
  if (cv.fromSharedLink) {
    maxPossibleScore += 5;
    score += 5;
  }
  
  // Keyword matching score
  if (filters.keywords?.length > 0) {
    maxPossibleScore += 50;
    const keywordScore = calculateKeywordScore(cv, filters.keywords);
    score += keywordScore;
  }
  
  // AI analysis-based scoring (only if analysis exists)
  if (cv.analysis) {
    maxPossibleScore += 10; // Bonus for having AI analysis
    score += 10;
    
    // Skills matching score
    if (filters.keywords?.length > 0 && cv.analysis.skills) {
      maxPossibleScore += 25;
      const matchedSkills = cv.analysis.skills.filter(skill =>
        filters.keywords.some(keyword => 
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
      ).length;
      const skillsScore = Math.min((matchedSkills / filters.keywords.length) * 25, 25);
      score += skillsScore;
    }
    
    // Experience matching score
    if (filters.experienceYears) {
      maxPossibleScore += 15;
      if (checkExperienceMatch(cv.analysis, filters.experienceYears)) {
        score += 15;
      }
    }
    
    // Education matching score
    if (filters.educationLevel) {
      maxPossibleScore += 10;
      if (checkEducationLevel(cv.analysis.education, filters.educationLevel)) {
        score += 10;
      }
    }
    
    // Location matching score
    if (filters.location) {
      maxPossibleScore += 10;
      if (checkLocationMatch(cv.analysis, filters.location)) {
        score += 10;
      }
    }
  } else if (cv.analysisType === 'text_only') {
    // Text-only CVs get partial score
    maxPossibleScore += 5;
    score += 5;
  }
  
  return maxPossibleScore > 0 ? Math.min((score / maxPossibleScore) * 100, 100) : 50;
}

/**
 * Calculate keyword matching score based on text content
 * @param {Object} cv - CV document
 * @param {Array} keywords - Keywords to search for
 * @returns {number} - Keyword score (0-50)
 */
function calculateKeywordScore(cv, keywords) {
  if (!keywords || keywords.length === 0) return 0;
  
  let searchText = '';
  
  // Gather all searchable text
  if (cv.analysis) {
    if (cv.analysis.skills) searchText += cv.analysis.skills.join(' ') + ' ';
    if (cv.analysis.summary) searchText += cv.analysis.summary + ' ';
    if (cv.analysis.experience) {
      cv.analysis.experience.forEach(exp => {
        searchText += (exp.descripcion || exp.description || '') + ' ';
        searchText += (exp.empresa || exp.company || '') + ' ';
        searchText += (exp.puesto || exp.position || '') + ' ';
      });
    }
  }
  
  if (cv.extractedText) {
    searchText += cv.extractedText + ' ';
  }
  
  if (cv.fileName) {
    searchText += cv.fileName + ' ';
  }
  
  searchText = searchText.toLowerCase();
  
  // Count keyword matches
  let matchedKeywords = 0;
  let totalMatches = 0;
  
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const matches = (searchText.match(new RegExp(keywordLower, 'g')) || []).length;
    if (matches > 0) {
      matchedKeywords++;
      totalMatches += matches;
    }
  });
  
  // Calculate score based on:
  // - Percentage of keywords that match (primary factor)
  // - Frequency of matches (secondary factor)
  const keywordPercentage = matchedKeywords / keywords.length;
  const frequencyBonus = Math.min(totalMatches / keywords.length, 2) / 2; // Max 2x frequency bonus
  
  return (keywordPercentage * 40) + (frequencyBonus * 10);
}

/**
 * Check if experience matches the required years
 * @param {Object} analysis - CV analysis
 * @param {string} experienceYears - Required experience range
 * @returns {boolean} - Whether experience matches
 */
function checkExperienceMatch(analysis, experienceYears) {
  if (!experienceYears || !analysis.experience) return true;
  
  const totalYears = calculateTotalExperience(analysis.experience);
  const [minExp] = parseExperienceRange(experienceYears);
  
  return totalYears >= minExp;
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
  if (!experience || !Array.isArray(experience)) return 0;
  
  let totalYears = 0;
  const currentYear = new Date().getFullYear();
  
  experience.forEach(job => {
    try {
      // Try to parse start date
      let startYear = null;
      if (job.startDate) {
        if (job.startDate.includes('-')) {
          startYear = parseInt(job.startDate.split('-')[0]);
        } else {
          startYear = parseInt(job.startDate);
        }
      }
      
      // Try to parse end date
      let endYear = null;
      if (job.endDate) {
        if (job.endDate.toLowerCase().includes('present') || job.endDate.toLowerCase().includes('actual') || job.endDate.toLowerCase().includes('current')) {
          endYear = currentYear;
        } else if (job.endDate.includes('-')) {
          endYear = parseInt(job.endDate.split('-')[0]);
        } else {
          endYear = parseInt(job.endDate);
        }
      } else {
        // If no end date, assume current
        endYear = currentYear;
      }
      
      // Calculate years for this job
      if (startYear && endYear && startYear <= endYear) {
        const jobYears = endYear - startYear;
        totalYears += Math.max(0, jobYears);
      }
    } catch (error) {
      console.warn('Error calculating experience for job:', job, error);
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
 * @param {Array} education - Education array from CV analysis
 * @param {string} requiredLevel - Required education level
 * @returns {boolean} - Whether education meets requirement
 */
function checkEducationLevel(education, requiredLevel) {
  if (!education || !Array.isArray(education) || !requiredLevel) return false;
  
  const levelRanks = {
    'high-school': 1,
    'associate': 2,
    'bachelor': 3,
    'master': 4,
    'phd': 5
  };
  
  const requiredRank = levelRanks[requiredLevel] || 0;
  
  // Find highest education level in CV
  let highestRank = 0;
  
  education.forEach(edu => {
    const degreeText = (edu.degree || edu.titulo || '').toLowerCase();
    
    // Check for PhD/Doctorate
    if (degreeText.includes('phd') || degreeText.includes('doctorate') || degreeText.includes('doctor')) {
      highestRank = Math.max(highestRank, 5);
    }
    // Check for Master's
    else if (degreeText.includes('master') || degreeText.includes('mba') || degreeText.includes('maestr')) {
      highestRank = Math.max(highestRank, 4);
    }
    // Check for Bachelor's
    else if (degreeText.includes('bachelor') || degreeText.includes('licenciatura') || degreeText.includes('ingenieria') || degreeText.includes('grado')) {
      highestRank = Math.max(highestRank, 3);
    }
    // Check for Associate
    else if (degreeText.includes('associate') || degreeText.includes('tecnico') || degreeText.includes('fp')) {
      highestRank = Math.max(highestRank, 2);
    }    // Check for High School
    else if (degreeText.includes('high school') || degreeText.includes('bachillerato') || degreeText.includes('eso')) {
      highestRank = Math.max(highestRank, 1);
    }
  });
  
  return highestRank >= requiredRank;
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
 * Get all unique skills from a user's CVs (for autocomplete) - includes both direct and shared link CVs
 * @param {string} userId - User ID (creator ID for shared link CVs)
 * @returns {Promise<Array>} - Array of unique skills
 */
export async function getAllSkills(userId) {
  try {
    // Query for both direct uploads and shared link uploads
    const q1 = query(
      collection(db, 'cvs'),
      where('userId', '==', userId),
      limit(25)
    );
    
    const q2 = query(
      collection(db, 'cvs'),
      where('creatorId', '==', userId),
      limit(25)
    );
    
    const [directSnapshot, sharedSnapshot] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const allSkills = new Set();
    
    // Process direct uploads
    directSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.analysis?.skills && Array.isArray(data.analysis.skills)) {
        data.analysis.skills.forEach(skill => allSkills.add(skill));
      }
    });
    
    // Process shared link uploads
    sharedSnapshot.docs.forEach(doc => {
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
