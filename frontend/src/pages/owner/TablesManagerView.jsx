import { useState, useEffect } from 'react';
import api, { API_ORIGIN } from '../../api/axios';
import { QrCode, Download, AlertCircle, Plus, X } from 'lucide-react';

const TablesManagerView = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [creating, setCreating] = useState(false);

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

  const getQrFullUrl = (qrUrl) => `${API_ORIGIN}${qrUrl}`;

  const handleDownloadQR = async (qrUrl, tableNumber) => {
    if (!qrUrl) return;
    const fullUrl = getQrFullUrl(qrUrl);
    const res = await fetch(fullUrl);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${tableNumber}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const openAdd = () => {
    setNewTableNumber('');
    setIsAddOpen(true);
  };
  const closeAdd = () => {
    if (creating) return;
    setIsAddOpen(false);
  };

  const createTable = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const payload = newTableNumber.trim() === '' ? {} : { table_number: Number(newTableNumber) };
      await api.post('/owner/tables', payload);
      setIsAddOpen(false);
      fetchTables();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to create table');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading tables...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold font-syne text-white mb-2">Tables & QR Codes</h2>
          <p className="text-gray-400">Generate and print unique QR codes for each table.</p>
        </div>
        
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-owner-accent text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add New Table
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

            {table.qr_code_url && (
              <div className="mb-4 bg-owner-surface/20 border border-owner-surface rounded-2xl p-4 flex items-center justify-center">
                <img
                  src={getQrFullUrl(table.qr_code_url)}
                  alt={`Table ${table.table_number} QR`}
                  className="w-40 h-40 object-contain"
                />
              </div>
            )}
            
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

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-md rounded-2xl border border-owner-surface bg-owner-bg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-owner-surface">
              <div>
                <h3 className="text-lg font-semibold text-white font-syne">Add Table</h3>
                <p className="text-sm text-gray-400">Leave empty to auto-pick next number (max + 1).</p>
              </div>
              <button onClick={closeAdd} className="p-2 rounded-lg hover:bg-owner-surface/50 text-gray-300">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createTable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Table Number (optional)</label>
                <input
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-owner-surface text-white focus:outline-none focus:border-owner-accent"
                  placeholder="6"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="px-4 py-2.5 rounded-xl border border-owner-surface text-gray-300 hover:text-white hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-owner-accent text-white font-semibold hover:bg-indigo-500 disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesManagerView;
