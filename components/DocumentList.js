    import DocumentPreview from './DocumentPreview';
    import { deleteCV } from '../utils/firebaseStorage';

    export default function DocumentList({ documents, onDelete }) {
    const handleDelete = async (doc) => {
        try {
        // Llama al método deleteCV con el ID del documento y la ruta del archivo
        await deleteCV(doc.id, `cvs/${doc.userId}/${doc.fileId}.${doc.extension}`);
        onDelete(doc.id); // Actualiza la lista después de eliminar
        } catch (error) {
        console.error('Error deleting CV:', error.message);
        }
    };

    return (
        <div>
        {documents.map((doc) => (
            <div key={doc.id} className="document-item flex items-center justify-between">
            <span>{doc.name}</span>
            <div className="flex items-center space-x-4">
                {/* Botón para previsualizar el documento */}
                <DocumentPreview filePath={`shared/${doc.name}`} />
                {/* Botón para eliminar el documento */}
                <button
                onClick={() => handleDelete(doc)}
                className="btn btn-danger"
                title="Delete CV"
                >
                🗑️
                </button>
            </div>
            </div>
        ))}
        </div>
    );
    }