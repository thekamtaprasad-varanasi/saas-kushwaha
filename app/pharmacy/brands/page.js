'use client';
import { useEffect, useState, useMemo } from 'react';
import { MEDICINES_BY_CONDITION, CONDITIONS } from '@/lib/medicines';

export default function BrandsPage() {
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategory, setPickerCategory] = useState('All');
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => {
        if (r.status === 401) { window.location.href = '/login'; return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setBrands(data.brands || {});
        setLoading(false);
      });
  }, []);

  // All salts grouped — for picker
  const saltsByCategory = useMemo(() => {
    const map = {};
    for (const c of CONDITIONS) {
      const set = new Set();
      for (const m of MEDICINES_BY_CONDITION[c] || []) {
        const doses = (m.dose || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (doses.length === 0) set.add(m.name);
        else for (const d of doses) set.add(`${m.name} ${d}`);
      }
      map[c] = Array.from(set).sort();
    }
    return map;
  }, []);

  const pickerList = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    let list = [];
    if (pickerCategory === 'All') {
      for (const c of CONDITIONS) list = list.concat(saltsByCategory[c] || []);
      list = Array.from(new Set(list)).sort();
    } else {
      list = saltsByCategory[pickerCategory] || [];
    }
    if (q) list = list.filter((s) => s.toLowerCase().includes(q));
    return list.slice(0, 80);
  }, [saltsByCategory, pickerCategory, pickerSearch]);

  function pickSalt(salt) {
    setBrands((prev) => {
      if (prev[salt]) return prev; // already added
      return { ...prev, [salt]: { brand: '', price: '', expiry: '', stock: '' } };
    });
    setPickerOpen(false);
    setPickerSearch('');
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/brands', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brands }),
    });
    setSaving(false);
    if (!res.ok) { alert('Save failed'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateEntry(salt, field, value) {
    setBrands((prev) => ({
      ...prev,
      [salt]: { ...prev[salt], [field]: value },
    }));
  }

  function removeEntry(salt) {
    setBrands((prev) => {
      const next = { ...prev };
      delete next[salt];
      return next;
    });
  }

  const entries = Object.entries(brands).filter(([salt]) =>
    salt.toLowerCase().includes(search.toLowerCase())
  );

  function isLowStock(val) {
    const n = parseInt(val.stock);
    return !isNaN(n) && n <= 10;
  }

  if (loading) return <p className="text-center mt-20 text-gray-400">Loading...</p>;

  return (
    <>
      <main className="min-h-screen bg-orange-50 p-4 pb-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-orange-800 mt-4 mb-1">Stock &amp; Brands</h1>
          <p className="text-xs text-gray-500 mb-4">
            Pick a medicine, then add its brand, price, stock &amp; expiry date
          </p>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold text-sm mb-4"
          >
            + Add Medicine
          </button>

          {/* Search added list */}
          {Object.keys(brands).length > 4 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search added medicines..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          )}

          {/* List */}
          <div className="flex flex-col gap-2 mb-4">
            {entries.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">No medicines added yet — tap &quot;+ Add Medicine&quot;</p>
            )}
            {entries.map(([salt, val]) => (
              <div key={salt} className="bg-white rounded-2xl shadow p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-700">
                    {salt}
                    {isLowStock(val) && (
                      <span className="ml-2 text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                        LOW
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeEntry(salt)}
                    className="text-xs text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-700">Brand</label>
                    <input
                      type="text"
                      value={val.brand || ''}
                      onChange={(e) => updateEntry(salt, 'brand', e.target.value)}
                      placeholder="Brand name"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-xs font-semibold text-gray-700">Price ₹</label>
                    <input
                      type="text"
                      value={val.price || ''}
                      onChange={(e) => updateEntry(salt, 'price', e.target.value)}
                      placeholder="85"
                      inputMode="decimal"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-700">Stock (qty)</label>
                    <input
                      type="text"
                      value={val.stock || ''}
                      onChange={(e) => updateEntry(salt, 'stock', e.target.value)}
                      placeholder="50"
                      inputMode="numeric"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-700">Expiry (month)</label>
                    <input
                      type="month"
                      value={val.expiry || ''}
                      onChange={(e) => updateEntry(salt, 'expiry', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3 mb-3 text-center">
              ✓ Stock saved
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-60 transition"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </main>

      {/* Salt Picker Modal */}
      {pickerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <p className="font-bold text-gray-800">Select Medicine</p>
              <button onClick={() => setPickerOpen(false)} className="text-gray-400 text-xl">×</button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto p-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setPickerCategory('All')}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap border ${pickerCategory === 'All' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600'}`}
              >
                All
              </button>
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPickerCategory(c)}
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap border ${pickerCategory === c ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search salt..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {pickerList.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No match</p>
              ) : (
                pickerList.map((s) => {
                  const added = !!brands[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickSalt(s)}
                      disabled={added}
                      className={`w-full text-left px-4 py-2.5 border-b border-gray-100 flex justify-between items-center ${added ? 'opacity-50' : 'hover:bg-orange-50'}`}
                    >
                      <span className="text-sm text-gray-800">{s}</span>
                      {added && <span className="text-[10px] text-emerald-600">✓ added</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}