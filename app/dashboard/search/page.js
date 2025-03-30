'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '/contexts/AuthContext';
import CvFilterPanel from '/components/CvFilterPanel';
import CvSearchResults from '/components/CvSearchResults';
import { searchCvs, getAllSkills } from '/services/cvSearchService';
import { MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';

export default function CvSearchPage() {
  const [results, setResults] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { currentUser } = useAuth();

  // Load available skills for autocomplete
  useEffect(() => {
    if (currentUser?.uid) {
      async function loadSkills() {
        const skills = await getAllSkills(currentUser.uid);
        setAvailableSkills(skills);
      }
      loadSkills();
    }
  }, [currentUser]);

  // Handle search
  const handleSearch = async (filters) => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const searchResults = await searchCvs(currentUser.uid, filters);
      setResults(searchResults);
      setInitialLoad(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-secondary-900">Search CVs</h1>
      
      <div className="mt-6">
        <p className="text-sm text-secondary-600">
          Search through your CV database using keywords, skills, and other criteria.
        </p>
      </div>

      <div className="mt-6">
        <CvFilterPanel 
          onSearch={handleSearch} 
          availableSkills={availableSkills} 
          isLoading={loading}
        />
        
        {initialLoad ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MagnifyingGlassCircleIcon className="h-16 w-16 text-secondary-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-secondary-700">Search Your CVs</h3>
            <p className="mt-2 text-sm text-secondary-500 max-w-md mx-auto">
              Use the search box above to find CVs by skills, experience level, education, or location.
              Add multiple keywords to narrow your results.
            </p>
          </div>
        ) : (
          <CvSearchResults 
            results={results} 
            isLoading={loading} 
          />
        )}
      </div>
    </div>
  );
}
