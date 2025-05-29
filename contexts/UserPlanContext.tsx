import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

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

  // Refresh the limits from the API route
  const refreshLimits = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch the limits from the API endpoint
      const response = await fetch(`/api/check-upload-limits?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch limits: ${response.statusText}`);
      }

      const limits = await response.json();

      // Update the state with the limits data
      setCurrentUploads(limits.currentUploads);
      setMaxUploads(limits.maxUploads);
      setPlanType(limits.planType);
      setIsLimitReached(limits.isLimitReached);
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
        // Reset the plan data when logged out
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
      refreshLimits();  // Refresh the limits whenever the user ID changes
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
