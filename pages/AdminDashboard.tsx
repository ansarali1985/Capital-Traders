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
  
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({});
  const [tyreForm, setTyreForm] = useState<Partial<Tyre>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Enterprise Media Config
  const [cloudName, setCloudName] = useState(localStorage.getItem('ct_cloud_name') || '');
  const [uploadPreset, setUploadPreset] = useState(localStorage.getItem('ct_cloud_preset') || '');

  const storageMetrics = useMemo(() => {
    const localImagesCount = state.tyres.filter(t => t.image.startsWith('data:')).length + 
                         state.brands.filter(b => b.logo.startsWith('data:')).length;
    const cloudImagesCount = (state.tyres.length + state.brands.length) - localImagesCount;
    const jsonSize = JSON.stringify(state).length / 1024;
    
    return {
      localImagesCount,
      cloudImagesCount,
      jsonSize: jsonSize.toFixed(2),
      health: jsonSize > 150 ? 'CRITICAL' : jsonSize > 80 ? 'WARNING' : 'HEALTHY'
    };
  }, [state]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (cloudName && uploadPreset) {
        const url = await uploadToCloudinary(file);
        callback(url);
      } else {
        // Simple compression for small test images
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 150;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, size, size);
            callback(canvas.toDataURL('image/jpeg', 0.4));
          };
        };
        reader.readAsDataURL(file);
        alert("Using Local Storage. For GBs of data, please configure Cloudinary in the Media tab.");
      }
    } catch (err) {
      alert("Upload failed. Verify your Cloudinary settings.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Capital_Traders_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Fix: Implemented saveBrand to handle both creation and updates of brand records.
  const saveBrand = () => {
    if (!brandForm.name || !brandForm.logo) {
      alert("Please provide at least a name and a logo.");
      return;
    }

    if (editingId) {
      const updatedBrands = state.brands.map(b => 
        b.id === editingId ? { ...b, ...brandForm } as Brand : b
      );
      updateState({ brands: updatedBrands });
    } else {
      const newBrand: Brand = {
        id: `b${Date.now()}`,
        name: brandForm.name!,
        origin: brandForm.origin || 'Unknown',
        logo: brandForm.logo!,
      };
      updateState({ brands: [...state.brands, newBrand] });
    }
    setBrandForm({});
    setEditingId(null);
  };

  // Fix: Implemented saveTyre to handle both creation and updates of tyre stock items.
  const saveTyre = () => {
    if (!tyreForm.brandId || !tyreForm.pattern || !tyreForm.size || !tyreForm.price) {
      alert("Please fill in all required fields (Brand, Pattern, Size, Price).");
      return;
    }

    if (editingId) {
      const updatedTyres = state.tyres.map(t => 
        t.id === editingId ? { ...t, ...tyreForm } as Tyre : t
      );
      updateState({ tyres: updatedTyres });
    } else {
      const newTyre: Tyre = {
        id: `t${Date.now()}`,
        brandId: tyreForm.brandId!,
        pattern: tyreForm.pattern!,
        size: tyreForm.size!,
        price: tyreForm.price!,
        stock: 12, // Defaulting stock as no input exists in form
        image: tyreForm.image || 'https://picsum.photos/seed/tyre/400/300',
      };
      updateState({ tyres: [...state.tyres, newTyre] });
    }
    setTyreForm({});
    setEditingId(null);
  };

  const pushToCloud = async () => {
    if (storageMetrics.health === 'CRITICAL') {
      alert("Database is too heavy for cloud sync. Use the 'Media' tab to migrate photos to Cloudinary.");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      const data = await res.json();
      localStorage.setItem('capital_traders_cloud_id', data.id);
      alert(`SYNC SUCCESS\n\nDatabase ID: ${data.id}\nLink copied to clipboard.`);
      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?sync=${data.id}`);
    } catch (e) {
      alert("Sync failed. Check internet or reduce data size.");
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
          <form onSubmit={(e) => { e.preventDefault(); if (username === state.adminCredentials.username && password === state.adminCredentials.password) setIsAdminAuthenticated(true); else setLoginError('Invalid Credentials'); }} className="space-y-6 text-left">
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
        <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><i className="fas fa-database text-4xl"></i></div>
          <p className={labelClass + " text-white/40"}>Sync Payload</p>
          <p className="text-2xl font-black">{storageMetrics.jsonSize} KB</p>
          <p className={`text-[9px] font-black uppercase mt-1 ${storageMetrics.health === 'HEALTHY' ? 'text-green-400' : 'text-red-400'}`}>{storageMetrics.health} STATUS</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className={labelClass}>Inventory Scale</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black">{state.tyres.length}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Products Active</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className={labelClass}>Media Integrity</p>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter"><i className="fas fa-cloud mr-1"></i> {storageMetrics.cloudImagesCount} Cloud Media</span>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter"><i className="fas fa-hdd mr-1"></i> {storageMetrics.localImagesCount} Local Blobs</span>
          </div>
        </div>
        <button onClick={pushToCloud} disabled={isSyncing} className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 group">
          <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-xl group-hover:-translate-y-1 transition-transform`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1">Global Deploy</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-[3rem]">
        {(['overview', 'brands', 'tyres', 'media', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`flex-1 px-4 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-gray-900 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <i className="fas fa-tachometer-alt text-3xl text-gray-200"></i>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Command Center</h2>
            <p className="text-gray-400 max-w-sm font-medium mb-10">Manage Capital Traders' global stock. Current database is optimized for {storageMetrics.health === 'HEALTHY' ? 'lightning fast sync' : 'heavy load'}.</p>
            <div className="flex gap-4">
              <button onClick={handleExport} className="bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Download Backup</button>
              <button onClick={() => setActiveTab('tyres')} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Manage Stock</button>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="animate-fadeIn space-y-8">
            <div className="bg-blue-50 border border-blue-100 p-10 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Scale to 5GB+</h3>
              <p className="text-sm text-blue-700 font-medium leading-relaxed mb-8 max-w-2xl">
                To manage thousands of high-quality photos without hitting storage limits, connect your business to <strong>Cloudinary</strong>. 
                Images uploaded here will be hosted on a global CDN and won't count towards your sync file size.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div>
                  <label className={labelClass}>Cloudinary Cloud Name</label>
                  <input type="text" className={inputClass} value={cloudName} onChange={e => setCloudName(e.target.value)} placeholder="e.g. capital-traders-pk" />
                </div>
                <div>
                  <label className={labelClass}>Upload Preset (Unsigned)</label>
                  <input type="text" className={inputClass} value={uploadPreset} onChange={e => setUploadPreset(e.target.value)} placeholder="e.g. website_uploads" />
                </div>
              </div>
              
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => {
                    localStorage.setItem('ct_cloud_name', cloudName);
                    localStorage.setItem('ct_cloud_preset', uploadPreset);
                    alert("Enterprise Media Config Saved!");
                  }}
                  className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-700 transition-all"
                >
                  Apply Cloud Config
                </button>
                <a href="https://cloudinary.com/" target="_blank" className="bg-white/50 text-blue-600 px-10 py-5 rounded-2xl font-black uppercase text-xs border border-blue-200 hover:bg-white transition-all">Setup Free Account</a>
              </div>
            </div>

            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
               <h3 className="text-xl font-black mb-4 uppercase">Database Migration Tool</h3>
               <p className="text-xs text-gray-500 font-bold mb-6">Replace all current local images with cloud-safe placeholders to fix sync issues.</p>
               <button 
                onClick={() => {
                  if (confirm("This will remove current high-res photos and replace them with standard placeholders to fix sync errors. Continue?")) {
                    const newTyres = state.tyres.map(t => ({...t, image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80'}));
                    updateState({ tyres: newTyres });
                  }
                }}
                className="bg-red-50 text-red-600 px-8 py-4 rounded-xl font-black text-[10px] uppercase border border-red-100 hover:bg-red-100"
               >
                 Flush Local Blobs
               </button>
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-12 animate-fadeIn">
            <div className={`p-8 rounded-[2.5rem] border-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Manufacturer Name</label><input type="text" className={inputClass} value={brandForm.name || ''} onChange={e => setBrandForm({...brandForm, name: e.target.value})} /></div>
              <div><label className={labelClass}>Country</label><input type="text" className={inputClass} value={brandForm.origin || ''} onChange={e => setBrandForm({...brandForm, origin: e.target.value})} /></div>
              <div>
                <label className={labelClass}>Logo</label>
                <div className="relative group">
                  <input type="file" className="w-full text-xs opacity-0 absolute inset-0 cursor-pointer z-10" accept="image/*" onChange={e => handleFileUpload(e, url => setBrandForm({...brandForm, logo: url}))} />
                  <div className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${isUploading ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 group-hover:border-gray-900'}`}>
                    <span className="text-[10px] font-black uppercase text-gray-400">{isUploading ? 'Scaling Media...' : 'Choose File'}</span>
                  </div>
                </div>
              </div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs shadow-xl">{editingId ? 'Update Brand' : 'Register Brand'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center group relative hover:shadow-xl transition-all border-b-4 hover:border-b-gray-900">
                  <img src={b.logo} className="w-16 h-16 object-contain mb-4" />
                  <span className="font-black text-[10px] text-center uppercase mb-4 tracking-tight">{b.name}</span>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => { setEditingId(b.id); setBrandForm(b); }} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={() => updateState({ brands: state.brands.filter(x => x.id !== b.id) })} className="text-red-500 text-[10px] font-black uppercase">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tyres' && (
          <div className="space-y-8 animate-fadeIn">
            <div className={`p-8 rounded-[2.5rem] border-2 grid grid-cols-1 md:grid-cols-5 gap-4 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="md:col-span-1"><label className={labelClass}>Brand</label><select className={inputClass} value={tyreForm.brandId || ''} onChange={e => setTyreForm({...tyreForm, brandId: e.target.value})}><option value="">Select...</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div className="md:col-span-1"><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={tyreForm.pattern || ''} onChange={e => setTyreForm({...tyreForm, pattern: e.target.value})} /></div>
              <div className="md:col-span-1"><label className={labelClass}>Size</label><input type="text" className={inputClass} value={tyreForm.size || ''} onChange={e => setTyreForm({...tyreForm, size: e.target.value})} /></div>
              <div className="md:col-span-1"><label className={labelClass}>Price</label><input type="number" className={inputClass} value={tyreForm.price || ''} onChange={e => setTyreForm({...tyreForm, price: Number(e.target.value)})} /></div>
              <div className="md:col-span-1">
                <label className={labelClass}>Photo</label>
                <div className="relative group">
                  <input type="file" className="w-full text-xs opacity-0 absolute inset-0 cursor-pointer z-10" accept="image/*" onChange={e => handleFileUpload(e, url => setTyreForm({...tyreForm, image: url}))} />
                  <div className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${isUploading ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 group-hover:border-gray-900'}`}>
                    <span className="text-[10px] font-black uppercase text-gray-400 truncate px-2">{isUploading ? 'Uploading...' : 'Upload'}</span>
                  </div>
                </div>
              </div>
              <button onClick={saveTyre} className="md:col-span-5 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">{editingId ? 'Save Inventory Update' : 'Add to Stock'}</button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-[2rem] shadow-sm">
              <table className="w-full text-left text-[10px] font-black uppercase">
                <thead className="bg-gray-50 text-gray-400"><tr><th className="py-4 px-6">Source</th><th className="py-4 px-6">Brand</th><th className="py-4 px-6">Pattern</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <i className={`fas ${t.image.startsWith('http') ? 'fa-cloud text-green-500' : 'fa-database text-amber-500'} text-xs`} title={t.image.startsWith('http') ? 'Cloud Host' : 'Local Host'}></i>
                    </td>
                    <td className="py-4 px-6">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="py-4 px-6 text-gray-900">{t.pattern} ({t.size})</td>
                    <td className="py-4 px-6">Rs. {t.price.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right space-x-4">
                      <button onClick={() => { setEditingId(t.id); setTyreForm(t); }} className="text-blue-500 hover:underline">Edit</button>
                      <button onClick={() => updateState({ tyres: state.tyres.filter(x => x.id !== t.id) })} className="text-red-500 hover:underline">Del</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fadeIn">
            <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
               <h3 className="text-xl font-black mb-8 uppercase tracking-tighter">Business Identity</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
                 <div><label className={labelClass}>WhatsApp Contact</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} /></div>
               </div>
               <button onClick={() => { updateState({ businessInfo: editBusiness }); alert("Identity Updated!"); }} className="mt-10 bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-all">Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
