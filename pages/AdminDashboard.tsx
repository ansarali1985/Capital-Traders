import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Brand, Tyre, BusinessInfo, AppTheme } from '../types.ts';
import { THEMES } from '../constants.ts';
import Logo from '../components/Logo.tsx';

interface AdminDashboardProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  onNavigate: (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  state, 
  updateState, 
  onNavigate, 
  isAdminAuthenticated, 
  setIsAdminAuthenticated 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'tyres' | 'optimizer' | 'settings'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({});
  const [tyreForm, setTyreForm] = useState<Partial<Tyre>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);
  const [editingId, setEditingId] = useState<string | null>(null);

  const dbInfo = useMemo(() => {
    const jsonString = JSON.stringify(state);
    const sizeInKb = jsonString.length / 1024;
    const limit = 125; // npoint safe limit
    return {
      size: sizeInKb.toFixed(2),
      percentage: Math.min((sizeInKb / limit) * 100, 100),
      isCritical: sizeInKb > limit,
      isWarning: sizeInKb > (limit * 0.7)
    };
  }, [state]);

  const stats = useMemo(() => {
    const tyres = state?.tyres || [];
    const totalValue = tyres.reduce((acc, t) => acc + ((t.price || 0) * (t.stock || 0)), 0);
    const totalUnits = tyres.reduce((acc, t) => acc + (t.stock || 0), 0);
    return { totalValue, totalUnits };
  }, [state?.tyres]);

  useEffect(() => {
    if (state?.businessInfo) setEditBusiness(state.businessInfo);
  }, [state?.businessInfo]);

  // High-efficiency compression
  const compressImage = (base64Str: string, quality = 0.4, maxWidth = 150): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Str);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 0.5, 200);
        callback(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    try {
      const newTyres = await Promise.all(state.tyres.map(async (t) => {
        if (t.image.startsWith('data:image')) {
          const compressed = await compressImage(t.image, 0.3, 120);
          return { ...t, image: compressed };
        }
        return t;
      }));

      const newBrands = await Promise.all(state.brands.map(async (b) => {
        if (b.logo.startsWith('data:image')) {
          const compressed = await compressImage(b.logo, 0.3, 80);
          return { ...b, logo: compressed };
        }
        return b;
      }));

      updateState({ tyres: newTyres, brands: newBrands });
      alert("Database Optimized! Storage space reclaimed.");
    } catch (e) {
      alert("Optimization failed.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const pushToCloud = async (liteMode = false) => {
    setIsSyncing(true);
    
    let payload = state;
    if (liteMode) {
      // Strip all base64 images for an ultra-light sync
      payload = {
        ...state,
        tyres: state.tyres.map(t => ({ ...t, image: 'https://picsum.photos/seed/lite/200/200' })),
        brands: state.brands.map(b => ({ ...b, logo: 'https://picsum.photos/seed/lite/100/100' }))
      };
    }

    const jsonString = JSON.stringify(payload);

    try {
      const response = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString
      });
      
      if (!response.ok) {
        if (!liteMode) {
          if (confirm(`Full sync failed due to size (${dbInfo.size}KB). Would you like to try 'Lite Sync' (Text only, no images)?`)) {
            return pushToCloud(true);
          }
        }
        throw new Error(`Cloud Rejection: ${response.status}`);
      }
      
      const result = await response.json();
      const syncId = result.id;
      localStorage.setItem('capital_traders_cloud_id', syncId);
      const shareUrl = `${window.location.origin}${window.location.pathname}?sync=${syncId}`;
      navigator.clipboard.writeText(shareUrl);
      alert(`SYNC SUCCESSFUL!\n\nID: ${syncId}\n\nLink copied to clipboard.`);
    } catch (e: any) {
      alert(`Sync Error: ${e.message}\nPlease optimize your database first.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === state.adminCredentials.username && password === state.adminCredentials.password) {
      setIsAdminAuthenticated(true);
    } else {
      setLoginError('Invalid enterprise credentials.');
    }
  };

  const saveBrand = () => {
    if (!brandForm.name) return;
    if (editingId) {
      updateState({ brands: state.brands.map(b => b.id === editingId ? { ...b, ...brandForm } as Brand : b) });
    } else {
      updateState({ brands: [...state.brands, { ...brandForm, id: 'b' + Date.now(), logo: brandForm.logo || 'https://picsum.photos/seed/default/100/100' } as Brand] });
    }
    setBrandForm({}); setEditingId(null);
  };

  const saveTyre = () => {
    if (!tyreForm.pattern || !tyreForm.brandId) return;
    if (editingId) {
      updateState({ tyres: state.tyres.map(t => t.id === editingId ? { ...t, ...tyreForm } as Tyre : t) });
    } else {
      updateState({ tyres: [...state.tyres, { ...tyreForm, id: 't' + Date.now(), price: Number(tyreForm.price) || 0, stock: Number(tyreForm.stock) || 0, image: tyreForm.image || 'https://picsum.photos/seed/default/400/300' } as Tyre] });
    }
    setTyreForm({}); setEditingId(null);
  };

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1";
  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-100 p-3 rounded-xl focus:border-gray-900 focus:outline-none font-bold";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 text-center">
          <Logo size="lg" className="mx-auto mb-8 bg-gray-900" />
          <h2 className="text-3xl font-black uppercase mb-8 tracking-tighter">Enterprise Access</h2>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div><label className={labelClass}>Admin ID</label><input type="text" className={inputClass} value={username} onChange={e => setUsername(e.target.value)} required /></div>
            <div><label className={labelClass}>Security Key</label><input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required /></div>
            {loginError && <p className="text-red-500 font-bold text-xs">{loginError}</p>}
            <button className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">Unlock System</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      {/* HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-xl">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Total Assets</p>
          <p className="text-2xl font-black">Rs. {stats.totalValue.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-[2.5rem] border shadow-sm ${dbInfo.isCritical ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cloud Capacity</p>
          <div className="flex items-center gap-3">
             <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${dbInfo.isCritical ? 'bg-red-500' : dbInfo.isWarning ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${dbInfo.percentage}%` }}></div>
             </div>
             <span className={`text-xs font-black ${dbInfo.isCritical ? 'text-red-600' : 'text-gray-900'}`}>{dbInfo.size}KB</span>
          </div>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-[2.5rem] shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Level</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalUnits} Units</p>
        </div>
        <button 
          onClick={() => pushToCloud()} 
          disabled={isSyncing}
          className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-xl`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Cloud Sync'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-[3rem]">
        {(['overview', 'brands', 'tyres', 'optimizer', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`flex-1 px-4 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-gray-900' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
        <button onClick={() => setIsAdminAuthenticated(false)} className="px-6 py-4 rounded-[2.5rem] text-[10px] font-black uppercase text-red-500 hover:bg-red-50">Log Out</button>
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fas fa-server text-5xl text-gray-100 mb-6"></i>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Capital Traders Enterprise</h2>
            <p className="text-gray-400 max-w-sm font-medium mb-10">Centralized control for your tyre inventory. Use the Optimizer tool if you encounter sync errors.</p>
          </div>
        )}

        {activeTab === 'optimizer' && (
          <div className="animate-fadeIn py-4">
            <h3 className="text-2xl font-black mb-6 uppercase">Database Optimizer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Health Check</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex justify-between items-center text-sm font-bold">
                    <span>Tyres in State:</span>
                    <span className="text-gray-500">{state.tyres.length}</span>
                  </li>
                  <li className="flex justify-between items-center text-sm font-bold">
                    <span>Brands in State:</span>
                    <span className="text-gray-500">{state.brands.length}</span>
                  </li>
                  <li className="flex justify-between items-center text-sm font-bold">
                    <span>Base64 Bloat:</span>
                    <span className={dbInfo.isCritical ? 'text-red-500' : 'text-green-500'}>{dbInfo.isCritical ? 'Critical' : 'Healthy'}</span>
                  </li>
                </ul>
                <button 
                  onClick={runOptimization}
                  disabled={isOptimizing}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isOptimizing ? 'Compressing Assets...' : 'One-Click Optimization'}
                </button>
              </div>

              <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Lite Sync Option</p>
                <p className="text-sm text-blue-700 font-medium mb-8 leading-relaxed">
                  If your internet is slow or your database is extremely large, use Lite Sync. This saves all your prices, names, and stock but replaces images with placeholders for the cloud version.
                </p>
                <button 
                  onClick={() => pushToCloud(true)}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all"
                >
                  Perform Lite Sync
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-12">
            <div className={`p-8 rounded-[2.5rem] border-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Brand Name</label><input type="text" className={inputClass} value={brandForm.name || ''} onChange={e => setBrandForm({...brandForm, name: e.target.value})} /></div>
              <div><label className={labelClass}>Origin</label><input type="text" className={inputClass} value={brandForm.origin || ''} onChange={e => setBrandForm({...brandForm, origin: e.target.value})} /></div>
              <div><label className={labelClass}>Logo</label><input type="file" className="w-full text-xs" accept="image/*" onChange={e => handleFileUpload(e, b64 => setBrandForm({...brandForm, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Update Brand' : 'Register Brand'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col items-center group relative hover:shadow-xl transition-all">
                  <img src={b.logo} className="w-16 h-16 object-contain mb-4" />
                  <span className="font-black text-[10px] text-center uppercase mb-4">{b.name}</span>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(b.id); setBrandForm(b); }} className="text-blue-500 text-[10px] font-black">Edit</button>
                    <button onClick={() => updateState({ brands: state.brands.filter(x => x.id !== b.id) })} className="text-red-500 text-[10px] font-black">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tyres' && (
          <div className="space-y-8">
            <div className={`p-8 rounded-[2.5rem] border-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Brand</label><select className={inputClass} value={tyreForm.brandId || ''} onChange={e => setTyreForm({...tyreForm, brandId: e.target.value})}><option value="">Select...</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={tyreForm.pattern || ''} onChange={e => setTyreForm({...tyreForm, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size</label><input type="text" className={inputClass} value={tyreForm.size || ''} onChange={e => setTyreForm({...tyreForm, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={tyreForm.price || ''} onChange={e => setTyreForm({...tyreForm, price: Number(e.target.value)})} /></div>
              <button onClick={saveTyre} className="md:col-span-4 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Update Stock' : 'Add New Tyre'}</button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-[2rem]">
              <table className="w-full text-left text-[10px] font-black uppercase">
                <thead className="bg-gray-50 text-gray-400"><tr><th className="py-4 px-6">Brand</th><th className="py-4 px-6">Pattern</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-6">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="py-4 px-6 text-gray-900">{t.pattern} ({t.size})</td>
                    <td className="py-4 px-6">Rs. {t.price.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right space-x-4">
                      <button onClick={() => { setEditingId(t.id); setTyreForm(t); }} className="text-blue-500">Edit</button>
                      <button onClick={() => updateState({ tyres: state.tyres.filter(x => x.id !== t.id) })} className="text-red-500">Del</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
             <h3 className="text-xl font-black mb-8 uppercase">Enterprise Identity</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
               <div><label className={labelClass}>Support WhatsApp</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} /></div>
             </div>
             <button onClick={() => updateState({ businessInfo: editBusiness })} className="mt-10 bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Apply Identity Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
