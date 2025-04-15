import { useState } from 'react';
import DocumentList from '../components/DocumentList';

export default function SharedLinksPage() {
  // Estado inicial de los documentos
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Plantilla Anteproyecto (1).docx' },
    { id: 2, name: 'Apuntes de Flutter, parte 1 (1).pdf' },
  ]);

  // Maneja la eliminación de un documento
  const handleDelete = (docId) => {
    // Actualiza la lista de documentos eliminando el documento con el ID dado
    setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shared Links</h1>
      {/* Pasa los documentos y la función handleDelete al componente DocumentList */}
      <DocumentList documents={documents} onDelete={handleDelete} />
    </div>
  );
}