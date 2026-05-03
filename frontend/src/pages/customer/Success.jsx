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

    const timeout = setTimeout(() => {
      window.location.replace(`/order-status/${orderId}`);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [orderId]);

  return (
    <div className="theme-customer min-h-screen bg-[#FBF9F7] font-jakarta flex flex-col items-center justify-center p-5 text-center overflow-hidden">
      
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-customer-accent/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-sm w-full success-content relative z-10">
        
        {/* Icon */}
        <div className="success-icon w-16 h-16 md:w-20 md:h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-[0_16px_40px_rgba(16,185,129,0.3)] mx-auto mb-6 relative">
          <CheckCircle2 size={32} strokeWidth={2.5} />
          <div className="absolute inset-0 rounded-2xl border-4 border-emerald-400/30 animate-ping"></div>
        </div>

        <h1 className="font-fraunces text-3xl md:text-4xl font-black italic text-customer-text tracking-tighter mb-3 uppercase">
          Order <span className="text-emerald-500">Confirmed</span>
        </h1>
        
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-8 md:mb-12">
          Your culinary journey has begun
        </p>

        {/* Pickup Code Card */}
        {code && (
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xl shadow-zinc-200/50 mb-6 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-customer-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10">
              <span className="text-[8px] font-black text-customer-accent uppercase tracking-widest mb-3 block">Pickup Code</span>
              <div className="flex items-center justify-center gap-2">
                {code.split('').map((char, i) => (
                  <div key={i} className="w-10 h-12 md:w-12 md:h-16 bg-zinc-50 border border-zinc-100 rounded-lg md:rounded-xl flex items-center justify-center font-fraunces text-2xl md:text-3xl font-black italic text-customer-text shadow-inner">
                    {char}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[8px] font-bold text-zinc-300 uppercase tracking-widest italic">
                Show this at the counter
              </p>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          <div className="bg-white/50 backdrop-blur-sm border border-white p-4 rounded-xl flex flex-col items-center gap-1.5">
            <Smartphone size={12} className="text-zinc-300" />
            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Order ID</span>
            <span className="font-mono text-[8px] font-bold text-customer-text">#{orderId?.slice(-6).toUpperCase()}</span>
          </div>
          <div className="bg-white/50 backdrop-blur-sm border border-white p-4 rounded-xl flex flex-col items-center gap-1.5">
            <Utensils size={12} className="text-zinc-300" />
            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Restaurant</span>
            <span className="text-[8px] font-bold text-customer-text">Vinod Dining</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => window.location.replace(`/order-status/${orderId}`)}
          className="group relative w-full h-14 bg-customer-text text-white rounded-2xl shadow-xl flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98]"
        >
          <div className="h-10 bg-emerald-500 rounded-xl px-5 flex items-center gap-2 shadow-lg shadow-emerald-500/20">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ArrowRight size={10} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">Track Live</span>
          </div>

          <div className="flex items-center gap-1.5 font-fraunces italic text-base pr-3 transition-all group-hover:translate-x-1">
            CONTINUE <ArrowRight size={18} className="text-customer-accent" />
          </div>
        </button>

        <p className="mt-6 text-[7px] font-black text-zinc-300 uppercase tracking-widest animate-pulse">
          Redirecting to live tracking in 5s...
        </p>

      </div>
    </div>
  );
};

export default Success;
