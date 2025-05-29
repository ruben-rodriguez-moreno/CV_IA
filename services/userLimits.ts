import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

interface UserUploadLimits {
  currentUploads: number;
  maxUploads: number;
  isLimitReached: boolean;
  planType: 'free' | 'pro';
}

// Check user upload limits (client-side only)
export const checkUserUploadLimits = async (userId: string): Promise<UserUploadLimits> => {
  try {
    const db = getFirestore();
    
    // Count current uploads for the user
    const cvsQuery = query(
      collection(db, 'cvs'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(cvsQuery);
    const currentUploads = querySnapshot.size;
    
    // For now, assume all users are free plan with 5 uploads limit
    // This can be enhanced later to check user's subscription status
    const maxUploads = 5; // Free plan limit
    const planType: 'free' | 'pro' = 'free';
    
    // TODO: Add logic to check user's subscription status from Stripe/Firestore
    // and set appropriate limits based on their plan
    
    return {
      currentUploads,
      maxUploads,
      isLimitReached: currentUploads >= maxUploads,
      planType
    };
  } catch (error) {
    console.error('Error checking upload limits:', error);
    // Return default values on error
    return {
      currentUploads: 0,
      maxUploads: 5,
      isLimitReached: false,
      planType: 'free'
    };
  }
};
