import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

interface UploadParams {
  file: File;
  userId?: string;  // userId es opcional (para sharedLinks)
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (url: string, fileId: string) => void;
}

interface QueueItem {
  userId: string;
  fileUrl: string;
  fileName: string;
  fileId: string;
  filePath: string;
  timestamp: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sharedLinkId?: string | null;
}

// Subir archivo (maneja usuarios registrados y sharedLinks)
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
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    
    // Definir ruta según el tipo de usuario
    const isSharedLink = !userId;  // Si no hay userId, es un sharedLink
    const storagePath = isSharedLink 
      ? `cvs/sharedLink/${fileId}.${extension}`  // Ruta especial para sharedLinks
      : `cvs/${userId}/${fileId}.${extension}`;  // Ruta para usuarios registrados

    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        onError?.(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const sharedLinkId = isSharedLink ? uuidv4() : null;  // Generar ID solo para sharedLinks

        await addDoc(collection(db, 'cvs'), {
          userId: isSharedLink ? 'sharedLink' : userId,  // Marcar claramente el tipo
          fileUrl: downloadURL,
          fileName: file.name,
          fileId,
          filePath: storagePath,
          timestamp: serverTimestamp(),
          status: 'pending',
          sharedLinkId  // Guardar ID único para referencia segura
        } as QueueItem);

        onSuccess?.(downloadURL, fileId);
      }
    );
  } catch (error) {
    onError?.(error as Error);
  }
};

// Eliminar CV (solo para usuarios autenticados)
export const deleteCV = async (cvId: string, filePath: string): Promise<void> => {
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;

  try {
    if (!user) throw new Error('Usuario no autenticado');

    const cvRef = doc(db, 'cvs', cvId);
    const cvSnapshot = await getDoc(cvRef);

    if (!cvSnapshot.exists()) throw new Error('Documento no existe');
    const cvData = cvSnapshot.data() as QueueItem;

    // Validación reforzada: Solo el propietario puede eliminar
    if (cvData.userId !== user.uid) {
      throw new Error('No tienes permisos para eliminar este CV');
    }

    // Eliminar de Firestore y Storage
    await deleteDoc(cvRef);
    await deleteObject(ref(storage, cvData.filePath));
    
  } catch (error) {
    console.error('Error eliminando CV:', (error as Error).message);
    throw error;
  }
};
