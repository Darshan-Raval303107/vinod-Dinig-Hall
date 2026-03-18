import { useMemo, useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Check, Ban, Clock, ChefHat } from 'lucide-react';

const emptyForm = {
  id: null,
  name: '',
  price: '',
  category_id: '',
  is_veg: true,
  description: '',
  prep_time: '',
  is_available: true,
  photo: null,
};

const MenuManagerView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const fetchMenu = () => {
    api.get('/owner/menu')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch menu", err);
        setError('Network synchronization failure. Retrying...');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleAvailability = (itemId, currentStatus) => {
    // Optimistic UI update for immediate feedback
    const originalCategories = [...categories];
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.map(item => item.id === itemId ? { ...item, is_available: !item.is_available } : item)
    })));

    api.put(`/owner/menu/items/${itemId}`, { is_available: !currentStatus })
      .catch(err => {
        setCategories(originalCategories);
        console.error(err);
      });
  };

  const allItems = useMemo(() => {
    const items = [];
    for (const cat of categories) {
      for (const item of (cat.items || [])) {
        items.push({ ...item, category_name: cat.name, category_icon: cat.icon });
      }
    }
    return items;
  }, [categories]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(i => (i.name || '').toLowerCase().includes(q));
  }, [allItems, search]);

  const openCreateModal = () => {
    const defaultCategory = categories?.[0]?.id || '';
    setEditingItem(null);
    setForm({ ...emptyForm, category_id: defaultCategory });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      id: item.id,
      name: item.name || '',
      price: item.price ?? '',
      category_id: item.category_id || '',
      is_veg: !!item.is_veg,
      description: item.description || '',
      prep_time: item.prep_time ?? '',
      is_available: item.is_available !== false,
      photo: null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', String(form.price));
      fd.append('category_id', form.category_id);
      fd.append('is_veg', form.is_veg ? 'true' : 'false');
      fd.append('is_available', form.is_available ? 'true' : 'false');
      fd.append('description', form.description || '');
      fd.append('prep_time', form.prep_time === '' ? '' : String(form.prep_time));
      if (form.photo) fd.append('photo', form.photo);

      if (editingItem?.id) {
        await api.put(`/owner/menu/items/${editingItem.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/owner/menu/items', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      closeModal();
      fetchMenu();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to save item');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
  };

  const confirmDelete = (item) => setDeletingItem(item);
  const cancelDelete = () => setDeletingItem(null);
  const doDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await api.delete(`/owner/menu/items/${deletingItem.id}`);
      setDeletingItem(null);
      fetchMenu();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to delete item');
    }
  };

  if (loading) return (
    <div className="p-12 h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Inventory Syncing</p>
    </div>
  );

  return (
    <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"></div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Inventory Core</span>
          </div>
          <h2 className="text-5xl font-extrabold font-syne text-slate-900 tracking-tighter italic">Cuisine Vault</h2>
          <p className="text-slate-400 font-medium mt-2">Precision management for your culinary offerings.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center gap-3 px-8 h-14 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} /> Add New Formulation
        </button>
      </header>

      {error && (
        <div className="mb-6 p-5 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black tracking-widest uppercase rounded-2xl flex items-center gap-3 animate-pulse">
          <Ban size={16} /> Error Alert: {error}
        </div>
      )}

      {/* Modern Table System */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-80 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Query Inventory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 h-12 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"></div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">In Stock</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.2)]"></div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Out of Stock</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Formation</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Visual</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Unit Class</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Valuation</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="text-md font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{item.description || 'Void Description'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative group/img">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-125" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 italic font-black text-xs">NO-IMG</div>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-bold text-indigo-600 uppercase tracking-[0.1em]">
                      {item.category_icon} {item.category_name}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                       <span className="text-xl font-black text-slate-900 italic">₹{item.price.toFixed(0)}</span>
                       <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Base INR</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center">
                       <button 
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                        className={`group/sw w-12 h-6 rounded-full p-1 transition-all duration-300 ${item.is_available ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${item.is_available ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => openEditModal(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center grayscale opacity-20">
               <Ban size={64} className="text-slate-300" />
               <p className="mt-4 font-black text-xs uppercase tracking-[0.5em] text-slate-400">No Data Matching Query</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SYSTEM — Premium Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden">
            <header className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 font-syne tracking-tighter">
                  {editingItem ? 'Reconfigure Formulation' : 'New Culinary Entry'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Matrix Interface Version 3.4</p>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-900 border border-slate-100 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto hide-scrollbar">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Item Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="Example: TRUFFLE MUSHROOM RISOTTO"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Classification</label>
                <div className="relative">
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white appearance-none italic transition-all"
                    required
                  >
                    <option value="" disabled>Select Matrix Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChefHat size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Valuation (INR)</label>
                <div className="relative">
                  <input
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    type="number"
                    className="w-full pl-12 pr-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300"
                    placeholder="00.00"
                    required
                  />
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">₹</span>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                 <button 
                   type="button"
                   onClick={() => setForm(f => ({ ...f, is_veg: !f.is_veg }))}
                   className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all ${
                     form.is_veg ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'
                   }`}
                 >
                   <Check size={16} /> {form.is_veg ? 'VEGETARIAN CORE' : 'ENABLE VEG-ONLY FLAG'}
                 </button>
                 <button 
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                    className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all ${
                      form.is_available ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <Clock size={16} /> {form.is_available ? 'STOCK LIVE' : 'HALTED'}
                  </button>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Detailed Protocol</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="Composition details..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic">Imaging System</label>
                <div className="group relative w-full h-32 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center hover:border-indigo-500/50 hover:bg-indigo-50/30 transition-all cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }))}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <ImageIcon size={32} className="text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                  <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600">
                    {form.photo ? `SELECTED: ${form.photo.name.toUpperCase()}` : 'DEPLOY NEW VISUAL ASSET'}
                  </p>
                </div>
              </div>

              <footer className="md:col-span-2 flex items-center justify-end gap-6 pt-10 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all italic underline underline-offset-8"
                >
                  Terminate Process
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-10 h-16 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 active:scale-95 flex items-center gap-3"
                >
                  {isSaving ? 'UPLOADING...' : (editingItem ? 'COMMIT CHANGES' : 'GENERATE ENTRY')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Premium Confirm State */}
      {deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="p-12 text-center max-w-lg w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100">
            <div className="w-24 h-24 bg-rose-50 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto mb-10 text-rose-500 animate-pulse">
               <Ban size={40} />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 font-syne tracking-tighter mb-4 italic">Irreversible Deletion</h3>
            <p className="text-slate-400 uppercase text-[10px] font-black tracking-widest leading-relaxed mb-12">
              You are about to purge <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded italic">"{deletingItem.name.toUpperCase()}"</span> from the database. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={doDelete}
                className="w-full h-16 bg-rose-600 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20"
              >
                PROCEED WITH PURGE
              </button>
              <button
                onClick={cancelDelete}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
              >
                CANCEL & RETAIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagerView;
