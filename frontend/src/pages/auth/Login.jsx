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
      setError(err.response?.status === 403 ? "Customer login is currently restricted." : (err.response?.data?.msg || 'Authentication failed. Check access keys.'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-jakarta selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* LEFT SIDE — Visual Branding / Cinematic Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#FBF7F0]">
        <div className="absolute inset-0 z-0">
           {/* Animated geometric background */}
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03),transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-col justify-between p-20">
          <header>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                 <Globe size={28} />
              </div>
              <h1 className="font-syne text-4xl font-black text-slate-900 italic tracking-tighter">Vinnod</h1>
            </div>
          </header>

          <main>
             <h2 className="font-fraunces text-7xl font-black text-slate-900 leading-none italic tracking-tighter mb-8">
               Digital <br/> <span className="text-indigo-600/30">Hospitality</span> <br/> Redefined.
             </h2>
             <p className="max-w-md text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] leading-loose">
               Connecting physical dining spaces with advanced digital matrix controls. Experience the evolution of order management.
             </p>
          </main>

          <footer className="flex items-center gap-8 border-t border-slate-200/50 pt-10">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Infrastructure Status</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"></div>
                   <span className="text-[10px] font-black text-slate-900 italic">OPERATIONAL NODE-01</span>
                </div>
             </div>
             <div className="h-10 w-[1px] bg-slate-200"></div>
             <p className="text-[10px] font-bold text-slate-400 italic">© {new Date().getFullYear()} Vinnod Network Systems.</p>
          </footer>
        </div>
      </div>

      {/* RIGHT SIDE — Precision Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-lg p-12 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100 rounded-[3rem] animate-in slide-in-from-right-10 duration-1000">
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-indigo-600" size={24} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Auth Protocol</span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 font-syne tracking-tighter italic">Establish Connection</h3>
            <p className="text-slate-400 font-medium text-sm mt-2">Enter your designated access keys to synchronize.</p>
          </header>

          {error && (
            <div className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 italic animate-pulse">
               <Lock size={16} /> Access Denied: {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="relative group">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Credential ID (Email)</label>
               <div className="relative">
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full pl-14 pr-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-200"
                   placeholder="IDENTITY@VINNOD.CORE"
                   required 
                 />
                 <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               </div>
            </div>

            <div className="relative group">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Access Key (Password)</label>
               <div className="relative">
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full pl-14 pr-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-200"
                   placeholder="••••••••••••"
                   required 
                 />
                 <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative w-full h-20 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/10 flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98] disabled:opacity-30"
            >
              <div className="h-14 bg-indigo-600 text-white rounded-[1.5rem] px-8 flex items-center gap-3 group-hover:bg-indigo-500 transition-all">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{isLoading ? 'Syncing...' : 'Authenticate'}</span>
              </div>
              <div className="flex items-center gap-2 font-fraunces italic font-black text-xl pr-6 transition-all group-hover:translate-x-1">
                ENTER <ArrowRight size={22} />
              </div>
            </button>
          </form>
          
          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
            <div className="grid grid-cols-2 gap-4 w-full text-[9px] font-black uppercase tracking-widest text-center italic">
               <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 mb-1">CHEF NODE</p>
                  <p className="text-slate-900">chef@dineflow.com</p>
               </div>
               <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 mb-1">OWNER NODE</p>
                  <p className="text-slate-900">owner@dineflow.com</p>
               </div>
            </div>
            <Link to="/" className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-all">
               Return to Landing Node
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
