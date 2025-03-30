import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { checkUserUploadLimits } from '../services/firebaseStorage';

interface UserPlanContextType {
  currentUploads: number;
  maxUploads: number;
  isLimitReached: boolean;
  planType: 'free' | 'pro';
  loading: boolean;
  refreshLimits: () => Promise<void>;
}

const UserPlanContext = createContext<UserPlanContextType | undefined>(undefined);

export const UserPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUploads, setCurrentUploads] = useState(0);
  const [maxUploads, setMaxUploads] = useState(5); // Default to free plan
  const [planType, setPlanType] = useState<'free' | 'pro'>('free');
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const refreshLimits = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const limits = await checkUserUploadLimits(userId);
      
      setCurrentUploads(limits.currentUploads);
      setMaxUploads(limits.maxUploads);
      setIsLimitReached(limits.isLimitReached);
      setPlanType(limits.planType);
    } catch (error) {
      console.error('Failed to refresh upload limits:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Reset to default values when logged out
        setCurrentUploads(0);
        setMaxUploads(5);
        setIsLimitReached(false);
        setPlanType('free');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (userId) {
      refreshLimits();
    }
  }, [userId]);
  
  return (
    <UserPlanContext.Provider value={{
      currentUploads,
      maxUploads,
      isLimitReached,
      planType,
      loading,
      refreshLimits
    }}>
      {children}
    </UserPlanContext.Provider>
  );
};

export const useUserPlan = () => {
  const context = useContext(UserPlanContext);
  if (context === undefined) {
    throw new Error('useUserPlan must be used within a UserPlanProvider');
  }
  return context;
};
