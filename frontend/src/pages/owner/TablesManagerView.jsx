import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { QrCode, Download, Link as LinkIcon, AlertCircle } from 'lucide-react';

const TablesManagerView = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(null);

  const fetchTables = () => {
    api.get('/owner/tables')
      .then(res => {
        setTables(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch tables');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleGenerateQR = (tableId) => {
    setGenerating(tableId);
    api.post(`/owner/tables/${tableId}/qr`)
      .then(res => {
        fetchTables(); // Refresh to get the new URL
        setGenerating(null);
      })
      .catch(err => {
        alert("Failed to generate QR code");
        setGenerating(null);
      });
  };

  const handleDownloadQR = (qrUrl, tableNumber) => {
    // In a real app, you'd trigger a blob download. 
    // Here we'll just open it in a new tab.
    const fullUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') + qrUrl 
      : `http://localhost:5000${qrUrl}`;
      
    window.open(fullUrl, '_blank');
  };

  if (loading) return <div className="p-8 text-gray-400">Loading tables...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold font-syne text-white mb-2">Tables & QR Codes</h2>
          <p className="text-gray-400">Generate and print unique QR codes for each table.</p>
        </div>
        
        <button className="px-4 py-2 bg-owner-accent text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-sm">
          Add New Table
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-300 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-owner-surface/30 border border-owner-surface hover:border-owner-surface/80 rounded-2xl p-6 transition-colors group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-owner-surface flex items-center justify-center font-bold text-xl text-white font-syne shadow-inner">
                {table.table_number}
              </div>
              
              {table.qr_code_url ? (
                <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                  Active Setup
                </div>
              ) : (
                <div className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/20">
                  Needs QR
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleGenerateQR(table.id)}
                disabled={generating === table.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-owner-surface hover:bg-owner-surface/80 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {generating === table.id ? 'Generating...' : (
                  <>
                    <QrCode size={16} /> 
                    {table.qr_code_url ? 'Regenerate QR Code' : 'Generate QR Code'}
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleDownloadQR(table.qr_code_url, table.table_number)}
                disabled={!table.qr_code_url}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent border border-owner-surface text-gray-300 hover:text-white hover:border-gray-500 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:border-owner-surface disabled:hover:text-gray-300"
              >
                <Download size={16} /> Download Print File
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablesManagerView;
