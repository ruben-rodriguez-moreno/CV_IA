import { useState } from 'react';
import { getDocumentURL } from '../utils/firebaseStorage';

export default function DocumentPreview({ filePath }) {
  const [documentURL, setDocumentURL] = useState(null);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    try {
      const url = await getDocumentURL(filePath);
      setDocumentURL(url);
      setError('');
    } catch (err) {
      console.error('Error loading document:', err.message);
      setError('Failed to load document. Please try again.');
    }
  };

  return (
    <div>
      <button onClick={handlePreview} className="btn btn-secondary">
        <span role="img" aria-label="Preview">👁️</span> Preview
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {documentURL && (
        <div className="document-preview mt-4">
          <iframe
            src={documentURL}
            width="100%"
            height="600px"
            title="Document Preview"
          ></iframe>
        </div>
      )}
    </div>
  );
}