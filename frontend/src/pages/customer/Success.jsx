import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Smartphone, Ticket, Utensils } from 'lucide-react';
import gsap from 'gsap';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const code = searchParams.get('code');

  useEffect(() => {
    // Entrance Animation
    const tl = gsap.timeline();
    
    tl.fromTo(".success-icon", 
      { scale: 0, rotate: -45, opacity: 0 }, 
      { scale: 1, rotate: 0, opacity: 1, duration: 1, ease: "back.out(1.7)" }
    );
    
    tl.fromTo(".success-content > *", 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power4.out" },
      "-=0.5"
    );

    // Auto-redirect to tracking page after 5 seconds
    const timeout = setTimeout(() => {
      window.location.replace(`/order-status/${orderId}`);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [orderId]);

  return (
    <div className="theme-customer min-h-screen bg-[#FBF9F7] font-jakarta flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-customer-accent/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full success-content relative z-10">
        
        {/* Animated Icon */}
        <div className="success-icon w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)] mx-auto mb-10 relative">
          <CheckCircle2 size={48} strokeWidth={2.5} />
          <div className="absolute inset-0 rounded-[2.5rem] border-4 border-emerald-400/30 animate-ping"></div>
        </div>

        <h1 className="font-fraunces text-4xl font-black italic text-customer-text tracking-tighter mb-4 uppercase">
          Order <span className="text-emerald-500">Confirmed</span>
        </h1>
        
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-12">
          Your culinary journey has begun
        </p>

        {/* Pickup Code Card (If applicable) */}
        {code && (
          <div className="bg-white border border-zinc-100 rounded-[3rem] p-10 shadow-2xl shadow-zinc-200/50 mb-10 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-customer-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10">
              <span className="text-[9px] font-black text-customer-accent uppercase tracking-[0.4em] mb-4 block">Store Pickup Code</span>
              <div className="flex items-center justify-center gap-4">
                {code.split('').map((char, i) => (
                  <div key={i} className="w-14 h-18 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center font-fraunces text-4xl font-black italic text-customer-text shadow-inner">
                    {char}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[9px] font-bold text-zinc-300 uppercase tracking-widest italic">
                Show this code at the counter
              </p>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-white/50 backdrop-blur-sm border border-white p-6 rounded-[2rem] flex flex-col items-center gap-2">
                <Smartphone size={16} className="text-zinc-300" />
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Order ID</span>
                <span className="font-mono text-[10px] font-bold text-customer-text">#{orderId?.slice(-6).toUpperCase()}</span>
            </div>
            <div className="bg-white/50 backdrop-blur-sm border border-white p-6 rounded-[2rem] flex flex-col items-center gap-2">
                <Utensils size={16} className="text-zinc-300" />
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Restaurant</span>
                <span className="text-[10px] font-bold text-customer-text">Vinod Dining Hall</span>
            </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => window.location.replace(`/order-status/${orderId}`)}
          className="group relative w-full h-20 bg-customer-text text-white rounded-[2.2rem] shadow-2xl flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98]"
        >
          <div className="h-14 bg-emerald-500 rounded-[1.8rem] px-8 flex items-center gap-3 shadow-lg shadow-emerald-500/20">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <ArrowRight size={14} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Track Live</span>
          </div>

          <div className="flex items-center gap-2 font-fraunces italic text-xl pr-6 transition-all group-hover:translate-x-1">
            CONTINUE <ArrowRight size={22} className="text-customer-accent" />
          </div>
        </button>

        <p className="mt-8 text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em] animate-pulse">
          Redirecting to live tracking in 5s...
        </p>

      </div>
    </div>
  );
};

export default Success;
