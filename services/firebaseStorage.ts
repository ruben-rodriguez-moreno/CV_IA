import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface UploadParams {
  file: File;
  userId: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (url: string, fileId: string) => void;
}

interface QueueItem {
  userId: string;
  fileUrl: string;
  fileName: string;
  fileId: string;
  timestamp: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const uploadFileToStorage = async ({
  file,
  userId,
  onProgress,
  onError,
  onSuccess
}: UploadParams): Promise<void> => {
  try {
    const storage = getStorage();
    const db = getFirestore();
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const storagePath = `cvs/${userId}/${fileId}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitor upload progress
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        if (onError) {
          onError(error);
        }
      },
      async () => {
        // Upload completed successfully
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Add to processing queue in Firestore
        await addDoc(collection(db, 'processingQueue'), {
          userId,
          fileUrl: downloadURL,
          fileName: file.name,
          fileId,
          timestamp: serverTimestamp(),
          status: 'pending'
        } as QueueItem);
        
        if (onSuccess) {
          onSuccess(downloadURL, fileId);
        }
      }
    );
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
  }
};

export const checkUserUploadLimits = async (userId: string): Promise<{
  currentUploads: number;
  maxUploads: number;
  isLimitReached: boolean;
  planType: 'free' | 'pro';
}> => {
  // This would typically be a Firebase function, but for demo we'll mock it
  try {
    const db = getFirestore();
    
    // Get the user's plan
    // In a real implementation, you'd fetch this from Firestore
    const planType: 'free' | 'pro' = 'free'; // Mock data
    
    // Define limits based on plan
    const maxUploads = planType === 'free' ? 5 : 100;
    
    // Count user's uploads this month (mock implementation)
    const currentUploads = 3; // Mock data
    
    return {
      currentUploads,
      maxUploads,
      isLimitReached: currentUploads >= maxUploads,
      planType
    };
  } catch (error) {
    console.error('Error checking upload limits:', error);
    return {
      currentUploads: 0,
      maxUploads: 5, // Default to free plan
      isLimitReached: false,
      planType: 'free'
    };
  }
};
