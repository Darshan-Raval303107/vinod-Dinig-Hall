import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { IndianRupee, ShoppingBag, Activity, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="group relative bg-[#1E293B]/40 border border-[#334155]/50 rounded-[2rem] p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 ${colorClass}`}></div>
    
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={`p-4 rounded-2xl bg-[#0F172A] border border-[#334155] shadow-inner ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full border ${
          trend > 0 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</h3>
      <div className="text-4xl font-extrabold font-syne tracking-tighter text-white flex items-baseline gap-1">
        {value}
        {title.includes('Revenue') && <span className="text-xs font-bold text-slate-600 ml-1 tracking-normal">INR</span>}
      </div>
    </div>
  </div>
);

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/analytics/today')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const pieData = [
    { name: 'Dine-in', value: 65, color: '#6366F1' },
    { name: 'Takeaway', value: 25, color: '#818CF8' },
    { name: 'Delivery', value: 10, color: '#A5B4FC' },
  ];

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregating Financials</p>
    </div>
  );

  return (
    <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Live Analytics</span>
          </div>
          <h2 className="text-5xl font-extrabold font-syne text-white tracking-tighter">Business Pulse</h2>
          <p className="text-slate-500 font-medium mt-2">Real-time performance metrics for your establishment.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest">
          Export Report <ArrowUpRight size={14} />
        </button>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <MetricCard 
          title="Gross Revenue" 
          value={`₹${data.revenue.toLocaleString()}`} 
          icon={IndianRupee} 
          trend={14.2}
          colorClass="bg-indigo-500"
        />
        <MetricCard 
          title="Orders Processed" 
          value={data.completed} 
          icon={ShoppingBag} 
          trend={6.8}
          colorClass="bg-emerald-500"
        />
        <MetricCard 
          title="Active Sessions" 
          value={data.active} 
          icon={Activity} 
          colorClass="bg-amber-500"
        />
        <MetricCard 
          title="Guest Count" 
          value={(data.completed * 2.4).toFixed(0)} 
          icon={Users} 
          trend={3.1}
          colorClass="bg-sky-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1E293B]/40 border border-[#334155]/50 rounded-[2.5rem] p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-bold text-white font-syne italic">Order Distribution</h3>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-black text-slate-500">ORDERS</span></div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_chart} barGap={8}>
                <CartesianGrid strokeDasharray="0" stroke="#334155" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748B" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)', radius: 10}}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '20px', padding: '15px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '800', color: '#FFF' }}
                  labelStyle={{ fontSize: '10px', color: '#64748B', fontWeight: '900', marginBottom: '5px' }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#6366F1" 
                  radius={[10, 10, 0, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E293B]/40 border border-[#334155]/50 rounded-[2.5rem] p-10 flex flex-col items-center">
            <h3 className="text-lg font-bold text-white font-syne mb-10 italic w-full text-left">Traffic Source</h3>
            <div className="h-60 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
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
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-black text-white">45%</span>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Growth</span>
               </div>
            </div>
            
            <div className="w-full space-y-4 mt-8">
               {pieData.map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                   </div>
                   <span className="text-xs font-bold text-white">{item.value}%</span>
                 </div>
               ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
