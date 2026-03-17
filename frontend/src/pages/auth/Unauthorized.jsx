import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldAlert, Globe } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-8 font-jakarta selection:bg-rose-500/20 selection:text-rose-500 overflow-hidden relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[100px] -ml-80 -mt-80 -z-0"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mb-40 -z-0"></div>
      
      <div className="relative z-10 w-full max-w-lg p-12 bg-zinc-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5 rounded-[3rem] text-center animate-in zoom-in-95 duration-700">
        <header className="mb-12">
           <div className="w-24 h-24 bg-rose-500/10 border-2 border-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-rose-500 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse">
              <Lock size={40} />
           </div>
           
           <div className="flex items-center gap-2 justify-center mb-4">
              <ShieldAlert className="text-rose-500/40" size={16} />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">Access Refused</span>
           </div>

           <h1 className="font-syne text-5xl font-black text-white italic tracking-tighter leading-none mb-6">Unauthorized Node Access</h1>
           <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-xs mx-auto">
             Your current security clearance (User Identity) is insufficient to interface with this operational level. 
             Contact the <span className="text-white italic">Matrix Administrator</span> for elevated permissions.
           </p>
        </header>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/login')}
            className="group relative w-full h-20 bg-white text-black rounded-[2rem] shadow-2xl flex items-center justify-between px-3 transition-all active:scale-[0.98]"
          >
             <div className="h-14 bg-rose-600 text-white rounded-[1.5rem] px-8 flex items-center gap-3 transition-colors group-hover:bg-rose-500">
                <Globe size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Re-Authenticate</span>
             </div>
             <div className="flex items-center gap-2 font-fraunces italic font-black text-xl pr-6 transition-all group-hover:translate-x-1">
                LOGIN <ArrowLeft className="rotate-180" size={20} />
             </div>
          </button>

          <button 
            onClick={() => navigate('/')}
            className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-all italic underline underline-offset-8 mt-10 block w-full"
          >
            Return to Public Landing Node
          </button>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-4">
           <div className="flex items-center gap-3 opacity-20">
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Protocol Error: 403-FORBIDDEN</span>
           </div>
           <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.4em] italic leading-none">Vinnod Network Security Matrix v4.1</p>
        </footer>
      </div>
    </div>
  );
};

export default Unauthorized;
