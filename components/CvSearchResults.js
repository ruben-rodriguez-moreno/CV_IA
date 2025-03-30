'use client';

import { useState } from 'react';
import { useAuth } from '/contexts/AuthContext';
import CvResultCard from './CvResultCard';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportToCSV } from '/utils/csvExport';

const CvSearchResults = ({ results, isLoading }) => {
  const [sortBy, setSortBy] = useState('match'); // 'match' or 'date'
  const { currentUser } = useAuth();
  const isPremiumUser = currentUser?.plan === 'pro' || currentUser?.plan === 'enterprise';

  // Handle sorting of results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'match') {
      return (b.matchScore || 0) - (a.matchScore || 0);
    } else {
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    }
  });

  // Handle CSV export
  const handleExport = () => {
    if (!isPremiumUser) {
      alert('CSV export is only available for Pro and Enterprise plans');
      return;
    }

    // Prepare data for CSV export
    const csvData = results.map(cv => ({
      FileName: cv.fileName,
      UploadedAt: new Date(cv.uploadedAt).toLocaleDateString(),
      MatchScore: cv.matchScore ? `${Math.round(cv.matchScore)}%` : 'N/A',
      Summary: cv.analysis?.summary || 'N/A',
      Skills: cv.analysis?.skills?.join(', ') || 'N/A',
      Education: cv.analysis?.education?.map(e => 
        `${e.degree} in ${e.field} (${e.institution})`
      ).join('; ') || 'N/A',
      Experience: cv.analysis?.experience?.map(e => 
        `${e.position} at ${e.company} (${e.startDate} - ${e.endDate})`
      ).join('; ') || 'N/A'
    }));

    exportToCSV(csvData, 'cv_search_results');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-secondary-600">No CVs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-secondary-600">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label htmlFor="sortBy" className="block mr-2 text-sm font-medium text-secondary-700">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm rounded-md border border-secondary-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="match">Best match</option>
              <option value="date">Date (newest)</option>
            </select>
          </div>
          
          <button
            onClick={handleExport}
            className={`btn ${isPremiumUser ? 'btn-secondary' : 'btn-secondary opacity-50'} py-1 px-3 flex items-center text-sm`}
            disabled={!isPremiumUser}
            title={isPremiumUser ? 'Export to CSV' : 'Upgrade to Pro to export results'}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export CSV
          </button>
        </div>
      </div>
      
      {sortedResults.map((cv) => (
        <CvResultCard key={cv.id} cv={cv} />
      ))}
    </div>
  );
};

export default CvSearchResults;
