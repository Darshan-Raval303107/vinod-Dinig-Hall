import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../api/axios';
import { ShieldCheck, ArrowRight, Lock, Mail, Loader2, Globe } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      
      setAuth(user, access_token);
      
      const from = location.state?.from?.pathname || '/';
      
      if (from !== '/') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'chef') {
          navigate('/chef/dashboard');
        } else if (user.role === 'owner' || user.role === 'admin') {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.status === 403 ? "Customer login is currently restricted." : (err.response?.data?.msg || 'Authentication failed.'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex flex-col lg:flex-row font-jakarta selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* MOBILE HEADER (Visible only on mobile) */}
      <div className="lg:hidden flex items-center justify-between p-6 pt-[calc(var(--safe-top)+1rem)] bg-white border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
               <Globe size={18} />
            </div>
            <span className="font-syne font-black tracking-tighter text-xl italic">Vinnod</span>
          </div>
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Exit</Link>
      </div>

      {/* LEFT SIDE — Visual Branding / Cinematic Section (Hidden on small mobile, shown on Tablet/Desktop) */}
      <div className="hidden md:flex lg:w-1/2 relative overflow-hidden bg-slate-900 text-white min-h-[30vh] lg:min-h-screen">
        <div className="absolute inset-0 z-0 opacity-20">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)]"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-20">
          <header className="hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                 <Globe size={28} />
              </div>
              <h1 className="font-syne text-4xl font-black text-white italic tracking-tighter">Vinnod</h1>
            </div>
          </header>

          <main>
             <h2 className="font-fraunces text-5xl lg:text-7xl font-black text-white leading-[1.1] italic tracking-tighter mb-8">
               Digital <br/> <span className="text-customer-accent">Hospitality</span> <br/> Redefined.
             </h2>
             <p className="max-w-md text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] leading-loose">
               Connecting physical dining spaces with advanced digital matrix controls.
             </p>
          </main>

          <footer className="hidden lg:flex items-center gap-8 border-t border-white/5 pt-10">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Infrastructure</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-white italic">NODE-01 LIVE</span>
                </div>
             </div>
             <div className="h-10 w-[1px] bg-white/10"></div>
             <p className="text-[10px] font-bold text-white/20 italic tracking-widest uppercase">System Core v4.2</p>
          </footer>
        </div>
      </div>

      {/* RIGHT SIDE — Precision Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-20 bg-[#FBF7F0]">
        <div className="w-full max-w-lg p-8 lg:p-14 bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-white rounded-[3rem] animate-in slide-in-from-bottom-6 lg:slide-in-from-right-10 duration-700">
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-slate-900" size={20} />
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">Security Interface</span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 font-syne tracking-tighter italic">Staff Login</h3>
            <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">Authentication Required for Node Access.</p>
          </header>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 italic">
               <Lock size={14} /> Failed: {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Credential ID</label>
               <div className="relative group">
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full pl-12 pr-6 h-14 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-zinc-200 shadow-inner"
                   placeholder="chef@vinnod.core"
                   required 
                 />
                 <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-200 group-focus-within:text-slate-900 transition-colors" />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Access Key</label>
               <div className="relative group">
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full pl-12 pr-6 h-14 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-zinc-200 shadow-inner"
                   placeholder="••••••••"
                   required 
                 />
                 <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-200 group-focus-within:text-slate-900 transition-colors" />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative w-full h-16 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-[0.98] disabled:opacity-30"
            >
              <div className={`absolute inset-0 bg-emerald-500 transition-transform duration-700 ${isLoading ? 'translate-y-0' : 'translate-y-full'}`}></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                 {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                 ) : (
                    <ShieldCheck size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                 )}
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{isLoading ? 'Syncing...' : 'Enter Dashboard'}</span>
              </div>
            </button>
          </form>
          
          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-100 to-transparent"></div>
            <div className="flex flex-col gap-3 w-full">
               <div className="flex justify-between items-center text-[8px] font-black text-zinc-300 uppercase tracking-widest px-2 italic">
                  <span>Demo Accounts</span>
                  <span className="opacity-50">v4.1</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                     <p className="text-[8px] font-black text-zinc-400 mb-1 uppercase tracking-widest">Chef</p>
                     <p className="text-[9px] font-bold text-slate-900 truncate">chef@vinnod.core</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                     <p className="text-[8px] font-black text-zinc-400 mb-1 uppercase tracking-widest">Owner</p>
                     <p className="text-[9px] font-bold text-slate-900 truncate">owner@vinnod.core</p>
                  </div>
               </div>
            </div>
            <Link to="/" className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em] hover:text-slate-900 transition-all italic underline underline-offset-8 decoration-zinc-100">
               Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
