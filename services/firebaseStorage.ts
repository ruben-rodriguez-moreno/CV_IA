import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../config/firebase';

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

// Método para subir un archivo a Firebase Storage
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

    // Crear tarea de subida
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitorear el progreso de la subida
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
        // Subida completada exitosamente
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Agregar a la cola de procesamiento en Firestore
        await addDoc(collection(db, 'cvs'), {
          userId: userId || 'sharedLink', // Si no hay usuario autenticado, asigna "sharedLink"
          fileUrl: downloadURL, // URL del archivo subido a Firebase Storage
          fileName: file.name, // Nombre del archivo
          fileId, // ID único generado para el archivo
          timestamp: serverTimestamp(), // Marca de tiempo del servidor
          status: 'pending', // Estado inicial del archivo
          sharedLinkId: userId ? null : uuidv4(), // Si es un shared link, genera un ID único para el enlace
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

// Método para eliminar un CV (documento y archivo)
export const deleteCV = async (cvId: string, filePath: string): Promise<void> => {
  try {
    const db = getFirestore();
    const storage = getStorage();

    // Verifica si el documento existe y obtiene sus datos
    const cvRef = doc(db, 'cvs', cvId);
    const cvSnapshot = await getDoc(cvRef);

    if (!cvSnapshot.exists()) {
      throw new Error('El documento no existe');
    }

    const cvData = cvSnapshot.data();

    // Verifica si el documento pertenece al usuario autenticado o fue subido mediante shared link
    if (cvData.userId !== 'sharedLink' && cvData.userId !== auth.currentUser?.uid) {
      throw new Error('No tienes permiso para eliminar este documento');
    }

    // Elimina el documento en Firestore
    await deleteDoc(cvRef);
    console.log(`Documento con ID ${cvId} eliminado de Firestore`);

    // Elimina el archivo en Firebase Storage
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log(`Archivo en la ruta ${filePath} eliminado de Firebase Storage`);

    console.log('CV eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar el CV:', error.message);
    throw error;
  }
};

// Método para verificar los límites de subida del usuario
export const checkUserUploadLimits = async (userId: string): Promise<{
  currentUploads: number;
  maxUploads: number;
  isLimitReached: boolean;
  planType: 'free' | 'pro';
}> => {
  try {
    const db = getFirestore();

    // Obtener el plan del usuario (mock para este ejemplo)
    const planType: 'free' | 'pro' = 'free'; // Datos simulados

    // Definir límites según el plan
    const maxUploads = planType === 'free' ? 5 : 100;

    // Contar las subidas del usuario este mes (mock para este ejemplo)
    const currentUploads = 3; // Datos simulados

    return {
      currentUploads,
      maxUploads,
      isLimitReached: currentUploads >= maxUploads,
      planType
    };
  } catch (error) {
    console.error('Error al verificar los límites de subida:', error);
    return {
      currentUploads: 0,
      maxUploads: 5, // Por defecto, plan gratuito
      isLimitReached: false,
      planType: 'free'
    };
  }
};