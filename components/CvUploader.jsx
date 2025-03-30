'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase-browser';
import { DocumentTextIcon, ArrowUpTrayIcon, XMarkIcon, LinkIcon, PaperAirplaneIcon, FunnelIcon } from '@heroicons/react/24/outline';
import * as pdfjs from 'pdfjs-dist';
// Set the worker path to a CDN version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const CvUploader = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  
  // New states for analysis results
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // New states for shareable links and collected CVs
  const [showShareLinkForm, setShowShareLinkForm] = useState(false);
  const [linkDescription, setLinkDescription] = useState('');
  const [sharedLinks, setSharedLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [collectedCvs, setCollectedCvs] = useState([]);
  const [showAllCvs, setShowAllCvs] = useState(false);
  const [loadingCollectedCvs, setLoadingCollectedCvs] = useState(false);
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    sortBy: 'date',
    searchTerm: '',
  });

  // Fetch analysis results when component mounts or after successful upload
  useEffect(() => {
    if (currentUser) {
      fetchLatestAnalysis();
      fetchSharedLinks();
      fetchCollectedCvs();
    }
  }, [currentUser]);

  const fetchLatestAnalysis = async () => {
    if (!currentUser) return;
    
    setLoadingAnalysis(true);
    setAnalysisError(null);
    
    try {
      console.log("Fetching latest CV analyses...");
      
      // First check if Firestore is accessible
      if (!db) {
        throw new Error("Database connection not available");
      }
      
      // Updated query to include both completed and pending CVs
      const q = query(
        collection(db, 'cvs'),
        where('userId', '==', currentUser.uid),
        where('status', 'in', ['completed', 'pending']), // Include both statuses
        orderBy('uploadDate', 'desc'),
        limit(5) // Increased limit to show more results
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No CV analyses found");
        setAnalysisResults(null);
      } else {
        const cvResults = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          cvResults.push({ id: doc.id, ...data });
        });
        
        // Set the first/latest result as the main one to display
        // or you could set all results and display them in a list
        setAnalysisResults(cvResults[0]);
        
        console.log(`Found ${cvResults.length} CV analyses`);
      }
    } catch (err) {
      console.error("Error fetching analysis:", err);
      
      // More specific error messages based on error type
      if (err.code === 'permission-denied') {
        setAnalysisError("Permission denied. You don't have access to these analysis results.");
      } else if (err.code === 'unavailable' || err.name === 'FirebaseError') {
        setAnalysisError("Cannot connect to the analysis service. Please check your internet connection.");
      } else {
        setAnalysisError(`Failed to load your CV analysis results: ${err.message}`);
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Auto-refresh results if status is pending
  useEffect(() => {
    let refreshInterval;
    
    if (analysisResults && analysisResults.status === 'pending') {
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing pending CV analysis...');
        fetchLatestAnalysis();
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [analysisResults]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Clear previous errors
    setError(null);
    
    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }
    
    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const cancelUpload = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Upload to Firebase Storage with standardized path
      const storage = getStorage();
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `user_${currentUser.uid}_${timestamp}.${fileExtension}`;
      // Use this path structure
      const storageRef = ref(storage, `cvs/${currentUser.uid}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Rest of your upload code...
      
      // When saving to Firestore, use this structure:
      await addDoc(collection(db, 'cvs'), {
        fileName: file.name,
        fileUrl: downloadURL,
        uploadDate: serverTimestamp(),
        status: 'pending',
        fileSize: file.size,
        userId: currentUser.uid,
        uploadType: 'direct',
        // Standard fields used by both direct and shared uploads
        creatorId: currentUser.uid,
        // Let's add some additional metadata to make filtering easier
        uploadMethod: 'direct'
      });
    } catch (error) {
      console.error('Error during upload:', error);
      setError('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchSharedLinks = async () => {
    if (!currentUser) return;
    setLoadingLinks(true);
    try {
      const q = query(
        collection(db, 'sharedLinks'),
        where('creatorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSharedLinks(links);
    } catch (err) {
      console.error("Error fetching shared links:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const createShareLink = async () => {
    if (!currentUser || !linkDescription.trim()) return;
    try {
      const linkData = {
        creatorId: currentUser.uid,
        description: linkDescription.trim(),
        createdAt: serverTimestamp(),
        active: true,
      };
      const docRef = await addDoc(collection(db, 'sharedLinks'), linkData);
      setGeneratedLink(`${window.location.origin}/upload/${docRef.id}`);
      fetchSharedLinks();
      setLinkDescription('');
    } catch (err) {
      console.error("Error creating share link:", err);
    }
  };

  const fetchCollectedCvs = async () => {
    if (!currentUser) return;
    setLoadingCollectedCvs(true);
    try {
      let q = query(collection(db, 'cvs'), where('userId', '==', currentUser.uid));
      if (filterOptions.status !== 'all') {
        q = query(q, where('status', '==', filterOptions.status));
      }
      q = query(q, orderBy(filterOptions.sortBy === 'date' ? 'uploadDate' : 'fileName', 'desc'));
      const querySnapshot = await getDocs(q);
      let cvs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (filterOptions.searchTerm) {
        const term = filterOptions.searchTerm.toLowerCase();
        cvs = cvs.filter(cv => cv.fileName.toLowerCase().includes(term));
      }
      setCollectedCvs(cvs);
    } catch (err) {
      console.error("Error fetching collected CVs:", err);
    } finally {
      setLoadingCollectedCvs(false);
    }
  };

  const analyzeSelectedCvs = async () => {
    if (selectedCvs.length === 0) {
      alert('Please select at least one CV to analyze');
      return;
    }
    try {
      for (const cvId of selectedCvs) {
        await updateDoc(doc(db, 'cvs', cvId), { status: 'pending', analysisRequestedAt: serverTimestamp() });
      }
      fetchCollectedCvs();
      setSelectedCvs([]);
      alert('Selected CVs queued for analysis.');
    } catch (err) {
      console.error("Error analyzing CVs:", err);
    }
  };

  const deleteSelectedCvs = async () => {
    if (selectedCvs.length === 0) {
      alert('Please select at least one CV to delete');
      return;
    }
    try {
      for (const cvId of selectedCvs) {
        await deleteDoc(doc(db, 'cvs', cvId));
      }
      fetchCollectedCvs();
      setSelectedCvs([]);
      alert('Selected CVs deleted.');
    } catch (err) {
      console.error("Error deleting CVs:", err);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upload your CV</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Upload your CV</h3>
            <p className="mt-1 text-xs text-gray-500">PDF or Word (max. 10MB)</p>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Select File
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">or drag and drop</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!uploading && (
              <button
                type="button"
                className="ml-2 text-gray-400 hover:text-gray-600"
                onClick={cancelUpload}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {uploading ? (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      Uploading...
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={uploadFile}
              >
                Upload CV
              </button>
              <button
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={cancelUpload}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Analysis Results Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-3">CV Analysis Results</h3>
        
        {analysisError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{analysisError}</p>
                <div className="mt-2 flex space-x-3">
                  <button 
                    onClick={fetchLatestAnalysis}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setAnalysisError(null)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loadingAnalysis ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading analysis results...</p>
          </div>
        ) : analysisResults ? (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-blue-800">CV Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  File: {analysisResults.fileName}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                analysisResults.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : analysisResults.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {analysisResults.status === 'pending' ? 'Processing' : 
                 analysisResults.status === 'completed' ? 'Completed' : 'Failed'}
              </span>
            </div>
            
            {analysisResults.status === 'pending' ? (
              <div className="mt-4 text-center py-3">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-blue-200 rounded w-3/4 mx-auto"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-blue-200 rounded w-5/6 mx-auto"></div>
                      <div className="h-4 bg-blue-200 rounded w-4/6 mx-auto"></div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Your CV is being analyzed. This may take a few minutes...
                </p>
                <button
                  onClick={fetchLatestAnalysis}
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Check Status
                </button>
              </div>
            ) : (
              <>
                {analysisResults.analysis && (
                  <div className="mt-4 space-y-3">
                    {analysisResults.analysis.skills && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Skills</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResults.analysis.skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>
                )}
                
                {!analysisResults.analysis && (
                  <p className="mt-3 text-sm text-gray-600">
                    Analysis data is not available in the expected format.
                  </p>
                )}
              </>
            )}
            
            <button
              onClick={fetchLatestAnalysis}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Refresh Results
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600">No analysis results available yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload a CV to get detailed analysis and feedback.
            </p>
            {currentUser && (
              <button
                onClick={fetchLatestAnalysis}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Check for Results
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Shared Links Section */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <LinkIcon className="h-5 w-5 mr-2 text-blue-500" />
          Shared Upload Links
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Create a link to share with others so they can upload CVs directly to your collection.
        </p>
        {!showShareLinkForm ? (
          <button
            onClick={() => setShowShareLinkForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create New Share Link
          </button>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <input
              type="text"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md mb-3"
              placeholder="e.g., Job Fair 2023"
            />
            <button
              onClick={createShareLink}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Link
            </button>
          </div>
        )}
        {loadingLinks ? (
          <p>Loading links...</p>
        ) : (
          sharedLinks.map(link => (
            <div key={link.id} className="flex justify-between items-center mb-2">
              <span>{link.description}</span>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/upload/${link.id}`)}
                className="text-blue-600 hover:text-blue-800"
              >
                Copy Link
              </button>
            </div>
          ))
        )}
      </div>

      {/* CV Collection Section */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
          CV Collection
        </h3>
        <button
          onClick={() => setShowAllCvs(!showAllCvs)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {showAllCvs ? 'Hide All CVs' : 'Show All CVs'}
        </button>
        {showAllCvs && (
          <div className="mt-4">
            <div className="flex items-center mb-4">
              <select
                value={filterOptions.status}
                onChange={(e) => setFilterOptions({ ...filterOptions, status: e.target.value })}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md mr-4"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={filterOptions.searchTerm}
                onChange={(e) => setFilterOptions({ ...filterOptions, searchTerm: e.target.value })}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            {loadingCollectedCvs ? (
              <p>Loading CVs...</p>
            ) : (
              collectedCvs.map(cv => (
                <div key={cv.id} className="flex justify-between items-center mb-2">
                  <span>{cv.fileName}</span>
                  <button
                    onClick={() => window.open(cv.fileUrl, '_blank')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Supported formats: PDF, DOC, DOCX</p>
        <p>Your CV will be analyzed to extract key information and provide feedback.</p>
      </div>
    </div>
  );
};

export default CvUploader;