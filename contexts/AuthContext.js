'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../config/firebase-browser';
import {
  onAuthStateChanged,
  updateProfile,
  getIdToken,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup, // 👈 aquí el que faltaba
} from 'firebase/auth';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  currentUser: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  loginWithGoogle: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const token = await getIdToken(result.user, true);
    Cookies.set('firebase-token', token, { expires: 7 });
    return result;
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await getIdToken(result.user, true);
    Cookies.set('firebase-token', token, { expires: 7 });
    return result;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account', // Fuerza a mostrar el selector de cuentas
  });

  try {
    const result = await signInWithPopup(auth, provider); // O usa signInWithRedirect si prefieres redirección
    const token = await getIdToken(result.user, true);
    Cookies.set('firebase-token', token, { expires: 7 }); // Guarda el token en una cookie
    return result;
  } catch (error) {
    console.error('Failed to sign in with Google:', error.message);
    throw error;
  }
  };
  

  const logout = async () => {
    Cookies.remove('firebase-token');
    return signOut(auth);
  };

  const updateUserProfile = (userProfile) => {
    return updateProfile(auth.currentUser, userProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        const token = await getIdToken(user, true);
        Cookies.set('firebase-token', token, { expires: 7 });
        router.push('/dashboard'); // Redirigir si está autenticado
      } else {
        Cookies.remove('firebase-token');
      }
    });

    // Capturar resultado de redirección con Google
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const token = await getIdToken(result.user, true);
          Cookies.set('firebase-token', token, { expires: 7 });
          router.push('/dashboard');
        }
      })
      .catch((error) => {
        console.error('Redirect error:', error);
      });

    return unsubscribe;
  }, [router]);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    updateUserProfile,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
