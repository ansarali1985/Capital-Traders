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
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'tyres' | 'media' | 'settings'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{current: number, total: number} | null>(null);
  
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({});
  const [tyreForm, setTyreForm] = useState<Partial<Tyre>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Enterprise Media Config
  const [cloudName, setCloudName] = useState(localStorage.getItem('ct_cloud_name') || '');
  const [uploadPreset, setUploadPreset] = useState(localStorage.getItem('ct_cloud_preset') || '');

  const storageMetrics = useMemo(() => {
    const localTyres = state.tyres.filter(t => t.image.startsWith('data:'));
    const localBrands = state.brands.filter(b => b.logo.startsWith('data:'));
    const jsonSize = JSON.stringify(state).length / 1024;
    
    return {
      localImagesCount: localTyres.length + localBrands.length,
      cloudImagesCount: (state.tyres.length + state.brands.length) - (localTyres.length + localBrands.length),
      jsonSize: jsonSize.toFixed(2),
      health: jsonSize > 120 ? 'CRITICAL' : jsonSize > 70 ? 'WARNING' : 'HEALTHY',
      isBlocked: jsonSize > 140 // npoint physical limit
    };
  }, [state]);

  const uploadToCloudinary = async (file: File | string): Promise<string> => {
    if (!cloudName || !uploadPreset) throw new Error("CONFIG_MISSING");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("UPLOAD_FAILED");
    const data = await response.json();
    return data.secure_url;
  };

  const migrateAllToCloud = async () => {
    if (!cloudName || !uploadPreset) {
      alert("Please configure Cloudinary settings first.");
      setActiveTab('media');
      return;
    }

    const localTyres = state.tyres.filter(t => t.image.startsWith('data:'));
    if (localTyres.length === 0) {
      alert("No local images found to migrate.");
      return;
    }

    if (!confirm(`Migrating ${localTyres.length} images to Cloudinary. This will fix the 500 Sync Error. Continue?`)) return;

    setMigrationProgress({ current: 0, total: localTyres.length });
    
    let updatedTyres = [...state.tyres];
    
    try {
      for (let i = 0; i < localTyres.length; i++) {
        const t = localTyres[i];
        setMigrationProgress({ current: i + 1, total: localTyres.length });
        const cloudUrl = await uploadToCloudinary(t.image);
        updatedTyres = updatedTyres.map(item => item.id === t.id ? { ...item, image: cloudUrl } : item);
      }
      updateState({ tyres: updatedTyres });
      alert("Migration Successful! Your database is now lightweight and ready for sync.");
    } catch (err) {
      alert("Migration interrupted. Check internet and Cloudinary limits.");
    } finally {
      setMigrationProgress(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (cloudName && uploadPreset) {
        const url = await uploadToCloudinary(file);
        callback(url);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, size, size);
            callback(canvas.toDataURL('image/jpeg', 0.4));
          };
        };
        reader.readAsDataURL(file);
        alert("Using Local Storage. This will eventually cause Sync Error 500. Use the Media tab to fix.");
      }
    } catch (err) {
      alert("Upload failed. Verify Cloudinary credentials.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveBrand = () => {
    if (!brandForm.name || !brandForm.logo) return;
    if (editingId) {
      updateState({ brands: state.brands.map(b => b.id === editingId ? { ...b, ...brandForm } as Brand : b) });
    } else {
      updateState({ brands: [...state.brands, { ...brandForm, id: 'b' + Date.now() } as Brand] });
    }
    setBrandForm({}); setEditingId(null);
  };

  const saveTyre = () => {
    if (!tyreForm.pattern || !tyreForm.brandId || !tyreForm.price) return;
    if (editingId) {
      updateState({ tyres: state.tyres.map(t => t.id === editingId ? { ...t, ...tyreForm } as Tyre : t) });
    } else {
      updateState({ tyres: [...state.tyres, { ...tyreForm, id: 't' + Date.now(), price: Number(tyreForm.price), stock: 12, image: tyreForm.image || 'https://picsum.photos/seed/tyre/400/300' } as Tyre] });
    }
    setTyreForm({}); setEditingId(null);
  };

  const pushToCloud = async () => {
    if (storageMetrics.isBlocked) {
      alert(`SYNC BLOCKED: Your database is ${storageMetrics.jsonSize}KB (Limit ~140KB). You must migrate images to Cloudinary to continue syncing.`);
      setActiveTab('media');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (!res.ok) throw new Error("SERVER_REJECTION");
      const data = await res.json();
      localStorage.setItem('capital_traders_cloud_id', data.id);
      alert(`SYNC SUCCESS! ID: ${data.id}`);
      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?sync=${data.id}`);
    } catch (e) {
      alert("Server 500 Error: Database payload too large. Migrate images in the Media tab.");
    } finally {
      setIsSyncing(false);
    }
  };

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1";
  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-100 p-3 rounded-xl focus:border-gray-900 focus:outline-none font-bold text-sm transition-all";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 text-center">
          <Logo size="lg" className="mx-auto mb-8 bg-gray-900" />
          <h2 className="text-3xl font-black uppercase mb-8 tracking-tighter">Enterprise Access</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (username === state.adminCredentials.username && password === state.adminCredentials.password) setIsAdminAuthenticated(true); else setLoginError('Invalid Key'); }} className="space-y-6 text-left">
            <div><label className={labelClass}>Admin ID</label><input type="text" className={inputClass} value={username} onChange={e => setUsername(e.target.value)} required /></div>
            <div><label className={labelClass}>Security Key</label><input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required /></div>
            {loginError && <p className="text-red-500 font-bold text-xs">{loginError}</p>}
            <button className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">Unlock System</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      {/* HUD Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group transition-all ${storageMetrics.isBlocked ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
          <p className={labelClass + " text-white/40"}>Sync Payload</p>
          <p className="text-2xl font-black">{storageMetrics.jsonSize} KB</p>
          <p className="text-[9px] font-black uppercase mt-1">{storageMetrics.isBlocked ? 'DATABASE OVERLOAD' : storageMetrics.health + ' HEALTH'}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className={labelClass}>Media Status</p>
          <div className="flex flex-col">
            <span className="text-xs font-black text-green-600 uppercase"><i className="fas fa-cloud mr-1"></i> {storageMetrics.cloudImagesCount} Cloud</span>
            <span className={`text-xs font-black uppercase ${storageMetrics.localImagesCount > 0 ? 'text-amber-500' : 'text-gray-300'}`}><i className="fas fa-hdd mr-1"></i> {storageMetrics.localImagesCount} Local</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className={labelClass}>Inventory</p>
          <p className="text-2xl font-black">{state.tyres.length} Items</p>
        </div>
        <button onClick={pushToCloud} disabled={isSyncing} className={`p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${storageMetrics.isBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-xl`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1">{storageMetrics.isBlocked ? 'Sync Blocked' : 'Global Sync'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-[3rem]">
        {(['overview', 'brands', 'tyres', 'media', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`flex-1 px-4 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-gray-900' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Command Center</h2>
            <p className="text-gray-400 max-w-sm font-medium mb-10">Use the Media tab to migrate local images to the cloud. This solves the 500 Sync Error permanently.</p>
            <div className="flex gap-4">
               <button onClick={() => setActiveTab('media')} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase shadow-xl">Fix Sync Issues</button>
               <button onClick={() => setActiveTab('tyres')} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase shadow-xl">Manage Stock</button>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="animate-fadeIn space-y-8">
            {migrationProgress && (
              <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-10">
                <div className="bg-white p-12 rounded-[3rem] max-w-md w-full text-center">
                  <h3 className="text-2xl font-black mb-4 uppercase">Migrating Assets...</h3>
                  <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${(migrationProgress.current/migrationProgress.total)*100}%` }}></div>
                  </div>
                  <p className="font-black text-xs text-gray-400 uppercase tracking-widest">{migrationProgress.current} / {migrationProgress.total} Images Processed</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 p-10 rounded-[2.5rem]">
              <h3 className="text-2xl font-black mb-4 uppercase text-blue-900">1. Configure Cloudinary</h3>
              <p className="text-sm text-blue-700 font-medium leading-relaxed mb-8 max-w-2xl">
                Cloudinary hosts your images on their servers so your database stays small. This is required for GBs of data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div><label className={labelClass}>Cloud Name</label><input type="text" className={inputClass} value={cloudName} onChange={e => setCloudName(e.target.value)} /></div>
                <div><label className={labelClass}>Upload Preset</label><input type="text" className={inputClass} value={uploadPreset} onChange={e => setUploadPreset(e.target.value)} /></div>
              </div>
              <button onClick={() => { localStorage.setItem('ct_cloud_name', cloudName); localStorage.setItem('ct_cloud_preset', uploadPreset); alert("Saved!"); }} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black uppercase text-xs shadow-lg">Save Config</button>
            </div>

            <div className={`p-10 rounded-[2.5rem] border ${storageMetrics.localImagesCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
               <h3 className="text-2xl font-black mb-4 uppercase">2. Bulk Media Migration</h3>
               <p className="text-sm text-gray-500 font-medium mb-8">
                 Current local blobs found: <strong>{storageMetrics.localImagesCount}</strong>. 
                 Migrating these will reduce your sync size from {storageMetrics.jsonSize}KB to ~10KB.
               </p>
               <button onClick={migrateAllToCloud} className="bg-amber-500 text-white px-10 py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-amber-600">Start Cloud Migration</button>
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-12">
            <div className={`p-8 rounded-[2.5rem] border-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Brand Name</label><input type="text" className={inputClass} value={brandForm.name || ''} onChange={e => setBrandForm({...brandForm, name: e.target.value})} /></div>
              <div><label className={labelClass}>Country</label><input type="text" className={inputClass} value={brandForm.origin || ''} onChange={e => setBrandForm({...brandForm, origin: e.target.value})} /></div>
              <div>
                <label className={labelClass}>Logo</label>
                <div className="relative">
                  <input type="file" className="w-full text-xs opacity-0 absolute inset-0 cursor-pointer z-10" onChange={e => handleFileUpload(e, url => setBrandForm({...brandForm, logo: url}))} />
                  <div className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center ${isUploading ? 'bg-amber-50' : 'bg-white'}`}>
                    <span className="text-[10px] font-black uppercase text-gray-400">{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </div>
                </div>
              </div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Update' : 'Add Brand'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center group relative hover:shadow-xl transition-all">
                  <img src={b.logo} className="w-16 h-16 object-contain mb-4" />
                  <span className="font-black text-[10px] uppercase text-center">{b.name}</span>
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
            <div className={`p-8 rounded-[2.5rem] border-2 grid grid-cols-1 md:grid-cols-5 gap-4 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Brand</label><select className={inputClass} value={tyreForm.brandId || ''} onChange={e => setTyreForm({...tyreForm, brandId: e.target.value})}><option value="">Select...</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={tyreForm.pattern || ''} onChange={e => setTyreForm({...tyreForm, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size</label><input type="text" className={inputClass} value={tyreForm.size || ''} onChange={e => setTyreForm({...tyreForm, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={tyreForm.price || ''} onChange={e => setTyreForm({...tyreForm, price: Number(e.target.value)})} /></div>
              <div>
                <label className={labelClass}>Photo</label>
                <div className="relative">
                  <input type="file" className="w-full text-xs opacity-0 absolute inset-0 cursor-pointer z-10" onChange={e => handleFileUpload(e, url => setTyreForm({...tyreForm, image: url}))} />
                  <div className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center ${isUploading ? 'bg-amber-50' : 'bg-white'}`}>
                    <span className="text-[10px] font-black uppercase text-gray-400">{isUploading ? 'Cloud Upload...' : 'Upload'}</span>
                  </div>
                </div>
              </div>
              <button onClick={saveTyre} className="md:col-span-5 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs shadow-xl">{editingId ? 'Save Inventory Entry' : 'Add to Stock'}</button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-[2rem]">
              <table className="w-full text-left text-[10px] font-black uppercase">
                <thead className="bg-gray-50 text-gray-400"><tr><th className="py-4 px-6">Src</th><th className="py-4 px-6">Brand</th><th className="py-4 px-6">Pattern</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <i className={`fas ${t.image.startsWith('http') ? 'fa-cloud text-green-500' : 'fa-hdd text-amber-500'}`} title={t.image.startsWith('http') ? 'Cloud' : 'Local Blob'}></i>
                    </td>
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
             <h3 className="text-xl font-black mb-8 uppercase tracking-tighter">Identity Management</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
               <div><label className={labelClass}>WhatsApp Contact</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} /></div>
             </div>
             <button onClick={() => { updateState({ businessInfo: editBusiness }); alert("Identity Saved!"); }} className="mt-10 bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
