import { useState } from 'react';
import Link from 'next/link';
import { DocumentTextIcon, ClipboardDocumentListIcon, UserIcon, AcademicCapIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

const CvResultCard = ({ cv }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4 border border-secondary-200 hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-secondary-900 truncate">
              {cv.fileName}
            </h3>
          </div>
          <div className="flex items-center">
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                cv.matchScore >= 80 ? 'bg-green-100 text-green-800' : 
                cv.matchScore >= 60 ? 'bg-primary-100 text-primary-800' :
                'bg-secondary-100 text-secondary-800'
              }`}
            >
              {cv.matchScore ? `${Math.round(cv.matchScore)}% Match` : 'Not scored'}
            </span>
          </div>
        </div>
        
        {cv.analysis && (
          <div className="mt-2">
            <p className="text-sm text-secondary-600 line-clamp-2">
              {cv.analysis.summary}
            </p>
            
            {expanded && (
              <div className="mt-3 space-y-3">
                {/* Skills */}
                {cv.analysis.skills && cv.analysis.skills.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-secondary-500 mr-1" />
                      <h4 className="text-xs font-semibold text-secondary-700 uppercase">Skills</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cv.analysis.skills.slice(0, 8).map((skill, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-100 text-secondary-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {cv.analysis.skills.length > 8 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-50 text-secondary-500">
                          +{cv.analysis.skills.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Experience */}
                {cv.analysis.experience && cv.analysis.experience.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <BriefcaseIcon className="h-4 w-4 text-secondary-500 mr-1" />
                      <h4 className="text-xs font-semibold text-secondary-700 uppercase">Experience</h4>
                    </div>
                    <ul className="space-y-2">
                      {cv.analysis.experience.slice(0, 2).map((exp, index) => (
                        <li key={index} className="text-xs text-secondary-600">
                          <span className="font-medium">{exp.position}</span> at {exp.company}
                          <span className="block text-secondary-500">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </li>
                      ))}
                      {cv.analysis.experience.length > 2 && (
                        <li className="text-xs text-secondary-500">
                          + {cv.analysis.experience.length - 2} more positions
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Education */}
                {cv.analysis.education && cv.analysis.education.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <AcademicCapIcon className="h-4 w-4 text-secondary-500 mr-1" />
                      <h4 className="text-xs font-semibold text-secondary-700 uppercase">Education</h4>
                    </div>
                    <ul className="space-y-2">
                      {cv.analysis.education.map((edu, index) => (
                        <li key={index} className="text-xs text-secondary-600">
                          <span className="font-medium">{edu.degree}</span> in {edu.field}
                          <span className="block text-secondary-500">
                            {edu.institution}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
          
          <div className="text-xs text-secondary-500">
            Uploaded {formatDate(cv.uploadedAt)}
          </div>
          
          <Link
            href={`/dashboard/results/${cv.id}`}
            className="btn btn-secondary py-1 px-3 text-xs"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CvResultCard;
