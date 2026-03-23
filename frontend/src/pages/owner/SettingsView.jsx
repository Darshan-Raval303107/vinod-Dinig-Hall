import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ShieldCheck, ShieldAlert, Loader2, Save, Fingerprint, Lock, Cpu, Radio, Zap } from 'lucide-react';

const SettingsView = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/owner/settings/user-login');
      setIsEnabled(res.data.user_login_enabled);
      setRestaurantName(res.data.restaurant_name);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/owner/settings/user-login', { enabled: !isEnabled });
      setIsEnabled(res.data.user_login_enabled);
      setMessage({ type: 'success', text: res.data.msg });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update system parameters.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-zinc-300 uppercase tracking-widest italic animate-pulse">Decrypting System Config</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="mb-12 p-2 lg:p-0">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">System Layer Operations</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 font-syne tracking-tighter italic leading-none">Global Override</h2>
        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-3 italic leading-relaxed">Administrative control console for {restaurantName} network.</p>
      </header>

      {message.text && (
        <div className={`mb-10 p-5 rounded-3xl border flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
            : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          <Fingerprint size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest italic leading-tight">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ACCESS TOGGLE CARD */}
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group shadow-sm flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors"></div>
          
          <div className="flex items-start justify-between relative z-10 mb-10">
            <div className="flex items-center gap-4">
               <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-inner ${isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                  {isEnabled ? <Radio size={32} className="animate-pulse" /> : <ShieldAlert size={32} />}
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 font-syne italic tracking-tighter">Broadcast Control</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isEnabled ? 'SYSTEM-LIVE' : 'ACCESS-HALTED'}
                     </span>
                  </div>
               </div>
            </div>

            <button
              onClick={handleToggle}
              disabled={isSaving}
              className={`w-20 h-10 rounded-full p-1.5 transition-all duration-500 relative shadow-inner flex items-center shrink-0
                ${isEnabled ? 'bg-slate-900' : 'bg-zinc-100'} ${isSaving ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`${
                  isEnabled ? 'translate-x-10' : 'translate-x-0'
                } w-7 h-7 rounded-full bg-white transition-all duration-500 shadow-xl flex items-center justify-center`}
              >
                 {isSaving && <Loader2 size={14} className="animate-spin text-slate-900" />}
              </div>
            </button>
          </div>

          <p className="text-[10px] font-bold text-zinc-400 leading-loose uppercase tracking-widest border-t border-zinc-50 pt-8 relative z-10 italic mt-auto">
            When toggled OFF, all <span className="text-slate-900 bg-zinc-50 px-2 py-1 rounded italic">@USER-ROLE</span> nodes will be disconnected. 
            The system will drop active sessions. 
            <span className="text-indigo-600 block mt-4 font-black">@CHEF and @OWNER persistence is maintained.</span>
          </p>
        </div>

        {/* SECURITY INFO CARD */}
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 lg:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <Lock size={20} />
                 </div>
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic">Security Settings</span>
              </div>
              <p className="text-sm font-bold text-white/60 leading-relaxed mb-8 italic">
                Advanced security is active. This toggle restricts customer ordering while maintaining management access. 
                Use only during maintenance windows or emergency shutdowns.
              </p>
           </div>
           
           <div className="p-6 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center gap-4 relative z-10">
              <Cpu size={24} className="text-indigo-400" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Core Integrity</span>
                 <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1 italic">Checksum: NODE-X92-SECURE</span>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-red-50 border border-red-100 rounded-[2.5rem] flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 animate-pulse">
           <Zap size={28} />
        </div>
        <div className="text-center sm:text-left">
           <h4 className="text-lg font-black text-red-500 font-syne uppercase tracking-widest mb-2 italic">Danger Zone</h4>
           <p className="text-[10px] text-red-500/40 font-black uppercase tracking-widest leading-relaxed max-w-2xl italic">
              This switch overrides all customer-facing interfaces. Any unsaved baskets or pending customer queries will be purged from the volatile memory upon deactivation.
           </p>
        </div>
      </div>
      
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100 pt-10 px-4 gap-6 opacity-30">
        <div className="flex items-center gap-4">
           <Save size={14} className="text-slate-400" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Auto-Saved on State Change</span>
        </div>
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">Vinnod Network v4.1 / SECURE</span>
      </footer>
    </div>
  );
};

export default SettingsView;
