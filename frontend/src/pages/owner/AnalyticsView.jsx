import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IndianRupee, ShoppingBag, Activity } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-owner-surface/30 border border-owner-surface rounded-xl p-5">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-owner-surface rounded-lg">
        <Icon size={20} className="text-owner-text" />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <h3 className="text-sm text-gray-400 font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold font-syne tracking-tight text-white">{value}</div>
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

  if (loading) return <div className="p-8 text-gray-400">Loading analytics...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-syne text-white mb-2">Today's Overview</h2>
        <p className="text-gray-400">Track your restaurant's daily performance.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Total Revenue" 
          value={`₹${data.revenue.toFixed(2)}`} 
          icon={IndianRupee} 
          trend={12.5}
        />
        <MetricCard 
          title="Completed Orders" 
          value={data.completed} 
          icon={ShoppingBag} 
          trend={8.2}
        />
        <MetricCard 
          title="Active Orders" 
          value={data.active} 
          icon={Activity} 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-owner-surface/30 border border-owner-surface rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-6">Orders Per Hour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => Math.floor(val)}
                />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="orders" fill="#818CF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-owner-surface/30 border border-owner-surface rounded-xl p-6 flex items-center justify-center flex-col text-center">
            {/* Placeholder for Donut Chart - recharts pie chart is slightly more complex, keeping it simple for phase 4 */}
            <div className="w-48 h-48 rounded-full border-8 border-owner-surface flex items-center justify-center mb-6 relative">
              <div className="absolute top-0 right-0 w-1/2 h-full border-8 border-owner-accent rounded-r-full border-l-0 origin-left transform -rotate-45"></div>
              <div className="text-center z-10 bg-owner-bg rounded-full w-36 h-36 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold font-syne text-white">45%</span>
                <span className="text-xs text-gray-400">Top Dish</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-200 mb-1">Top Selling Items</h3>
            <p className="text-xs text-gray-400">Butter Chicken accounts for 45% of today's sales.</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
