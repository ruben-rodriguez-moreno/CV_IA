import DocumentPreview from './DocumentPreview';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { extractTextFromFile } from '../services/textExtractionService';

export default function DocumentList({ documents, onDelete, onUpdate }) {
  const handleDelete = async (doc) => {
    try {
      if (doc.userId === 'sharedLink') {
        // Eliminar mediante Cloud Function (necesita sharedLinkId)
        const deleteSharedCV = httpsCallable(functions, 'deleteSharedCV');
        await deleteSharedCV({ cvId: doc.fileId, sharedLinkId: doc.sharedLinkId });
      } else {
        // Eliminación normal para usuarios autenticados
        await deleteCV(doc.fileId, doc.filePath);
      }
      onDelete(doc.fileId); // Actualizar UI
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const handleAnalyze = async (doc) => {
    try {
      // Actualizar estado a "Processing" en la interfaz
      onUpdate(doc.id, { status: 'processing' });

      // Llamar al servicio de extracción de texto
      await extractTextFromFile(doc.fileUrl, doc.id);

      // Actualizar estado a "Completed" en la interfaz
      onUpdate(doc.id, { status: 'completed' });
    } catch (error) {
      console.error('Error analizando el CV:', error);

      // Actualizar estado a "Failed" en la interfaz
      onUpdate(doc.id, { status: 'failed' });
    }
  };

  return (
    <div>
      {documents.map((doc) => (
        <div key={doc.id} className="document-item flex items-center justify-between">
          <span>{doc.name}</span>
          <span className={`status ${doc.status}`}>{doc.status}</span>
          <div className="flex items-center space-x-4">
            <DocumentPreview filePath={`shared/${doc.name}`} />
            <button
              onClick={() => handleAnalyze(doc)}
              className="btn btn-primary"
              disabled={doc.status !== 'pending'}
              title="Analizar CV"
            >
              🔍
            </button>
            <button
              onClick={() => handleDelete(doc)}
              className="btn btn-danger"
              title="Eliminar CV"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}