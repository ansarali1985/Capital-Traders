
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Brand, Tyre, Vehicle, Service, BusinessInfo, AppTheme } from '../types';
import { THEMES } from '../constants';
import Logo from '../components/Logo';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'tyres' | 'vehicles' | 'services' | 'settings'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Forms
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({});
  const [tyreForm, setTyreForm] = useState<Partial<Tyre>>({});
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({});
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalValue = state.tyres.reduce((acc, t) => acc + (t.price * t.stock), 0);
    const totalUnits = state.tyres.reduce((acc, t) => acc + t.stock, 0);
    return { totalValue, totalUnits };
  }, [state.tyres]);

  useEffect(() => {
    setEditBusiness(state.businessInfo);
  }, [state.businessInfo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const pushToCloud = async () => {
    setIsSyncing(true);
    try {
      // Logic for Cloud Hub Synchronization
      const response = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      const result = await response.json();
      const syncId = result.id;
      
      localStorage.setItem('capital_traders_cloud_id', syncId);
      const shareUrl = `${window.location.origin}${window.location.pathname}?sync=${syncId}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`GLOBAL CLOUD SYNC SUCCESS!\n\nYour Enterprise ID: ${syncId}\n\nYour database has been pushed to the cloud. Share this link to sync other devices instantly:\n\n${shareUrl}`);
      });
    } catch (e) {
      alert("Sync failed. Check connection.");
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

  // Handlers
  const saveBrand = () => {
    if (!brandForm.name) return;
    if (editingId) {
      updateState({ brands: state.brands.map(b => b.id === editingId ? { ...b, ...brandForm } as Brand : b) });
    } else {
      updateState({ brands: [...state.brands, { ...brandForm, id: 'b' + Date.now() } as Brand] });
    }
    setBrandForm({}); setEditingId(null);
  };

  const saveTyre = () => {
    if (!tyreForm.pattern || !tyreForm.brandId) return;
    if (editingId) {
      updateState({ tyres: state.tyres.map(t => t.id === editingId ? { ...t, ...tyreForm } as Tyre : t) });
    } else {
      updateState({ tyres: [...state.tyres, { ...tyreForm, id: 't' + Date.now(), price: Number(tyreForm.price), stock: Number(tyreForm.stock) } as Tyre] });
    }
    setTyreForm({}); setEditingId(null);
  };

  const saveVehicle = () => {
    if (!vehicleForm.model) return;
    if (editingId) {
      updateState({ vehicles: state.vehicles.map(v => v.id === editingId ? { ...v, ...vehicleForm } as Vehicle : v) });
    } else {
      updateState({ vehicles: [...state.vehicles, { ...vehicleForm, id: 'v' + Date.now() } as Vehicle] });
    }
    setVehicleForm({}); setEditingId(null);
  };

  const saveService = () => {
    if (!serviceForm.title) return;
    if (editingId) {
      updateState({ services: state.services.map(s => s.id === editingId ? { ...s, ...serviceForm } as Service : s) });
    } else {
      updateState({ services: [...state.services, { ...serviceForm, id: 's' + Date.now() } as Service] });
    }
    setServiceForm({}); setEditingId(null);
  };

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1";
  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-100 p-3 rounded-xl focus:border-gray-900 focus:outline-none font-bold";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 text-center">
          <Logo size="lg" className="mx-auto mb-8 bg-gray-900" />
          <h2 className="text-3xl font-black uppercase mb-8">Management Auth</h2>
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
      {/* Enterprise Metrics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Stock Value</p>
          <p className="text-2xl font-black">Rs. {stats.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inventory Health</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalUnits} Units Live</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global ID</p>
          <p className="text-xs font-black text-blue-600 font-mono truncate">{localStorage.getItem('capital_traders_cloud_id') || 'Not Linked'}</p>
        </div>
        <button 
          onClick={pushToCloud} 
          disabled={isSyncing}
          className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-xl`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Sync to Cloud'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-[2.5rem]">
        {(['overview', 'brands', 'tyres', 'vehicles', 'services', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`flex-1 px-4 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-gray-900' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
        <button onClick={() => setIsAdminAuthenticated(false)} className="px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase text-red-500">Exit</button>
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fas fa-chart-line text-5xl text-gray-100 mb-6"></i>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Enterprise Dashboard Active</h2>
            <p className="text-gray-400 max-w-sm font-medium">Manage your global inventory and real-time pricing from this hub. Remember to Sync to Cloud to update other devices.</p>
          </div>
        )}

        {/* BRANDS Management */}
        {activeTab === 'brands' && (
          <div className="space-y-12">
            <div className={`p-8 rounded-[2rem] border-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Brand Identity</label><input type="text" className={inputClass} value={brandForm.name || ''} onChange={e => setBrandForm({...brandForm, name: e.target.value})} /></div>
              <div><label className={labelClass}>Origin</label><input type="text" className={inputClass} value={brandForm.origin || ''} onChange={e => setBrandForm({...brandForm, origin: e.target.value})} /></div>
              <div><label className={labelClass}>Logo</label><input type="file" className="w-full text-xs" onChange={e => handleFileUpload(e, b64 => setBrandForm({...brandForm, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg">{editingId ? 'Update Brand' : 'Register Brand'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center group relative hover:shadow-xl transition-all">
                  <img src={b.logo} className="w-16 h-16 object-contain mb-4" />
                  <span className="font-black text-[10px] text-center uppercase tracking-tighter mb-4">{b.name}</span>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(b.id); setBrandForm(b); }} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={() => updateState({ brands: state.brands.filter(x => x.id !== b.id) })} className="text-red-500 text-[10px] font-black uppercase">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYRES Management */}
        {activeTab === 'tyres' && (
          <div className="space-y-8">
            <div className={`p-8 rounded-[2rem] border-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Select Brand</label><select className={inputClass} value={tyreForm.brandId || ''} onChange={e => setTyreForm({...tyreForm, brandId: e.target.value})}><option value="">Manufacturer</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={tyreForm.pattern || ''} onChange={e => setTyreForm({...tyreForm, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size Spec</label><input type="text" className={inputClass} value={tyreForm.size || ''} onChange={e => setTyreForm({...tyreForm, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price (Rs)</label><input type="number" className={inputClass} value={tyreForm.price || ''} onChange={e => setTyreForm({...tyreForm, price: Number(e.target.value)})} /></div>
              <button onClick={saveTyre} className="md:col-span-4 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Commit Update' : 'Append to Stock'}</button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-[2rem]">
              <table className="w-full text-left text-[10px] font-black uppercase">
                <thead className="bg-gray-50 text-gray-400"><tr><th className="py-4 px-6">Brand</th><th className="py-4 px-6">Model</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-6">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="py-4 px-6 text-gray-900">{t.pattern} ({t.size})</td>
                    <td className="py-4 px-6 font-bold">Rs. {t.price.toLocaleString()}</td>
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
              <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Theme Orchestration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={() => updateState({ theme: theme.id as AppTheme })} className={`p-5 rounded-2xl border-2 transition-all ${state.theme === theme.id ? 'border-gray-900 bg-white shadow-xl scale-105' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                    <div className={`h-4 w-full rounded-full bg-gradient-to-r ${theme.classes} mb-3`}></div>
                    <span className="text-[10px] font-black uppercase">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Business Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
                <div><label className={labelClass}>WhatsApp Public</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} /></div>
              </div>
              <button onClick={() => updateState({ businessInfo: editBusiness })} className="mt-10 bg-gray-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Update Global Metadata</button>
            </div>
          </div>
        )}

        {/* Similar pattern for VEHICLES and SERVICES */}
        {activeTab === 'vehicles' && (
           <div className="space-y-8">
            <div className={`p-8 rounded-[2rem] border-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Make</label><input type="text" className={inputClass} value={vehicleForm.make || ''} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} /></div>
              <div><label className={labelClass}>Model</label><input type="text" className={inputClass} value={vehicleForm.model || ''} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} /></div>
              <div><label className={labelClass}>Visual</label><input type="file" className="text-xs" onChange={e => handleFileUpload(e, b64 => setVehicleForm({...vehicleForm, image: b64}))} /></div>
              <button onClick={saveVehicle} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Save Changes' : 'Register Vehicle'}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {state.vehicles.map(v => (
                <div key={v.id} className="border border-gray-100 rounded-[2rem] overflow-hidden bg-white group">
                  <img src={v.image} className="w-full h-32 object-cover" />
                  <div className="p-4 flex justify-between items-center">
                    <span className="font-black text-[10px] uppercase">{v.make} {v.model}</span>
                    <div className="flex gap-4">
                      <button onClick={() => { setEditingId(v.id); setVehicleForm(v); }} className="text-blue-500 text-[9px] font-black uppercase">Edit</button>
                      <button onClick={() => updateState({ vehicles: state.vehicles.filter(x => x.id !== v.id) })} className="text-red-500 text-[9px] font-black uppercase">Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-8">
            <div className={`p-8 rounded-[2rem] border-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-end ${editingId ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
              <div><label className={labelClass}>Service Title</label><input type="text" className={inputClass} value={serviceForm.title || ''} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} /></div>
              <div><label className={labelClass}>Fee (Rs)</label><input type="number" className={inputClass} value={serviceForm.price || ''} onChange={e => setServiceForm({...serviceForm, price: Number(e.target.value)})} /></div>
              <button onClick={saveService} className="md:col-span-2 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">{editingId ? 'Update Protocol' : 'Establish Service'}</button>
            </div>
            <div className="space-y-4">
              {state.services.map(s => (
                <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] flex justify-between items-center hover:shadow-lg transition-all">
                  <div className="flex items-center gap-6">
                    <img src={s.image} className="w-12 h-12 rounded-xl object-cover" />
                    <span className="font-black text-sm uppercase">{s.title}</span>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={() => { setEditingId(s.id); setServiceForm(s); }} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={() => updateState({ services: state.services.filter(x => x.id !== s.id) })} className="text-red-500 text-[10px] font-black uppercase">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
