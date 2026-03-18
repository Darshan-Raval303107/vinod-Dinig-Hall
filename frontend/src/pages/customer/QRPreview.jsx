import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, Smartphone, Monitor, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRPreview = () => {
  const navigate = useNavigate();
  const [qrUrl, setQrUrl] = useState('');
  
  useEffect(() => {
    // In a real app, this would be the ngrok or production URL
    // For now, we use the current origin
    setQrUrl(window.location.origin);
  }, []);

  return (
    <div className="theme-customer min-h-screen bg-[#FBF7F0] font-jakarta pb-20">
      <header className="px-8 pt-16 pb-8 flex items-center justify-between sticky top-0 backdrop-blur-3xl bg-white/80 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-customer-surface/30 text-customer-text/60 hover:text-customer-accent transition-all active:scale-90 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-fraunces text-3xl font-black text-customer-text leading-none italic">Share Experience</h1>
            <p className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-customer-accent animate-pulse"></span> Landing Page QR
            </p>
          </div>
        </div>
      </header>

      <div className="px-8 mt-12 flex flex-col items-center">
        {/* The QR Container */}
        <div className="relative group perspective-1000">
          <div className="w-80 h-96 bg-white rounded-[4rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-4 border-white relative overflow-hidden flex flex-col items-center justify-between transform transition-transform duration-700 hover:rotate-y-12">
            
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-customer-accent to-orange-400"></div>
            
            <div className="text-center">
               <div className="font-fraunces text-3xl font-black italic text-customer-accent mb-1 tracking-tight">Vinnod</div>
               <div className="text-[10px] font-black tracking-[0.4em] text-zinc-300 uppercase italic">Cinematic Dining</div>
            </div>

            {/* QR Code Placeholder/Generated */}
            <div className="w-56 h-56 bg-white border-8 border-customer-bg rounded-[3rem] p-6 shadow-inner flex items-center justify-center relative">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&color=1c1917&bgcolor=ffffff&margin=1`} 
                 alt="Landing Page QR"
                 className="w-full h-full object-contain rounded-2xl"
               />
               {/* Center Logo/Icon overlap (Optional) */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-customer-bg">
                     <div className="w-5 h-5 bg-customer-accent rounded-sm opacity-20"></div>
                  </div>
               </div>
            </div>

            <div className="text-center w-full px-4">
               <div className="text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase mb-4">Scan to experience</div>
               <div className="flex items-center justify-center gap-2 px-6 py-3 bg-customer-bg rounded-2xl text-[9px] font-bold text-customer-text/60 truncate">
                  <Globe size={12} /> {qrUrl}
               </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-12">
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[2.5rem] border border-customer-surface/30 shadow-sm hover:shadow-xl transition-all active:scale-95 group">
                <div className="w-14 h-14 bg-customer-accent/10 rounded-2xl flex items-center justify-center text-customer-accent group-hover:scale-110 transition-transform">
                    <Download size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-customer-text/40">Download</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[2.5rem] border border-customer-surface/30 shadow-sm hover:shadow-xl transition-all active:scale-95 group">
                <div className="w-14 h-14 bg-customer-text/5 rounded-2xl flex items-center justify-center text-customer-text group-hover:scale-110 transition-transform">
                    <Share2 size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-customer-text/40">Share Link</span>
            </button>
        </div>

        {/* Mobile App Like Instructions */}
        <div className="mt-16 bg-zinc-950 text-white p-10 rounded-[4rem] w-full max-w-sm relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-40 h-40 bg-customer-accent/20 rounded-full blur-[80px] -mr-10 -mt-20"></div>
           
           <h3 className="font-fraunces text-2xl font-bold mb-8 relative z-10 italic">Mobile-First <br/><span className="text-customer-accent">Experience</span></h3>
           
           <ul className="space-y-6 relative z-10">
              <li className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Smartphone size={18} className="text-customer-accent" />
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Pure Responsive</h4>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Fluid layouts optimized for edge-to-edge mobile viewing.</p>
                 </div>
              </li>
              <li className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Monitor size={18} className="text-zinc-500" />
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Smooth Sync</h4>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Real-time updates between your device and our kitchen.</p>
                 </div>
              </li>
           </ul>

           <button 
             onClick={() => navigate('/')}
             className="w-full mt-10 py-5 bg-customer-accent text-white rounded-[1.8rem] font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl hover:shadow-customer-accent/20 transition-all active:scale-95"
           >
             Launch Experience
           </button>
        </div>
      </div>
    </div>
  );
};

export default QRPreview;
