'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { format } from 'date-fns';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network status for better Firebase caching
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      enableNetwork(db);
    };
    const handleOffline = () => {
      setIsOnline(false);
      disableNetwork(db);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  useEffect(() => {
    if (!currentUser) {
      setRecentUploads([]);
      setLoading(false);
      return;
    }

    // Set up real-time listener for recent uploads from Firebase with optimizations
    const q = query(
      collection(db, 'cvs'),
      where('userId', '==', currentUser.uid),
      orderBy('uploadDate', 'desc'),
      limit(5) // Show last 5 uploads
    );

    const unsubscribe = onSnapshot(q, 
      {
        // Use cache first, then server for better performance
        includeMetadataChanges: false
      },
      (querySnapshot) => {
        // Check if data came from cache for faster loading
        const source = querySnapshot.metadata.fromCache ? "local cache" : "server";
        console.log("Data came from " + source);

        const uploads = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fileName || data.originalName || 'Unknown file',
            date: data.uploadDate?.toDate ? 
                  format(data.uploadDate.toDate(), 'dd/MM/yyyy') : 
                  format(new Date(), 'dd/MM/yyyy'),
            score: data.analysis?.overallScore || data.analysis?.score || data.score || 'Pending',
            status: data.status || 'pending',
            fileSize: data.fileSize || null,
            analysisDate: data.analysisDate?.toDate ? 
                         format(data.analysisDate.toDate(), 'dd/MM/yyyy') : null
          };
        });
        
        setRecentUploads(uploads);
        setLoading(false);
      }, 
      (error) => {
        console.error('Error fetching recent uploads:', error);
        setRecentUploads([]);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-secondary-900">Dashboard</h1>
      
      <div className="mt-6">
        <h2 className="text-lg font-medium text-secondary-800">Welcome, {currentUser?.displayName || 'User'}!</h2>
        <p className="mt-1 text-sm text-secondary-600">
          Get started by uploading your CV for analysis or check your previous results.
        </p>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/upload"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <DocumentTextIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5">
                <dt className="text-lg font-medium text-secondary-900">Upload CV</dt>
                <dd className="mt-1 text-sm text-secondary-500">
                  Upload a new CV for analysis
                </dd>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/results"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5">
                <dt className="text-lg font-medium text-secondary-900">Results</dt>
                <dd className="mt-1 text-sm text-secondary-500">
                  View analysis results and feedback
                </dd>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/settings"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Cog6ToothIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </div>
              <div className="ml-5">
                <dt className="text-lg font-medium text-secondary-900">Settings</dt>
                <dd className="mt-1 text-sm text-secondary-500">
                  Manage your account and preferences
                </dd>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-medium text-secondary-800">Recent Uploads</h2>
        
        <div className="mt-4">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-secondary-900 sm:pl-6">
                    Document Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">
                    Date Uploaded
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-secondary-900">
                    Analysis Score
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-sm text-secondary-500">
                      <div className="animate-pulse">Loading recent uploads...</div>
                    </td>
                  </tr>
                ) : recentUploads.length > 0 ? (
                  recentUploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-secondary-900 sm:pl-6">
                        {upload.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                        {upload.date}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                          upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          upload.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {typeof upload.score === 'number' ? `${upload.score}/100` : upload.score}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/dashboard/results/${upload.id}`} className="text-primary-600 hover:text-primary-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-sm text-secondary-500">
                      No documents uploaded yet.{' '}
                      <Link href="/dashboard/upload" className="text-primary-600 hover:text-primary-900">
                        Upload your first CV
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
