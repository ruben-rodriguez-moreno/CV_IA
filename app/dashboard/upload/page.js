'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '/contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '/lib/firebase/config';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function UploadCV() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const router = useRouter();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Check file type
    if (file.type !== 'application/pdf' && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && 
        file.type !== 'application/msword') {
      setError('Please upload a PDF or Word document.');
      setFile(null);
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      setFile(null);
      return;
    }
    
    setFile(file);
    setError('');
  };

  const uploadCV = async (sharedLink = false, sharedLinkId = null) => {
    if (!file) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Create a storage reference - path differs for shared links
      const fileExtension = file.name.split('.').pop();
      let fileName, storageRef;
      
      if (sharedLink && sharedLinkId) {
        // For shared links, use their specific path format
        fileName = `${Date.now()}_${file.name}`;
        storageRef = ref(storage, `cvs/shared/${sharedLinkId}/${fileName}`);
      } else {
        // For direct uploads, use the original path format
        fileName = `${currentUser.uid}_${Date.now()}.${fileExtension}`;
        storageRef = ref(storage, `cvs/${fileName}`);
      }
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create metadata based on upload type
      let fileMetadata;
      
      if (sharedLink && sharedLinkId) {
        // Match the shared link metadata structure
        fileMetadata = {
          creatorId: currentUser.uid,
          fileName: file.name,
          filePath: `cvs/shared/${sharedLinkId}/${fileName}`,
          fileUrl: downloadURL,
          fromSharedLink: true,
          sharedLinkId: sharedLinkId,
          uploadDate: serverTimestamp(),
          status: 'pending', // Add analysis fields for consistency
          score: null,
          analysis: null
        };
      } else {
        // Standard direct upload metadata
        fileMetadata = {
          userId: currentUser.uid,
          fileName: file.name,
          fileURL: downloadURL,
          uploadedAt: serverTimestamp(),
          status: 'pending',
          score: null,
          analysis: null,
          uploadSource: 'direct_upload'
        };
      }
      
      // Save metadata to Firestore
      const docRef = await addDoc(collection(db, 'cvs'), fileMetadata);
      
      // Redirect to results page
      router.push('/dashboard/results');
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-secondary-900">Upload CV</h1>
      
      <div className="mt-6">
        <p className="text-sm text-secondary-600">
          Upload your CV for AI analysis. We accept PDF and Word documents.
        </p>
      </div>
      
      <div className="mt-8">
        <div 
          className={`max-w-xl mx-auto border-2 border-dashed rounded-lg p-12 text-center ${
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-secondary-300'
          } ${file ? 'bg-green-50 border-green-500' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          
          <DocumentArrowUpIcon 
            className={`mx-auto h-12 w-12 ${file ? 'text-green-500' : 'text-secondary-400'}`}
          />
          
          <div className="mt-4">
            {!file ? (
              <>
                <p className="text-sm text-secondary-600">
                  <label 
                    htmlFor="file-upload" 
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                  </label>
                  {' '}or drag and drop
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  PDF or Word up to 5MB
                </p>
              </>
            ) : (
              <div>
                <p className="text-sm text-secondary-900 font-medium">
                  {file.name}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  className="mt-3 text-xs text-primary-600 hover:text-primary-500"
                  onClick={() => setFile(null)}
                >
                  Select a different file
                </button>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="btn btn-primary py-2 px-6"
            disabled={!file || loading}
            onClick={uploadCV}
          >
            {loading ? 'Uploading...' : 'Upload and Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}
