import { useState, useEffect } from 'react';
import api, { API_ORIGIN } from '../../api/axios';
import { QrCode, Download, AlertCircle, Plus, X, Globe, Zap, Printer, Monitor, Server, Trash2 } from 'lucide-react';

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
        setError('Network telemetry failed. Reconnecting...');
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
        fetchTables();
        setGenerating(null);
      })
      .catch(err => {
        setError("Failed to encrypt node access.");
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
    a.download = `NODE-T${tableNumber}-ACCESS.png`;
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
      setError(err?.response?.data?.msg || 'Failed to initialize table node');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="p-12 h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Mapping Node Topology</p>
    </div>
  );

  return (
    <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.2)]"></div>
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em]">Network Topology</span>
          </div>
          <h2 className="text-5xl font-extrabold font-syne text-slate-900 tracking-tighter italic leading-none">Access Points</h2>
          <p className="text-slate-400 font-medium mt-3">Manage physical-to-digital bridge for restaurant tables.</p>
        </div>
        
        <button
          onClick={openAdd}
          className="flex items-center gap-3 px-8 h-14 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} /> Deploy New Station
        </button>
      </header>

      {error && (
        <div className="mb-6 p-5 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black tracking-widest uppercase rounded-2xl flex items-center gap-3 animate-pulse italic">
          <AlertCircle size={16} /> Telemetry Error: {error}
        </div>
      )}

      {/* NODE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {tables.map(table => (
          <div key={table.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Design Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors"></div>
            
            <header className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-indigo-300 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">NODE</span>
                    <span className="text-2xl font-black text-slate-900 italic tracking-tighter">T{table.table_number}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${table.qr_code_url ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-pulse' : 'bg-rose-500'}`}></div>
                      <span className={`text-[10px] font-black ${table.qr_code_url ? 'text-emerald-600' : 'text-rose-500'} uppercase tracking-widest`}>
                        {table.qr_code_url ? 'LIVE-ENCRYPTED' : 'OFFLINE-VOID'}
                      </span>
                    </div>
                 </div>
              </div>
              
              <button className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                 <Trash2 size={16} />
              </button>
            </header>

            <div className="relative mb-10 h-64 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex items-center justify-center group/qr shadow-inner overflow-hidden">
              {/* Scanline animation */}
              {table.qr_code_url && <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)] animate-[scanline_3s_ease-in-out_infinite] z-20"></div>}
              
              {table.qr_code_url ? (
                <div className="relative z-10 transition-transform duration-500 group-hover/qr:scale-110 group-hover/qr:rotate-3 p-3 bg-white rounded-2xl shadow-xl">
                  <img
                    src={getQrFullUrl(table.qr_code_url)}
                    alt={`Node T${table.table_number}`}
                    className="w-32 h-32 object-contain grayscale-[0.5] group-hover/qr:grayscale-0 transition-all"
                  />
                  <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover/qr:border-indigo-500/10 rounded-2xl transition-all"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-40">
                  <Zap size={48} className="text-slate-200 mb-4" />
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Encryption Required</p>
                </div>
              )}
            </div>
            
            <footer className="flex gap-4 relative z-10">
              <button 
                onClick={() => handleGenerateQR(table.id)}
                disabled={generating === table.id}
                className={`flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest italic transition-all active:scale-95
                  ${table.qr_code_url 
                    ? 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-900' 
                    : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500'}`}
              >
                {generating === table.id ? 'SYNCHRONIZING...' : (
                  <>
                    <QrCode size={16} /> 
                    {table.qr_code_url ? 'ROTATE KEYS' : 'GENERATE ACCESS'}
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleDownloadQR(table.qr_code_url, table.table_number)}
                disabled={!table.qr_code_url}
                className="w-14 h-14 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 disabled:opacity-20 shadow-sm"
                title="Download Print Asset"
              >
                <Printer size={18} />
              </button>
            </footer>
          </div>
        ))}
        
        {/* ADD NODE PLACEHOLDER */}
        <button 
          onClick={openAdd}
          className="group h-full min-h-[400px] border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-indigo-50 hover:border-indigo-200 grayscale hover:grayscale-0"
        >
           <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-300 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-all">
              <Plus size={32} />
           </div>
           <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 uppercase tracking-[0.5em] italic">Deploy New Interface</span>
        </button>
      </div>

      {/* MODAL SYSTEM */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden">
            <header className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 font-syne tracking-tighter italic">Initialize Node</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Station Deployment Protocol</p>
              </div>
              <button onClick={closeAdd} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-900 border border-slate-100 transition-all">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={createTable} className="p-10 space-y-8">
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block italic">Designate Node Identifier</label>
                <div className="relative">
                  <input
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    type="number"
                    min="1"
                    className="w-full pl-14 pr-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-200"
                    placeholder="Auto-increment if null"
                  />
                  <Monitor size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-600 transition-colors" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex gap-4">
                 <Server size={24} className="text-slate-200 flex-shrink-0" />
                 <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
                   The system will automatically allocate the next available frequency in the grid if no explicit ID is provided.
                 </p>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-16 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 active:scale-95 flex items-center justify-center gap-3"
                >
                  {creating ? 'COMMITTING...' : 'AUTHORIZE DEPLOYMENT'}
                  {!creating && <Zap size={16} fill="currentColor" />}
                </button>
                <button
                  type="button"
                  onClick={closeAdd}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all italic underline underline-offset-8"
                >
                  Abort Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER STATS */}
      <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-wrap gap-12">
         <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Network Capacity</span>
            <div className="flex items-end gap-1">
               <span className="text-3xl font-black text-slate-900 italic">{tables.length}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase pb-1.5">Nodes</span>
            </div>
         </div>
         <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Encrypted Broadcast</span>
            <div className="flex items-end gap-1">
               <span className="text-3xl font-black text-emerald-500 italic">{tables.filter(t => t.qr_code_url).length}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase pb-1.5">Active Linkups</span>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default TablesManagerView;
