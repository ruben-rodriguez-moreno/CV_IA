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
  signInWithPopup, 
  sendPasswordResetEmail,
} from 'firebase/auth';
import {doc, setDoc, updateDoc, getDoc} from 'firebase/firestore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  currentUser: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  loginWithGoogle: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signup = async (email, password, fullName) => {
    try {
      // Crea el usuario en Firebase Authentication
      const result = await createUserWithEmailAndPassword(auth, email, password);
  
      // Obtén el token del usuario autenticado
      const token = await getIdToken(result.user, true);
      Cookies.set('firebase-token', token, { expires: 7 });
  
      // Crea un documento en Firestore para el usuario
      const userDoc = doc(db, 'users', result.user.uid);
      await setDoc(userDoc, {
        fullName: fullName || '', // Nombre del usuario
        email: result.user.email,
        createdAt: new Date(),
      });
  
      return result;
    } catch (error) {
      console.error('Error during signup:', error.message);
      throw error;
    }
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

  const updateUserProfile = async (userProfile) => {
    try {
      // Actualiza el perfil del usuario en Firebase Authentication
      await updateProfile(auth.currentUser, {
        displayName: userProfile.fullName,
      });
  
      // Actualiza el documento del usuario en Firestore
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
        fullName: userProfile.fullName,
        updatedAt: new Date(),
      });
  
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error.message);
      throw error;
    }
  };
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
  
      const currentPath = window.location.pathname; // Obtiene la ruta actual
  
      if (user) {
        const token = await getIdToken(user, true);
        Cookies.set('firebase-token', token, { expires: 7 });
  
        // Redirige al dashboard solo si no estás en una ruta pública
        const publicPaths = ['/auth/login', '/auth/signup', '/auth/register', '/auth/forgot-password'];
        if (!publicPaths.includes(currentPath)) {
          router.push('/dashboard');
        }
      } else {
        Cookies.remove('firebase-token');
  
        // Evita redirecciones innecesarias en rutas públicas
        const protectedPaths = ['/dashboard', '/profile']; // Agrega aquí tus rutas protegidas
        if (protectedPaths.includes(currentPath)) {
          router.push('/auth/login');
        }
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
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
