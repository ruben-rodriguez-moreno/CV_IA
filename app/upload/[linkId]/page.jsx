'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation'; 
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase-browser';
import { DocumentTextIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as pdfjs from 'pdfjs-dist';

// Set the worker path to a CDN version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SharedUploadPage({ params }) {
  const { linkId } = useParams();
  const [linkDetails, setLinkDetails] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [linkLoading, setLinkLoading] = useState(true);
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Fetch link details on mount
  useEffect(() => {
    async function fetchLinkDetails() {
      setLinkLoading(true);

      try {
        const linkDoc = await getDoc(doc(db, 'sharedLinks', linkId));

        if (!linkDoc.exists()) {
          setLinkError('Este enlace de carga no existe o ha sido eliminado.');
        } else {
          const data = linkDoc.data();

          if (!data.active) {
            setLinkError('Este enlace de carga ya no está activo.');
          } else {
            setLinkDetails({
              id: linkDoc.id,
              ...data
            });
          }
        }
      } catch (err) {
        console.error("Error fetching link details:", err);
        setLinkError('Ocurrió un error al verificar este enlace de carga.');
      } finally {
        setLinkLoading(false);
      }
    }

    fetchLinkDetails();
  }, [linkId]);
  
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
      setError('Por favor, suba un documento PDF o Word.');
      return;
    }
    
    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo debe ser menor a 10MB.');
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
    if (!file || !linkDetails) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create a reference to Firebase Storage
      const storage = getStorage();
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `cvs/shared/${linkId}/${fileName}`);
      
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
          setError('Error al subir el archivo: ' + error.message);
          setUploading(false);
        },
        async () => {
          // Handle successful uploads
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              // Store file metadata in Firestore with initial pending status
            const cvDoc = await addDoc(collection(db, 'cvs'), {
              fileName: file.name,
              fileUrl: downloadURL,
              filePath: `cvs/shared/${linkId}/${fileName}`,
              uploadDate: serverTimestamp(),
              fromSharedLink: true,
              sharedLinkId: linkId,
              sharedLinkName: linkDetails.description,
              creatorId: linkDetails.creatorId, // The person who created the shared link
              status: 'pending', // Will be updated to 'text_extracted' after text extraction
              analysisType: 'text_only' // Indicates text-only extraction, no AI analysis
            });

            // Extract text for search purposes (without AI analysis)
            try {
              const extractResponse = await fetch('/api/extract-text', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  fileUrl: downloadURL, 
                  jobId: cvDoc.id,
                  textOnly: true // Flag to indicate text-only extraction
                }),
              });
              
              if (!extractResponse.ok) {
                console.warn('Text extraction failed, but upload succeeded');
              }
            } catch (extractError) {
              console.warn('Text extraction failed, but upload succeeded:', extractError);
            }
            
            // Show success message
            setUploadSuccess(true);
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setUploading(false);
          } catch (err) {
            console.error('Error finalizing upload:', err);
            setError('Error al finalizar la carga: ' + err.message);
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error during upload:', error);
      setError('Error durante la carga: ' + error.message);
      setUploading(false);
    }
  };

  if (linkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando enlace de carga...</p>
        </div>
      </div>
    );
  }
  
  if (linkError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-100 p-6 rounded-lg">
            <XMarkIcon className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-bold text-red-700">Enlace Inválido</h2>
            <p className="mt-2 text-gray-700">{linkError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-2">Subir CV</h2>
          <p className="text-gray-600 mb-6">
            {linkDetails?.description || 'Sube tu CV usando este enlace compartido.'}
          </p>
          
          {uploadSuccess ? (
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <svg className="h-12 w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-green-800">¡Carga Exitosa!</h3>
              <p className="mt-1 text-gray-600">Tu CV ha sido subido correctamente.</p>
              <button
                onClick={() => setUploadSuccess(false)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Subir Otro
              </button>
            </div>
          ) : (
            <>
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sube tu CV</h3>
                    <p className="mt-1 text-xs text-gray-500">PDF o Word (máx. 10MB)</p>
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
                        Seleccionar Archivo
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">o arrastra y suelta</p>
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
                              Subiendo...
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
                        Subir CV
                      </button>
                      <button
                        type="button"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={cancelUpload}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          Este enlace de carga es proporcionado por {linkDetails?.creatorName || 'el propietario del CV'}.
        </div>
      </div>
    </div>
  );
}
