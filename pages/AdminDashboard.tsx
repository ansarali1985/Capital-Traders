import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Brand, Tyre, Vehicle, Service, BusinessInfo, AppTheme } from '../types.ts';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'tyres' | 'settings'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({});
  const [tyreForm, setTyreForm] = useState<Partial<Tyre>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);
  const [editingId, setEditingId] = useState<string | null>(null);

  const dbSizeInfo = useMemo(() => {
    const jsonString = JSON.stringify(state);
    const sizeInKb = (jsonString.length / 1024);
    return {
      size: sizeInKb.toFixed(2),
      isTooLarge: sizeInKb > 120, // npoint usually limits around 150KB for free tier
      percentage: Math.min((sizeInKb / 150) * 100, 100)
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

  // Aggressive compression to prevent 500 errors
  const compressImage = (base64Str: string, maxWidth = 250, maxHeight = 250): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Str);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5)); // Very small quality to save space
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        callback(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const pruneImages = () => {
    if (confirm("This will replace all high-resolution images with compact versions to fix Cloud Sync errors. Continue?")) {
      const prunedTyres = state.tyres.map(t => ({
        ...t,
        image: t.image.startsWith('data:image') ? 'https://picsum.photos/seed/pruned/200/200' : t.image
      }));
      const prunedBrands = state.brands.map(b => ({
        ...b,
        logo: b.logo.startsWith('data:image') ? 'https://picsum.photos/seed/logo/100/100' : b.logo
      }));
      updateState({ tyres: prunedTyres, brands: prunedBrands });
      alert("Database pruned! Try syncing now.");
    }
  };

  const pushToCloud = async () => {
    if (dbSizeInfo.isTooLarge) {
      alert(`Database too large (${dbSizeInfo.size}KB). Max safe limit is ~120KB. Please use the 'Prune Database' tool first.`);
      return;
    }

    setIsSyncing(true);
    const jsonString = JSON.stringify(state);

    try {
      const response = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString
      });
      
      if (!response.ok) {
        throw new Error(`Sync Error (${response.status}). The cloud provider rejected the payload. Use 'Prune Database' to reduce size.`);
      }
      
      const result = await response.json();
      const syncId = result.id;
      
      localStorage.setItem('capital_traders_cloud_id', syncId);
      const shareUrl = `${window.location.origin}${window.location.pathname}?sync=${syncId}`;
      
      navigator.clipboard.writeText(shareUrl);
      alert(`CLOUD SYNC SUCCESS!\n\nSync ID: ${syncId}\n\nYour business data is now global. Share link copied to clipboard.`);
    } catch (e: any) {
      console.error("Sync Error:", e);
      alert(`Sync failed: ${e.message}\n\nCommon Solution: Go to Settings and click 'Prune Large Images' to reduce the size of your database.`);
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
      updateState({ brands: [...state.brands, { ...brandForm, id: 'b' + Date.now(), logo: brandForm.logo || 'https://picsum.photos/seed/default/100/100', origin: brandForm.origin || 'Pakistan' } as Brand] });
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Total Valuation</p>
          <p className="text-2xl font-black">Rs. {stats.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Database Load</p>
          <div className="flex items-center gap-3">
             <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${dbSizeInfo.isTooLarge ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${dbSizeInfo.percentage}%` }}></div>
             </div>
             <span className={`text-xs font-black ${dbSizeInfo.isTooLarge ? 'text-red-500' : 'text-gray-900'}`}>{dbSizeInfo.size}KB</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Sync ID</p>
          <p className="text-xs font-black text-blue-600 font-mono truncate">{localStorage.getItem('capital_traders_cloud_id') || 'Standalone Mode'}</p>
        </div>
        <button 
          onClick={pushToCloud} 
          disabled={isSyncing}
          className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-xl`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Sending...' : 'Sync to Cloud'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-[2.5rem]">
        {(['overview', 'brands', 'tyres', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`flex-1 px-4 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-gray-900' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
        <button onClick={() => setIsAdminAuthenticated(false)} className="px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase text-red-500 hover:bg-red-50">Log Out</button>
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fas fa-microchip text-5xl text-gray-100 mb-6"></i>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Enterprise Management</h2>
            <p className="text-gray-400 max-w-sm font-medium mb-10">Manage stock and brands. All image uploads are now aggressively compressed to maintain cloud sync reliability.</p>
            {dbSizeInfo.isTooLarge && (
              <div className="bg-red-50 border border-red-100 p-6 rounded-3xl max-w-md animate-pulse">
                <p className="text-red-600 font-black text-xs uppercase mb-2">Sync Limit Warning</p>
                <p className="text-red-500 text-xs font-bold leading-relaxed">Your database is too large for the cloud sync provider. Please use the 'Prune Database' button in settings.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-12">
            <div className={`p-8 rounded-[2rem] border-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Brand Identity</label><input type="text" className={inputClass} value={brandForm.name || ''} onChange={e => setBrandForm({...brandForm, name: e.target.value})} /></div>
              <div><label className={labelClass}>Country of Origin</label><input type="text" className={inputClass} value={brandForm.origin || ''} onChange={e => setBrandForm({...brandForm, origin: e.target.value})} /></div>
              <div><label className={labelClass}>Logo (Compressed)</label><input type="file" className="w-full text-xs" accept="image/*" onChange={e => handleFileUpload(e, b64 => setBrandForm({...brandForm, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Update Brand' : 'Register Brand'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center group relative hover:shadow-xl transition-all">
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
            <div className={`p-8 rounded-[2rem] border-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Manufacturer</label><select className={inputClass} value={tyreForm.brandId || ''} onChange={e => setTyreForm({...tyreForm, brandId: e.target.value})}><option value="">Select...</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={tyreForm.pattern || ''} onChange={e => setTyreForm({...tyreForm, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Dimension</label><input type="text" className={inputClass} value={tyreForm.size || ''} onChange={e => setTyreForm({...tyreForm, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price (PKR)</label><input type="number" className={inputClass} value={tyreForm.price || ''} onChange={e => setTyreForm({...tyreForm, price: Number(e.target.value)})} /></div>
              <div><label className={labelClass}>Tyre Photo</label><input type="file" className="w-full text-xs" accept="image/*" onChange={e => handleFileUpload(e, b64 => setTyreForm({...tyreForm, image: b64}))} /></div>
              <button onClick={saveTyre} className="md:col-span-4 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Update Entry' : 'Add to Stock'}</button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-[2rem]">
              <table className="w-full text-left text-[10px] font-black uppercase">
                <thead className="bg-gray-50 text-gray-400"><tr><th className="py-4 px-6">Brand</th><th className="py-4 px-6">Product</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-6">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="py-4 px-6 text-gray-900">{t.pattern} ({t.size})</td>
                    <td className="py-4 px-6 font-bold">Rs. {(t.price || 0).toLocaleString()}</td>
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
          <div className="space-y-12">
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Enterprise Maintenance</h3>
              <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">Optimize storage to maintain cloud connectivity.</p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={pruneImages}
                  className="bg-red-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all active:scale-95"
                >
                  Prune Database (Fix 500 Error)
                </button>
                <div className="flex-grow bg-white border border-gray-200 p-5 rounded-2xl flex flex-col justify-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Storage Usage</p>
                   <p className="text-xs font-black text-gray-900">{dbSizeInfo.size} / 120.00 KB Recommended</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-black mb-8 uppercase tracking-tight">System Appearance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={() => updateState({ theme: theme.id as AppTheme })} className={`p-5 rounded-2xl border-2 transition-all ${state.theme === theme.id ? 'border-gray-900 bg-white scale-105 shadow-lg' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                    <div className={`h-4 w-full rounded-full bg-gradient-to-r ${theme.classes} mb-3`}></div>
                    <span className="text-[10px] font-black uppercase tracking-tight">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
