import { useState, useEffect } from 'react';
import api, { API_ORIGIN } from '../../api/axios';
import { QrCode, Download, AlertCircle, Plus, X, Globe, Zap, Printer, Monitor, Server, Trash2, ArrowRight } from 'lucide-react';

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

  const getQrFullUrl = (qrUrl) => {
    if (!qrUrl) return '';
    if (qrUrl.startsWith('http')) return qrUrl;
    return `${API_ORIGIN}${qrUrl}`;
  };

  const handleDownloadQR = async (qrUrl, tableNumber) => {
    if (!qrUrl) return;
    const fullUrl = getQrFullUrl(qrUrl);
    const res = await fetch(fullUrl);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = tableNumber === 0 ? 'WINDOW-PICKUP-STATION.png' : `NODE-T${tableNumber}-ACCESS.png`;
    a.download = filename;
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
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-zinc-300 uppercase tracking-widest italic animate-pulse">Mapping Node Topology</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="mb-10 lg:flex lg:justify-between lg:items-end p-2 lg:p-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">Network Grid</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black font-syne text-slate-900 tracking-tighter italic leading-none">Access Points</h2>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-3 italic">Physical-to-digital interface management.</p>
        </div>
        
        <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {!tables.some(t => t.table_number === 0) && (
            <button
              onClick={() => { setNewTableNumber('0'); setIsAddOpen(true); }}
              className="h-16 px-10 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-3"
            >
              <Zap size={18} /> Deploy Window Station
            </button>
          )}
          <button
            onClick={openAdd}
            className="h-16 px-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Plus size={18} /> Deploy Station
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-500 text-[9px] font-black tracking-widest uppercase rounded-2xl flex items-center gap-3 animate-pulse italic">
          <AlertCircle size={14} /> Telemetry Alert: {error}
        </div>
      )}

      {/* NODE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.sort((a,b) => a.table_number - b.table_number).map(table => (
          <div key={table.id} className="group relative bg-white border border-zinc-100 rounded-[2.5rem] p-6 transition-all duration-300 hover:shadow-xl active:scale-[0.99] flex flex-col">
            <header className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[7px] font-black text-zinc-300 uppercase tracking-tighter leading-none mb-1">NODE</span>
                    <span className="text-xl font-black text-slate-900 italic tracking-tighter leading-none">
                      {table.table_number === 0 ? 'WINDOW' : `T${table.table_number}`}
                    </span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Protocol Status</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                       <div className={`w-1.5 h-1.5 rounded-full ${table.qr_code_url ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                       <span className={`text-[9px] font-black ${table.qr_code_url ? 'text-emerald-500' : 'text-red-500'} italic uppercase tracking-widest`}>
                         {table.qr_code_url ? 'LIVE-LINK' : 'VOID'}
                       </span>
                    </div>
                 </div>
              </div>
            </header>

            <div className="relative mb-8 h-56 bg-zinc-50 border border-zinc-100 rounded-[2rem] p-6 flex flex-col items-center justify-center group/qr shadow-inner">
               {table.qr_code_url ? (
                 <div className="relative z-10 p-3 bg-white rounded-2xl shadow-xl transition-transform duration-500 group-hover/qr:scale-110 group-hover/qr:rotate-2">
                   <img
                     src={getQrFullUrl(table.qr_code_url)}
                     alt={`Node T${table.table_number}`}
                     className="w-24 h-24 object-contain grayscale-[0.3] group-hover/qr:grayscale-0 transition-all"
                   />
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center opacity-10">
                   <Zap size={48} className="text-slate-900" />
                   <p className="mt-4 text-[9px] font-black tracking-widest uppercase text-slate-900 italic text-center">Encryption Ready</p>
                 </div>
               )}
               {table.qr_code_url && <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500/10 animate-[scanline_4s_linear_infinite]"></div>}
            </div>
            
            <footer className="flex gap-3 mt-auto">
              <button 
                onClick={() => handleGenerateQR(table.id)}
                disabled={generating === table.id}
                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest italic transition-all active:scale-95
                  ${table.qr_code_url 
                    ? 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:bg-zinc-100 hover:text-slate-900' 
                    : 'bg-slate-900 text-white shadow-xl'}`}
              >
                {generating === table.id ? 'SYNCING...' : (
                  <>
                    <QrCode size={16} /> 
                    {table.qr_code_url ? 'ROTATE' : 'ACTIVATE'}
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleDownloadQR(table.qr_code_url, table.table_number)}
                disabled={!table.qr_code_url}
                className="w-14 h-14 flex items-center justify-center bg-zinc-50 border border-zinc-100 text-zinc-300 hover:text-slate-900 rounded-2xl transition-all active:scale-95 disabled:opacity-20"
              >
                <Printer size={18} />
              </button>
            </footer>
          </div>
        ))}
        
        {/* ADD NODE PLACEHOLDER */}
        <button 
          onClick={openAdd}
          className="group h-[320px] sm:h-auto border-4 border-dashed border-zinc-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-zinc-50 hover:border-zinc-200"
        >
           <div className="w-16 h-16 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-200 group-hover:text-slate-900 group-hover:border-slate-900 transition-all">
              <Plus size={24} />
           </div>
           <span className="text-[9px] font-black text-zinc-200 group-hover:text-slate-900 uppercase tracking-[0.4em] italic leading-none transition-all">Deploy Interface</span>
        </button>
      </div>

      {/* MODAL SYSTEM */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[1001] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="w-full max-w-lg bg-white h-[60vh] md:h-auto rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
            <header className="px-8 py-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"
                    style={{ paddingTop: 'calc(var(--safe-top) + 2rem)' }}>
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-syne italic leading-none">Initialize Station</h3>
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2">Node Assignment Protocol</p>
              </div>
              <button onClick={closeAdd} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-zinc-100 text-zinc-300 hover:text-slate-900 transition-all">
                <X size={24} />
              </button>
            </header>

            <form onSubmit={createTable} className="p-8 space-y-8 flex-1 overflow-y-auto hide-scrollbar">
              <div className="space-y-3 relative group">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic text-center">Designate Identifier</label>
                <div className="relative">
                  <input
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    type="number"
                    min="1"
                    className="w-full h-20 bg-zinc-50 border border-zinc-100 rounded-3xl text-3xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-all text-center placeholder:text-zinc-100 shadow-inner italic"
                    placeholder="00"
                  />
                  <Monitor size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-100 opacity-0 group-focus-within:opacity-100 transition-all" />
                </div>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-6 flex gap-4 border border-zinc-100">
                 <Server size={20} className="text-zinc-200 shrink-0" />
                 <p className="text-[9px] font-black text-zinc-300 leading-relaxed uppercase tracking-widest italic">
                   System will allocate the next frequency if identifier is null.
                 </p>
              </div>

              <div className="flex flex-col gap-4 mt-8" style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {creating ? 'COMMITTING...' : 'AUTHORIZE DEPLOYMENT'}
                  {!creating && <ArrowRight size={18} className="text-emerald-500" />}
                </button>
                <button
                  type="button"
                  onClick={closeAdd}
                  className="text-[9px] font-black text-zinc-300 uppercase tracking-widest hover:text-slate-900 transition-all underline underline-offset-8 italic"
                >
                  Abort Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER STATS */}
      <footer className="mt-20 pt-10 border-t border-zinc-100 flex justify-between">
         <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1 italic">Nodes Capacity</span>
            <div className="flex items-center gap-2">
               <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{tables.length}</span>
               <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
            </div>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1 italic">Active Uplinks</span>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-3xl font-black text-emerald-500 italic tracking-tighter">{tables.filter(t => t.qr_code_url).length}</span>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default TablesManagerView;
