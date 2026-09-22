import React, { useEffect, useState } from 'react';
import { useClient360 } from '../../services/client360Service';
import { FileText } from 'lucide-react';

const DocumentsTab = ({ phone, company }) => {
  const { fetchPaginated, loading } = useClient360();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, [phone, company]);

  const loadDocuments = async () => {
    try {
      const res = await fetchPaginated(clientId, 'documents', 1, 50);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && documents.length === 0) return <div className="p-6 text-slate-500">Loading documents...</div>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Related Documents</h3>
      {documents.length === 0 ? (
        <div className="text-slate-500 py-4 text-center bg-slate-50 rounded-lg">No documents found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => (
            <div key={idx} className="flex items-center p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-500">{doc.type} • {new Date(doc.date).toLocaleDateString()}</p>
              </div>
              <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium ml-2">
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
