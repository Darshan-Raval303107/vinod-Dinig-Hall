import { useMemo, useState, useEffect } from 'react';
import api, { resolveAssetUrl } from '../../api/axios';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Check, Ban, Clock, ChefHat, Filter, ArrowRight } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-zinc-300 uppercase tracking-widest italic animate-pulse">Inventory Syncing</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="mb-10 lg:flex lg:justify-between lg:items-end p-2 lg:p-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">Inventory Hub</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black font-syne text-slate-900 tracking-tighter italic">Menu Items</h2>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2 italic">Manage your restaurant's menu items.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="mt-8 lg:mt-0 w-full lg:w-auto h-16 px-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={18} /> New Item
        </button>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-500 text-[9px] font-black tracking-widest uppercase rounded-2xl flex items-center gap-3 animate-pulse italic">
          <Ban size={14} /> System Alert: {error}
        </div>
      )}

      {/* SEARCH / FILTERS */}
      <div className="mb-10 relative group">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-slate-900" />
          <input 
            type="text" 
            placeholder="Search Menu Items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-16 pl-16 pr-6 bg-zinc-50 border border-zinc-100 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-zinc-200 shadow-inner"
          />
      </div>

      {/* RESPONSIVE GRID / CARDS (Instead of Table on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRows.map(item => (
          <div key={item.id} className="group relative bg-white border border-zinc-100 rounded-[2.5rem] p-6 transition-all duration-300 hover:shadow-xl active:scale-[0.99] flex flex-col">
             <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 shadow-inner relative group/img">
                  {item.image_url ? (
                    <img src={resolveAssetUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                  ) : <div className="w-full h-full flex items-center justify-center text-zinc-200 font-black italic">!</div>}
                  <div className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white ${item.is_available ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="flex gap-2">
                   <button onClick={() => openEditModal(item)} className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 hover:text-slate-900 transition-all active:scale-90">
                      <Edit2 size={16} />
                   </button>
                   <button onClick={() => setDeletingItem(item)} className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-all active:scale-90">
                      <Trash2 size={16} />
                   </button>
                </div>
             </div>

             <div className="mb-6 flex-1">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1 block italic">{item.category_icon} {item.category_name}</span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic line-clamp-1">{item.name}</h3>
                <p className="text-[10px] font-bold text-zinc-300 mt-2 line-clamp-2 italic leading-relaxed">{item.description || 'NO DESCRIPTION ADDED.'}</p>
             </div>

             <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Price</span>
                   <span className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{item.price.toFixed(0)}</span>
                </div>
                
                <button 
                  onClick={() => toggleAvailability(item.id, item.is_available)}
                  className={`flex items-center gap-2 px-4 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    item.is_available 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-red-50 text-red-500 border border-red-100'
                  }`}
                >
                  {item.is_available ? 'LIVE' : 'HALTED'}
                  <div className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                </button>
             </div>
          </div>
        ))}

        {filteredRows.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center grayscale opacity-10 border-2 border-dashed border-slate-900 rounded-[3rem]">
             <Ban size={64} />
             <p className="mt-8 font-black text-[10px] uppercase tracking-[0.5em] italic">No Matches in Vault</p>
          </div>
        )}
      </div>

      {/* FORM MODAL - Transformed for Touch/Mobile Devices */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1001] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="w-full max-w-2xl bg-white h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
             <header className="px-8 py-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 flex-shrink-0"
                     style={{ paddingTop: 'calc(var(--safe-top) + 2rem)' }}>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 font-syne italic leading-none">{editingItem ? 'Edit Entry' : 'New Entry'}</h3>
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2">Menu Item Management</p>
                </div>
                <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-zinc-100 text-zinc-300 hover:text-slate-900 transition-all">
                  <X size={24} />
                </button>
             </header>

             <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-8 py-10 space-y-8 hide-scrollbar">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Formation Name</label>
                   <input
                     value={form.name}
                     onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                     className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner"
                     placeholder="ID: ITEM_NAME"
                     required
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Classification</label>
                      <select
                        value={form.category_id}
                        onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
                        className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-slate-900 appearance-none italic transition-all shadow-inner"
                        required
                      >
                        <option value="" disabled>Select Vector</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name.toUpperCase()}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Price (INR)</label>
                      <input
                        value={form.price}
                        onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                        type="number"
                        className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 shadow-inner"
                        placeholder="000"
                        required
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Veg Toggle Hidden per request - Always true */}
                  <button 
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                    className={`h-16 rounded-2xl border flex items-center justify-center gap-3 text-[9px] font-black tracking-widest uppercase transition-all ${
                      form.is_available ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-zinc-50 border-zinc-100 text-zinc-300'
                    }`}
                  >
                    <Clock size={18} /> {form.is_available ? 'LIVE SCAN' : 'HALT SCAN'}
                  </button>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Operational Description</label>
                   <textarea
                     value={form.description}
                     onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                     rows={4}
                     className="w-full p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-slate-900 shadow-inner italic"
                     placeholder="Detailed composition parameters..."
                   />
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block italic">Visual Asset Overlay</label>
                   <div className="relative h-40 group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setForm(f => ({ ...f, photo: e.target.files?.[0] || null }))}
                        className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center transition-all group-hover:bg-zinc-100/50 group-hover:border-slate-900/20">
                         {form.photo ? (
                            <div className="text-center p-6">
                               <Check className="mx-auto text-emerald-500 mb-2" size={32} />
                               <span className="text-[10px] font-black uppercase text-slate-900 truncate block max-w-xs">{form.photo.name}</span>
                            </div>
                         ) : (
                            <>
                               <ImageIcon size={32} className="text-zinc-200 mb-3" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">Synchronize Image File</span>
                            </>
                         )}
                      </div>
                   </div>
                </div>
             </form>

             <footer className="p-8 border-t border-zinc-100 bg-white flex flex-col md:flex-row gap-4 flex-shrink-0"
                     style={{ paddingBottom: 'calc(var(--safe-bottom) + 2rem)' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full md:w-auto px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-slate-900 transition-all border border-transparent hover:border-zinc-100"
                >
                  Terminate Process
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-16 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {isSaving ? 'UPLOADING...' : (editingItem ? 'COMMIT CHANGES' : 'GENERATE ENTRY')}
                  <ArrowRight size={18} className="text-emerald-500" />
                </button>
             </footer>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deletingItem && (
        <div className="fixed inset-0 z-[1002] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 text-center shadow-2xl">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/10">
                <Trash2 size={32} />
             </div>
             <h3 className="text-2xl font-black italic text-slate-900 tracking-tighter mb-4">Delete Item</h3>
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed mb-10">
               Confirm irreversible deletion of item <br/>
               <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded italic break-all">"{deletingItem.name}"</span>
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={doDelete} className="w-full h-16 bg-red-600 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                  PROCEDE WITH PURGE
                </button>
                <button onClick={() => setDeletingItem(null)} className="w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-slate-900 transition-all">
                  ABORT
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagerView;
