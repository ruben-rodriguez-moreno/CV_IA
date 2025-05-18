'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
    if (!currentUser) return;

    const q = query(
      collection(db, 'cvs'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedResults = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate()
        }))
        .filter(cv => 
          (cv.userId === currentUser.uid || cv.creatorId === currentUser.uid) &&
          (activeFilter === 'all' || cv.status === activeFilter)
        );

      setResults(updatedResults);
      setLoading(false);
    }, (err) => {
      setError("Error loading CVs: " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeFilter]);

  const retryAnalysis = async (cvId) => {
    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'cvs', cvId), {
        status: 'processing',
        analysis: null, // Reiniciamos el análisis antes de intentar nuevamente
        retryCount: (results.find(r => r.id === cvId)?.retryCount || 0) + 1,
        lastAttempt: new Date()
      });
      alert("Re-analysis started. Please wait...");
    } catch (err) {
      setError("Retry failed: " + err.message);
    } finally {
      setProcessingAction(false);
    }
  };


  const deleteCv = async (cvId) => {
    if (!window.confirm("Are you sure you want to delete this CV?")) return;
    
    setProcessingAction(true);
    try {
      await deleteDoc(doc(db, 'cvs', cvId));
    } catch (err) {
      setError("Delete failed: " + err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const viewCvDetails = (cv) => {
    setSelectedCv(cv);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return 'Invalid date';
    }
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
            <ArrowPathIcon className="animate-spin mr-1 h-3 w-3" />
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
            Unknown
          </span>
        );
    }
  };

  const AnalysisSection = ({ title, content, fallback }) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
          <p className="text-yellow-700 text-sm">{fallback}</p>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{title}</h4>
        {Array.isArray(content) ? (
          <div className="flex flex-wrap gap-2">
            {content.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{content}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">CV Analysis Results</h1>
        <button
          onClick={() => window.location.reload()}
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
            {['all', 'pending', 'processing', 'completed', 'failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`${
                  activeFilter === filter
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {filter}
              </button>
            ))}
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
                    {formatDate(result.uploadedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(result.status)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => window.open(result.fileURL, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Original CV"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {result.status === 'completed' && (
                        <button
                          onClick={() => viewCvDetails(result)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Analysis Details"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                      )}

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
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      AI Analysis generated: {formatDate(selectedCv.analysis.analyzedAt)}
                      {selectedCv.analysis.score && ` | Confidence Score: ${selectedCv.analysis.score}%`}
                    </p>
                  </div>

                  <AnalysisSection
                    title="Skills"
                    content={selectedCv.analysis.skills}
                    fallback="No skills detected in the analysis"
                  />

                  <AnalysisSection
                    title="Work Experience"
                    content={selectedCv.analysis.experience}
                    fallback="Could not extract work experience details"
                  />

                  <AnalysisSection
                    title="Education"
                    content={selectedCv.analysis.education}
                    fallback="Education information not found"
                  />

                  {selectedCv.analysis.rawText && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Text Preview</h4>
                      <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                        {selectedCv.analysis.rawText.substring(0, 1000)}...
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <ExclamationTriangleIcon className="mx-auto h-6 w-6 text-red-500" />
                  <p className="mt-2 text-sm text-red-600">Analysis failed. Please try again.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCv(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                Close
              </button>
              {selectedCv.analysis && (
                <button
                  onClick={() => window.open(selectedCv.fileURL, '_blank')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  View Full CV
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}