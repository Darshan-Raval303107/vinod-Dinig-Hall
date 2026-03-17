import { useMemo, useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';

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
        setError(err?.response?.data?.msg || 'Failed to fetch menu');
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

  if (loading) return <div className="p-8 text-gray-400">Loading menu...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold font-syne text-white mb-2">Menu Manager</h2>
          <p className="text-gray-400">Update items, categories, and manage availability.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-owner-accent text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(129,140,248,0.3)]"
        >
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

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
                <th className="px-6 py-4 font-normal">Photo</th>
                <th className="px-6 py-4 font-normal">Category</th>
                <th className="px-6 py-4 font-normal">Type</th>
                <th className="px-6 py-4 font-normal">Price</th>
                <th className="px-6 py-4 font-normal text-center">Status</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-owner-surface/50">
              {filteredRows.map(item => (
                <tr key={item.id} className="hover:bg-owner-surface/20 transition-colors group">
                  <td className="px-6 py-4 text-white font-medium">{item.name}</td>
                  <td className="px-6 py-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-owner-surface"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-owner-surface/60 border border-owner-surface flex items-center justify-center text-gray-500">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-owner-surface/50 border border-owner-surface/80 text-xs">
                      {item.category_icon} {item.category_name}
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
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-gray-400 hover:text-white rounded bg-owner-surface hover:bg-owner-surface/80 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-400 rounded bg-owner-surface hover:bg-owner-surface/80 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-2xl rounded-2xl border border-owner-surface bg-owner-bg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-owner-surface">
              <div>
                <h3 className="text-lg font-semibold text-white font-syne">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <p className="text-sm text-gray-400">Fill the details and upload a food photo.</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-owner-surface/50 text-gray-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-2">Item Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-owner-surface text-white focus:outline-none focus:border-owner-accent"
                  placeholder="Paneer Tikka"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-owner-surface text-white focus:outline-none focus:border-owner-accent"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Price (₹)</label>
                <input
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-owner-surface text-white focus:outline-none focus:border-owner-accent"
                  placeholder="250"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Prep Time (min)</label>
                <input
                  value={form.prep_time}
                  onChange={(e) => setForm((f) => ({ ...f, prep_time: e.target.value }))}
                  type="number"
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-owner-surface text-white focus:outline-none focus:border-owner-accent"
                  placeholder="15"
                />
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input
                  id="isVeg"
                  checked={form.is_veg}
                  onChange={(e) => setForm((f) => ({ ...f, is_veg: e.target.checked }))}
                  type="checkbox"
                  className="accent-owner-accent"
                />
                <label htmlFor="isVeg" className="text-sm text-gray-300">Veg</label>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input
                  id="isAvailable"
                  checked={form.is_available}
                  onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                  type="checkbox"
                  className="accent-owner-accent"
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-300">Available</label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-owner-surface text-white focus:outline-none focus:border-owner-accent"
                  placeholder="Short description for customers…"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-2">Food Photo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }))}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-owner-surface file:text-white hover:file:bg-owner-surface/80"
                />
                <p className="mt-2 text-xs text-gray-500">
                  PNG/JPG/WebP. Upload optional; you can replace it later.
                </p>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-owner-surface text-gray-300 hover:text-white hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-owner-accent text-white font-semibold hover:bg-indigo-500 disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : (editingItem ? 'Save Changes' : 'Create Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-md rounded-2xl border border-owner-surface bg-owner-bg shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white font-syne mb-2">Delete item?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete <span className="text-white font-semibold">{deletingItem.name}</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2.5 rounded-xl border border-owner-surface text-gray-300 hover:text-white hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagerView;
