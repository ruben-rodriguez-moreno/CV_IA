'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase-browser';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Libreria para formatear fechas
import { format } from 'date-fns';

export default function Results() {
  const { currentUser } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCv, setSelectedCv] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchResults();
    }
  }, [currentUser, activeFilter]);

  async function fetchResults() {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      console.log("Current user ID:", currentUser.uid);

      // Use a simpler query first to make sure you can access the collection
      const q = query(collection(db, 'cvs'));
      const querySnapshot = await getDocs(q);
      console.log("Total documents in cvs collection:", querySnapshot.size);

      const allCvs = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        allCvs.push({
          id: doc.id,
          ...data
        });
        console.log("Document ID:", doc.id, "UserID:", data.userId);
      });

      // Filter client-side to show only relevant CVs
      let filteredCvs = allCvs.filter(cv =>
        // Standard field - this should work for both direct and shared uploads
        cv.userId === currentUser.uid ||
        cv.creatorId === currentUser.uid
      );

      // Apply status filter if needed
      if (activeFilter !== 'all') {
        filteredCvs = filteredCvs.filter(cv => cv.status === activeFilter);
      }

      // Sort by date
      filteredCvs.sort((a, b) => {
        const dateA = a.uploadDate ? (a.uploadDate.toDate ? a.uploadDate.toDate() : new Date(a.uploadDate)) : new Date(0);
        const dateB = b.uploadDate ? (b.uploadDate.toDate ? b.uploadDate.toDate() : new Date(b.uploadDate)) : new Date(0);
        return dateB - dateA;
      });

      setResults(filteredCvs);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results: " + err.message);
      setLoading(false);
    }
  }


  const retryAnalysis = async (cvId) => {
    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'cvs', cvId), {
        status: 'pending',
        retryCount: (results.find(r => r.id === cvId)?.retryCount || 0) + 1,
        updatedAt: new Date()
      });

      await fetchResults();
      alert("Analysis retry initiated. Check back soon for updated results.");
    } catch (err) {
      console.error("Error retrying analysis:", err);
      setError("Failed to retry analysis. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const deleteCv = async (cvId) => {
    if (!window.confirm("Are you sure you want to delete this CV?")) return;

    setProcessingAction(true);
    try {
      await deleteDoc(doc(db, 'cvs', cvId));
      await fetchResults();
    } catch (err) {
      console.error("Error deleting CV:", err);
      setError("Failed to delete CV. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const viewCvDetails = (cv) => {
    setSelectedCv(cv);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'; // Si no hay fecha, muestra "Unknown"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); // Convierte el Timestamp de Firestore a Date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="mr-1 h-3 w-3" /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="mr-1 h-3 w-3" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="mr-1 h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">CV Analysis Results</h1>
        <button
          onClick={fetchResults}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <ArrowPathIcon className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`${activeFilter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`${activeFilter === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter('processing')}
              className={`${activeFilter === 'processing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Processing
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`${activeFilter === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveFilter('failed')}
              className={`${activeFilter === 'failed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Failed
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No CVs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeFilter === 'all'
              ? "You haven't uploaded any CVs yet"
              : `No CVs with status "${activeFilter}" found`}
          </p>
          <div className="mt-6">
            <a
              href="/dashboard/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload a CV
            </a>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  File Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Upload Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {result.fileName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {/* Formateamos la fecha */}
                    {formatDate(result.uploadedAt || result.uploadDate)} 
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(result.status)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-3">
                      {/* View original CV */}
                      <button
                        onClick={() => window.open(result.fileUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Original CV"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {/* View analysis details */}
                      {result.status === 'completed' && (
                        <button
                          onClick={() => viewCvDetails(result)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Analysis Details"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                      )}

                      {/* Retry analysis for pending or failed */}
                      {(result.status === 'pending' || result.status === 'failed') && (
                        <button
                          onClick={() => retryAnalysis(result.id)}
                          disabled={processingAction}
                          className={`text-yellow-600 hover:text-yellow-900 ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Retry Analysis"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}

                      {/* Delete CV */}
                      <button
                        onClick={() => deleteCv(result.id)}
                        disabled={processingAction}
                        className={`text-red-600 hover:text-red-900 ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete CV"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Analysis Details Modal */}
      {selectedCv && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                CV Analysis Results: {selectedCv.fileName}
              </h3>
              <button
                onClick={() => setSelectedCv(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              {selectedCv.analysis ? (
                <div className="space-y-6">
                  {/* Skills Section */}
                  {selectedCv.analysis.skills && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCv.analysis.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Section */}
                  {selectedCv.analysis.experience && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Experience</h4>
                      {typeof selectedCv.analysis.experience === 'string' ? (
                        <p className="text-sm text-gray-500">{selectedCv.analysis.experience}</p>
                      ) : Array.isArray(selectedCv.analysis.experience) ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedCv.analysis.experience.map((exp, index) => (
                            <li key={index} className="text-sm text-gray-500">
                              {typeof exp === 'string' ? exp : `${exp.position} at ${exp.company}`}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}

                  {/* Education Section */}
                  {selectedCv.analysis.education && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Education</h4>
                      {typeof selectedCv.analysis.education === 'string' ? (
                        <p className="text-sm text-gray-500">{selectedCv.analysis.education}</p>
                      ) : Array.isArray(selectedCv.analysis.education) ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedCv.analysis.education.map((edu, index) => (
                            <li key={index} className="text-sm text-gray-500">
                              {typeof edu === 'string' ? edu : `${edu.degree} from ${edu.institution}`}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}

                  {/* Summary Section */}
                  {selectedCv.analysis.summary && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-sm text-gray-500">{selectedCv.analysis.summary}</p>
                    </div>
                  )}

                  {/* Feedback Section */}
                  {selectedCv.analysis.feedback && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Feedback</h4>
                      <p className="text-sm text-gray-500">{selectedCv.analysis.feedback}</p>
                    </div>
                  )}

                  {/* Score Section */}
                  {selectedCv.analysis.score && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">CV Score</h4>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${selectedCv.analysis.score}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {selectedCv.analysis.score}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No analysis data available for this CV.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => window.open(selectedCv.fileUrl, '_blank')}
                className="mr-3 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                View Original CV
              </button>
              <button
                onClick={() => setSelectedCv(null)}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
