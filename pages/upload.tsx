import React from 'react';
import CvUploader from '../components/CvUploader';
import { useUserPlan } from '../contexts/UserPlanContext';

const UploadPage: React.FC = () => {
  const { planType } = useUserPlan();
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Upload your CV</h1>
        <p className="text-center text-gray-600 mb-8">
          Upload your resume for AI analysis. 
          Current plan: <span className="font-semibold">{planType.toUpperCase()}</span>
        </p>
        
        <CvUploader />
        
        <div className="mt-12 bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Plan Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Free Plan: 5 CVs per month</li>
            <li>• Pro Plan: 100 CVs per month</li>
            <li>• Your files will be processed by our AI for detailed analysis</li>
          </ul>
          {planType === 'free' && (
            <div className="mt-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
