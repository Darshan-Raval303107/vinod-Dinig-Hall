import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const MenuManagerView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchMenu = () => {
    api.get('/owner/menu')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch menu");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleAvailability = (itemId, currentStatus) => {
    api.put(`/owner/menu/items/${itemId}`, { is_available: !currentStatus })
      .then(() => fetchMenu())
      .catch(console.error);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading menu...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold font-syne text-white mb-2">Menu Manager</h2>
          <p className="text-gray-400">Update items, categories, and manage availability.</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 bg-owner-accent text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(129,140,248,0.3)]">
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div className="bg-owner-surface/30 border border-owner-surface rounded-2xl overflow-hidden mb-8">
        <div className="p-4 border-b border-owner-surface flex justify-between items-center bg-owner-surface/20">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-owner-accent transition-colors"
            />
          </div>
          <div className="flex gap-2 text-sm text-gray-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div> Available</span>
            <span className="flex items-center gap-1 ml-3"><div className="w-2 h-2 rounded-full bg-red-400"></div> Out of Stock</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0F172A]/50 text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-normal">Item Name</th>
                <th className="px-6 py-4 font-normal">Category</th>
                <th className="px-6 py-4 font-normal">Type</th>
                <th className="px-6 py-4 font-normal">Price</th>
                <th className="px-6 py-4 font-normal text-center">Status</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-owner-surface/50">
              {categories.map(cat => 
                cat.items
                  .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                  .map(item => (
                  <tr key={item.id} className="hover:bg-owner-surface/20 transition-colors group">
                    <td className="px-6 py-4 text-white font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-gray-400">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-owner-surface/50 border border-owner-surface/80 text-xs">
                        {cat.icon} {cat.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block w-2.5 h-2.5 rounded-sm border ${item.is_veg ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'}`}></span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">₹{item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.is_available ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-white rounded bg-owner-surface hover:bg-owner-surface/80 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-400 rounded bg-owner-surface hover:bg-owner-surface/80 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuManagerView;
