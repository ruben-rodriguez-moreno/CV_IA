'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from '../config/firebase-browser';
import { onAuthStateChanged, updateProfile, getIdToken } from 'firebase/auth';
import Cookies from 'js-cookie';

// Create the auth context with proper default values
const AuthContext = createContext({
  currentUser: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {}
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register a new user
  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Get token and set cookie
    const token = await getIdToken(result.user, true);
    Cookies.set('firebase-token', token, { expires: 7 }); // 7 days expiry
    return result;
  };

  // Login existing user
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Get token and set cookie
    const token = await getIdToken(result.user, true);
    Cookies.set('firebase-token', token, { expires: 7 }); // 7 days expiry
    return result;
  };

  // Logout current user
  const logout = () => {
    // Clear the cookie
    Cookies.remove('firebase-token');
    return signOut(auth);
  };

  // Update user profile
  const updateUserProfile = (userProfile) => {
    return updateProfile(auth.currentUser, userProfile);
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        // Get fresh token on auth state change
        const token = await getIdToken(user, true);
        Cookies.set('firebase-token', token, { expires: 7 }); // 7 days expiry
      } else {
        Cookies.remove('firebase-token');
      }
    });

    return unsubscribe;
  }, []);

  // Context values to provide
  const value = {
    currentUser,
    login,
    signup,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

function MyComponent() {
  const { currentUser } = useAuth(); // No more type errors
  // ...
}
