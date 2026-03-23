import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { IndianRupee, ShoppingBag, Activity, TrendingUp, Users, ArrowUpRight, ChevronDown } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="group relative bg-white border border-zinc-100 rounded-[2.5rem] p-6 lg:p-8 transition-all duration-300 hover:shadow-xl overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full blur-3xl opacity-10 ${colorClass}`}></div>
    
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${
          trend > 0 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-1 italic">{title}</h3>
      <div className="text-3xl lg:text-4xl font-black font-syne tracking-tighter text-slate-900 flex items-baseline gap-1 italic">
        {value}
      </div>
    </div>
  </div>
);

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('today'); 

  const fetchAnalytics = (range) => {
    setLoading(true);
    api.get(`/owner/analytics?range=${range}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const pieData = [
    { name: 'Dine-in', value: 65, color: '#6366F1' },
    { name: 'Takeaway', value: 25, color: '#818CF8' },
    { name: 'Delivery', value: 10, color: '#A5B4FC' },
  ];

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-zinc-300 uppercase tracking-widest italic animate-pulse">Synchronizing Intelligence</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="mb-10 lg:flex lg:justify-between lg:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">Node Intelligence</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black font-syne text-slate-900 tracking-tighter italic">Business Pulse</h2>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2 italic">Real-time telemetry analysis.</p>
        </div>
        
        <div className="mt-8 lg:mt-0 flex overflow-x-auto hide-scrollbar gap-2 -mx-6 px-6 lg:mx-0 lg:px-0">
          {[
            { id: 'today', label: 'Today' },
            { id: 'month', label: '30D' },
            { id: 'year', label: 'Year' },
            { id: 'all', label: 'All' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeframe(range.id)}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                timeframe === range.id 
                  ? 'bg-slate-900 text-white shadow-xl' 
                  : 'bg-zinc-50 text-zinc-400 border border-zinc-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-center sm:text-left">
        <MetricCard 
          title="Gross Revenue" 
          value={`₹${data?.revenue.toLocaleString() || 0}`} 
          icon={IndianRupee} 
          trend={12}
          colorClass="bg-indigo-500"
        />
        <MetricCard 
          title="Orders" 
          value={data?.completed || 0} 
          icon={ShoppingBag} 
          trend={8}
          colorClass="bg-emerald-500"
        />
        <MetricCard 
          title="Active Sessions" 
          value={data?.active || 0} 
          icon={Activity} 
          colorClass="bg-amber-500"
        />
        <MetricCard 
          title="Guest Load" 
          value={((data?.completed || 0) * 2.4).toFixed(0)} 
          icon={Users} 
          colorClass="bg-sky-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-[2.5rem] p-6 lg:p-10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black text-slate-900 font-syne italic">
              Order Distribution
            </h3>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Orders</span>
            </div>
          </div>
          <div className="h-64 lg:h-80 w-full group">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#CBD5E1" 
                  fontSize={8} 
                  fontWeight="900"
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#CBD5E1" 
                  fontSize={8} 
                  fontWeight="900"
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{fill: '#F8FAFC', radius: 10}}
                  contentStyle={{ backgroundColor: '#FFF', borderColor: '#F1F5F9', borderRadius: '1.5rem', padding: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#0F172A' }}
                  labelStyle={{ fontSize: '9px', color: '#94A3B8', fontWeight: '900', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#0F172A" 
                  radius={[8, 8, 8, 8]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-black text-white font-syne mb-10 italic w-full text-left relative z-10">Traffic Vector</h3>
            <div className="h-48 w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none scale-90 group-hover:scale-100 transition-transform">
                 <span className="text-2xl font-black text-white italic">45%</span>
                 <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">Momentum</span>
               </div>
            </div>
            
            <div className="w-full space-y-3 mt-10 relative z-10">
               {pieData.map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{item.name}</span>
                   </div>
                   <span className="text-[10px] font-black text-white italic">{item.value}%</span>
                 </div>
               ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
