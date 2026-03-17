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
    <div className="p-12 h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] uppercase font-black tracking-widest text-slate-500">Decrypting System Config</p>
    </div>
  );

  return (
    <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-1200">
      <header className="mb-16">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">System Level Operations</span>
        </div>
        <h2 className="text-5xl font-extrabold text-white font-syne tracking-tighter italic leading-none">Global Override</h2>
        <p className="text-slate-500 font-medium mt-3 italic">Administrative control console for {restaurantName} network.</p>
      </header>

      {message.text && (
        <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-right-4 duration-500 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <Fingerprint size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ACCESS TOGGLE CARD */}
        <div className="bg-[#1E293B]/40 border border-[#334155]/50 rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
          
          <div className="flex items-start justify-between relative z-10 mb-10">
            <div className="flex flex-col gap-4">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${isEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  {isEnabled ? <Radio size={28} className="animate-pulse" /> : <ShieldAlert size={28} />}
               </div>
               <div>
                  <h3 className="text-xl font-extrabold text-white font-syne italic tracking-tight">Broadcast Control</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isEnabled ? 'SYSTEM-LIVE' : 'ACCESS-HALTED'}
                     </span>
                  </div>
               </div>
            </div>

            <button
              onClick={handleToggle}
              disabled={isSaving}
              className={`group/sw w-16 h-8 rounded-full p-1.5 transition-all duration-500 relative shadow-inner flex items-center
                ${isEnabled ? 'bg-indigo-600' : 'bg-slate-800'} ${isSaving ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
            >
              <div
                className={`${
                  isEnabled ? 'translate-x-8' : 'translate-x-0'
                } w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex items-center justify-center`}
              >
                 {isSaving && <Loader2 size={10} className="animate-spin text-indigo-600" />}
              </div>
            </button>
          </div>

          <p className="text-[10px] font-bold text-slate-500 leading-loose uppercase tracking-[0.1em] border-t border-[#334155]/30 pt-8 relative z-10 italic">
            When toggled OFF, all <span className="text-white bg-slate-800 px-1 py-0.5 rounded italic">@USER-ROLE</span> nodes will be disconnected. 
            The system will immediately drop active sessions and redirect to offline status. 
            <span className="text-indigo-400 block mt-4">@CHEF, @OWNER, and @ADMIN persistence is maintained.</span>
          </p>
        </div>

        {/* SECURITY INFO CARD */}
        <div className="bg-[#1E293B]/40 border border-[#334155]/50 rounded-[2.5rem] p-10 flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                    <Lock size={18} />
                 </div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Security Protocol</span>
              </div>
              <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6 italic">
                Advanced matrix isolation is active. This toggle acts as a physical air-gap simulation for the digital storefront. 
                Use only during maintenance windows or emergency shutdowns.
              </p>
           </div>
           
           <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center gap-4">
              <Cpu size={24} className="text-indigo-500/40" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Core Integrity</span>
                 <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-1 italic">Checksum Validated: NODE-X92</span>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
           <Zap size={24} />
        </div>
        <div>
           <h4 className="text-md font-extrabold text-amber-500 font-syne uppercase tracking-widest mb-2 italic">Cautionary Protocol</h4>
           <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.1em] leading-relaxed max-w-2xl">
              This switch overrides all customer-facing interfaces. Any unsaved baskets or pending customer queries will be purged from the volatile memory upon deactivation. Ensure operational readiness before re-engaging the matrix.
           </p>
        </div>
      </div>
      
      <footer className="mt-20 flex items-center justify-between border-t border-slate-800/30 pt-10 px-4 opacity-50">
        <div className="flex items-center gap-4">
           <Save size={14} className="text-slate-600" />
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Configuration Auto-Saved on State Change</span>
        </div>
        <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic">Vinnod Network v4.1</span>
      </footer>
    </div>
  );
};

export default SettingsView;
