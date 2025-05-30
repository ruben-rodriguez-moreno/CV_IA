'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase-browser';
import { LinkIcon, TrashIcon, ClipboardIcon, PlusIcon } from '@heroicons/react/24/outline';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as pdfjs from 'pdfjs-dist';

export default function SharePage() {
  const { currentUser } = useAuth();
  const [sharedLinks, setSharedLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkDescription, setLinkDescription] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [linkId, setLinkId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [linkDetails, setLinkDetails] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchSharedLinks();
    }
  }, [currentUser]);

  const fetchSharedLinks = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

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
      setError("Failed to load your shared links. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createShareLink = async () => {
    if (!currentUser || !linkDescription.trim()) return;
  
    setLoadingCreate(true);
    setError(null);
  
    try {
      // Datos del enlace compartido
      const linkData = {
        creatorId: currentUser.uid, // Asegúrate de incluir el UID del usuario autenticado
        description: linkDescription.trim(),
        createdAt: serverTimestamp(),
        active: true, // Indica que el enlace está activo
      };
  
      console.log("Creating shared link with data:", linkData);
  
      // Agregar el enlace compartido a Firestore
      const docRef = await addDoc(collection(db, 'sharedLinks'), linkData);
      console.log("Shared link created with ID:", docRef.id);
  
      // Actualizar la lista de enlaces compartidos
      await fetchSharedLinks();
  
      // Restablecer el formulario
      setLinkDescription('');
      setShowLinkForm(false);
    } catch (err) {
      console.error("Error creating share link:", err);
      setError("Failed to create share link. Please try again.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const deleteLink = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sharing link?")) return;

    try {
      await deleteDoc(doc(db, 'sharedLinks', id));
      await fetchSharedLinks();
    } catch (err) {
      console.error("Error deleting link:", err);
      setError("Failed to delete the link. Please try again.");
    }
  };

  const copyLinkToClipboard = (linkId) => {
    const url = `${window.location.origin}/upload/${linkId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopySuccess(linkId);
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        setError("Failed to copy link to clipboard.");
      });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const uploadFile = async () => {
    if (!file || !linkId) return;
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Upload to Firebase Storage with standardized path
      const storage = getStorage();
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      // Use the same prefix pattern as direct uploads but include shared identifier
      const fileName = `shared_${linkId}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `cvs/shared/${linkId}/${fileName}`);
            
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Rest of your upload code...
      
      // When saving to Firestore, use this structure:
      await addDoc(collection(db, 'cvs'), {
        fileName: file.name,
        fileUrl: downloadURL,
        uploadDate: serverTimestamp(),
        status: 'pending',
        fileSize: file.size,
        // Important: Use the link creator's ID as the userId for consistency
        userId: linkDetails.creatorId,
        uploadType: 'shared',
        sharedLinkId: linkId,
        // Standard fields used by both direct and shared uploads
        creatorId: linkDetails.creatorId,
        // Let's add some additional metadata to make filtering easier
        uploadMethod: 'sharedLink'
      });
    } catch (error) {
      console.error('Error during upload:', error);
      setError('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-2">Shared Upload Links</h1>

      <p className="mb-6 text-gray-600">
        Create shareable links that allow others to upload CVs directly to your collection without needing to log in.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6">
        {!showLinkForm ? (
          <button
            onClick={() => setShowLinkForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Share Link
          </button>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Create a New Share Link</h3>
            <input
              type="text"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              placeholder="Enter a description (e.g., Job Fair 2023)"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md mb-3"
            />
            <div className="flex space-x-2">
              <button
                onClick={createShareLink}
                disabled={loadingCreate || !linkDescription.trim()}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  loadingCreate || !linkDescription.trim() 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loadingCreate ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </button>
              <button
                onClick={() => setShowLinkForm(false)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Your Active Links</h2>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your shared links...</p>
          </div>
        ) : sharedLinks.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <LinkIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-500">You haven't created any shared links yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Created On
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sharedLinks.map(link => (
                  <tr key={link.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {link.description}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => copyLinkToClipboard(link.id)}
                          className={`text-blue-600 hover:text-blue-900 flex items-center ${
                            copySuccess === link.id ? 'text-green-600' : ''
                          }`}
                        >
                          <ClipboardIcon className="h-4 w-4 mr-1" />
                          {copySuccess === link.id ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">How to use shared links</h3>        <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600">
          <li>Create a new shared link with a descriptive name</li>
          <li>Copy the link and share it with anyone who needs to submit a CV</li>
          <li>Recipients can upload CVs directly through the link without logging in</li>
          <li>All uploaded CVs will be stored with text extraction for search purposes</li>
          <li>CVs appear in your search results with the shared link name for easy identification</li>
          <li>You can optionally run AI analysis on individual CVs when needed</li>
        </ol>
      </div>
    </div>
  );
}