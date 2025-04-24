import DocumentPreview from './DocumentPreview';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export default function DocumentList({ documents, onDelete }) {
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
      onDelete(doc.fileId);  // Actualizar UI
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  return (
    <div>
      {documents.map((doc) => (
        <div key={doc.id} className="document-item flex items-center justify-between">
          <span>{doc.name}</span>
          <div className="flex items-center space-x-4">
            <DocumentPreview filePath={`shared/${doc.name}`} />
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