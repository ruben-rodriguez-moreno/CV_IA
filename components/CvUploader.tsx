'use client';

import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DocumentIcon, ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { uploadFileToStorage } from '../services/firebaseStorage';
import { useUserPlan } from '../contexts/UserPlanContext';
import { useAuth } from '../contexts/AuthContext';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../config/firebase-browser';
import { User } from 'firebase/auth'; // Add this import

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error: string | null;
  url: string | null;
}

const CvUploader: React.FC = () => {
  const { currentUser } = useAuth();  // Use object destructuring for cleaner code
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { currentUploads, maxUploads, isLimitReached, planType, refreshLimits } = useUserPlan();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if user is logged in
    if (!currentUser) {
      toast.error('Please sign in to upload CVs');
      return;
    }
    
    // Type assertion for currentUser
    const userId = (currentUser as User).uid;
    
    // Refresh limits to ensure we have the latest data
    await refreshLimits();
    
    // Calculate remaining uploads
    const remainingUploads = maxUploads - currentUploads;
    
    // Filter out files exceeding the limit
    const filesToUpload = acceptedFiles.slice(0, remainingUploads);
    
    if (filesToUpload.length < acceptedFiles.length) {
      toast.warning(`You can only upload ${remainingUploads} more CV(s) this month with your ${planType} plan`);
    }
    
    if (filesToUpload.length === 0) {
      toast.error(`You've reached your upload limit for the month (${maxUploads} CVs)`);
      return;
    }
    
    // Add files to the uploading state
    const newFiles = filesToUpload.map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      progress: 0,
      error: null,
      url: null,
    }));
    
    setUploadingFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading each file
    newFiles.forEach(fileObj => {
      uploadFileToStorage({
        file: fileObj.file,
        userId: userId, // Use the typed userId variable
        onProgress: (progress) => {
          setUploadingFiles(prev => 
            prev.map(f => f.id === fileObj.id ? { ...f, progress } : f)
          );
        },
        onError: (error) => {
          setUploadingFiles(prev => 
            prev.map(f => f.id === fileObj.id ? { ...f, error: error.message } : f)
          );
          toast.error(`Failed to upload ${fileObj.file.name}: ${error.message}`);
        },
        onSuccess: (url, fileId) => {
          setUploadingFiles(prev => 
            prev.map(f => f.id === fileObj.id ? { ...f, url } : f)
          );
          toast.success(`${fileObj.file.name} uploaded successfully and queued for processing!`);
          refreshLimits(); // Refresh limits after successful upload
        }
      });
    });
  }, [currentUser, maxUploads, currentUploads, planType, refreshLimits]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: isLimitReached ? 0 : maxUploads - currentUploads,
    disabled: isLimitReached,
  });
  
  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const uploadFile = async () => {
    // Add a guard clause with type narrowing
    if (!file || !currentUser) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Create a reference to Firebase Storage
      const storage = getStorage();
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      // Type assertion to inform TypeScript that currentUser is a Firebase User
      const userId = (currentUser as User).uid;
      const fileName = `${userId}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `cvs/${fileName}`);
      
      // Upload the file with progress monitoring
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload failed:', error);
          toast.error('File upload failed. Please try again.');
          setUploading(false);
        },
        async () => {
          // Handle successful uploads
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Store file metadata in Firestore
          const cvRef = doc(collection(db, 'cvs'));
          await setDoc(cvRef, {
            userId: userId, // Use the typed userId variable
            fileName: file.name,
            fileUrl: downloadURL,
            uploadDate: serverTimestamp(),
            status: 'pending', // pending, processing, completed
            fileSize: file.size,
            // Add additional fields as needed
          });
          
          toast.success('File uploaded successfully!');
          setFile(null);
          setUploading(false);
          setUploadProgress(0);
          refreshLimits(); // Refresh limits after successful upload
        }
      );
    } catch (error) {
      console.error('Error during upload:', error);
      toast.error('An error occurred during upload');
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Upload Progress: {currentUploads} / {maxUploads} CVs this month ({planType.toUpperCase()} plan)
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${(currentUploads / maxUploads) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400" />
        
        {isLimitReached ? (
          <p className="mt-2 text-red-500">
            You've reached your {maxUploads} CV limit for this month. 
            {planType === 'free' && <span> Upgrade to Pro for more uploads!</span>}
          </p>
        ) : (
          <>
            <p className="mt-2 text-gray-700">Drag & drop CV files here, or click to select files</p>
            <p className="text-sm text-gray-500 mt-1">
              Accepted formats: PDF, DOCX (Max: {maxUploads - currentUploads} remaining)
            </p>
          </>
        )}
      </div>
      
      {uploadingFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-3">Files ({uploadingFiles.length})</h3>
          <ul className="space-y-2">
            {uploadingFiles.map((fileObj) => (
              <li key={fileObj.id} className="bg-gray-50 p-3 rounded-lg flex items-center">
                <DocumentIcon className="h-6 w-6 text-gray-500 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileObj.file.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        fileObj.error ? 'bg-red-500' : fileObj.url ? 'bg-green-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${fileObj.progress}%` }}
                    ></div>
                  </div>
                  {fileObj.error && (
                    <p className="text-xs text-red-500 mt-1">{fileObj.error}</p>
                  )}
                </div>
                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CvUploader;