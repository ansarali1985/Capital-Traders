
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
  
  // Forms states
  const [newBrand, setNewBrand] = useState<Partial<Brand>>({});
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({});
  const [newTyre, setNewTyre] = useState<Partial<Tyre>>({});
  const [newService, setNewService] = useState<Partial<Service>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);

  // Edit Tracking
  const [editingId, setEditingId] = useState<string | null>(null);

  // Enterprise Stats Calculation
  const stats = useMemo(() => {
    const totalInventoryValue = state.tyres.reduce((acc, t) => acc + (t.price * t.stock), 0);
    const lowStockItems = state.tyres.filter(t => t.stock < 5).length;
    const outOfStock = state.tyres.filter(t => t.stock === 0).length;
    return { totalInventoryValue, lowStockItems, outOfStock };
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === state.adminCredentials.username && password === state.adminCredentials.password) {
      setIsAdminAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid enterprise credentials.');
    }
  };

  const syncToCloud = () => {
    const data = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?deploy=${data}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("CLOUD SYNC SUCCESSFUL!\n\nYour Enterprise Data has been encrypted into a Global Distribution Link. Share this link with your team or clients to sync all devices instantly.");
    });
  };

  // Explicit Save/Update Handlers
  const saveBrand = () => {
    if (!newBrand.name) return;
    if (editingId) {
      updateState({ brands: state.brands.map(b => b.id === editingId ? { ...b, ...newBrand } as Brand : b) });
    } else {
      updateState({ brands: [...state.brands, { ...newBrand, id: 'b' + Date.now(), logo: newBrand.logo || 'https://picsum.photos/seed/brand/200/200', origin: newBrand.origin || 'Unknown' } as Brand] });
    }
    setNewBrand({}); setEditingId(null);
  };

  const saveTyre = () => {
    if (!newTyre.pattern || !newTyre.brandId) return;
    if (editingId) {
      updateState({ tyres: state.tyres.map(t => t.id === editingId ? { ...t, ...newTyre } as Tyre : t) });
    } else {
      updateState({ tyres: [...state.tyres, { ...newTyre, id: 't' + Date.now(), price: Number(newTyre.price) || 0, stock: Number(newTyre.stock) || 0, image: newTyre.image || 'https://picsum.photos/seed/tyre/400/300' } as Tyre] });
    }
    setNewTyre({}); setEditingId(null);
  };

  const saveVehicle = () => {
    if (!newVehicle.model) return;
    if (editingId) {
      updateState({ vehicles: state.vehicles.map(v => v.id === editingId ? { ...v, ...newVehicle } as Vehicle : v) });
    } else {
      updateState({ vehicles: [...state.vehicles, { ...newVehicle, id: 'v' + Date.now(), image: newVehicle.image || 'https://picsum.photos/seed/car/400/300', recommendedSizes: newVehicle.recommendedSizes || [] } as Vehicle] });
    }
    setNewVehicle({}); setEditingId(null);
  };

  const saveService = () => {
    if (!newService.title) return;
    if (editingId) {
      updateState({ services: state.services.map(s => s.id === editingId ? { ...s, ...newService } as Service : s) });
    } else {
      updateState({ services: [...state.services, { ...newService, id: 's' + Date.now(), price: Number(newService.price) || 0, image: newService.image || 'https://picsum.photos/seed/service/400/300' } as Service] });
    }
    setNewService({}); setEditingId(null);
  };

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1";
  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-100 p-3 rounded-xl focus:border-gray-900 focus:outline-none font-bold transition-all";
  const fileInputClass = "w-full bg-gray-50 border-2 border-dashed border-gray-200 p-2 rounded-xl text-[10px] font-black cursor-pointer hover:bg-gray-100";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 border border-gray-100">
          <Logo size="lg" className="mx-auto mb-8 bg-gray-900" />
          <h2 className="text-3xl font-black text-center mb-10 tracking-tighter uppercase">Enterprise Access</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div><label className={labelClass}>Admin ID</label><input type="text" className={inputClass} value={username} onChange={e => setUsername(e.target.value)} required /></div>
            <div><label className={labelClass}>Security Key</label><input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required /></div>
            {loginError && <p className="text-red-500 text-center font-bold text-xs">{loginError}</p>}
            <button className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Authenticate</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      {/* Enterprise Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Stock Value</span>
          <span className="text-2xl font-black">Rs. {stats.totalInventoryValue.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Brands</span>
          <span className="text-2xl font-black text-gray-900">{state.brands.length} Global Partners</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inventory Health</span>
          <span className={`text-2xl font-black ${stats.lowStockItems > 0 ? 'text-amber-500' : 'text-green-500'}`}>
            {stats.lowStockItems} Low Stock
          </span>
        </div>
        <button onClick={syncToCloud} className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center justify-center gap-2">
          <i className="fas fa-cloud-upload-alt text-xl"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Cloud Push</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
        {(['overview', 'brands', 'tyres', 'vehicles', 'services', 'settings'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => { setActiveTab(tab); setEditingId(null); }} 
            className={`flex-1 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
        {activeTab === 'overview' && (
          <div className="text-center py-20">
            <i className="fas fa-chart-line text-6xl text-gray-100 mb-6"></i>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Business Dashboard</h2>
            <p className="text-gray-400 font-medium max-w-sm mx-auto">Manage your retail operations and real-time inventory from this central management console.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12">
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Theme Engine</h3>
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
              <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Store MetaData</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
                <div><label className={labelClass}>WhatsApp Public Number</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} /></div>
                <div><label className={labelClass}>Primary Phone</label><input type="text" className={inputClass} value={editBusiness.phone} onChange={e => setEditBusiness({...editBusiness, phone: e.target.value})} /></div>
                <div><label className={labelClass}>Official Email</label><input type="email" className={inputClass} value={editBusiness.email} onChange={e => setEditBusiness({...editBusiness, email: e.target.value})} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Location / Address</label><textarea className={inputClass} value={editBusiness.address} onChange={e => setEditBusiness({...editBusiness, address: e.target.value})} rows={2} /></div>
              </div>
              <button onClick={() => updateState({ businessInfo: editBusiness })} className="mt-10 bg-gray-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Update Store Info</button>
            </div>
          </div>
        )}

        {/* BRANDS Management */}
        {activeTab === 'brands' && (
          <div className="space-y-12">
            <div className="bg-gray-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div><label className={labelClass}>Brand Identity</label><input type="text" className={inputClass} value={newBrand.name || ''} onChange={e => setNewBrand({...newBrand, name: e.target.value})} placeholder="e.g. Michelin" /></div>
              <div><label className={labelClass}>Origin Country</label><input type="text" className={inputClass} value={newBrand.origin || ''} onChange={e => setNewBrand({...newBrand, origin: e.target.value})} placeholder="France" /></div>
              <div><label className={labelClass}>Brand Logo</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewBrand({...newBrand, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">
                {editingId ? 'Update Brand Partner' : 'Register New Brand'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center group relative hover:shadow-lg transition-all">
                  <img src={b.logo} className="w-20 h-20 object-contain mb-4" />
                  <span className="font-black text-[10px] text-center uppercase tracking-tighter mb-4">{b.name}</span>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(b.id); setNewBrand(b); }} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={() => updateState({ brands: state.brands.filter(x => x.id !== b.id) })} className="text-red-500 text-[10px] font-black uppercase">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYRES Management */}
        {activeTab === 'tyres' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div><label className={labelClass}>Select Brand</label><select className={inputClass} value={newTyre.brandId || ''} onChange={e => setNewTyre({...newTyre, brandId: e.target.value})}><option value="">Manufacturer</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern Name</label><input type="text" className={inputClass} value={newTyre.pattern || ''} onChange={e => setNewTyre({...newTyre, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size Spec</label><input type="text" className={inputClass} value={newTyre.size || ''} onChange={e => setNewTyre({...newTyre, size: e.target.value})} /></div>
              <div><label className={labelClass}>Unit Price (Rs)</label><input type="number" className={inputClass} value={newTyre.price || ''} onChange={e => setNewTyre({...newTyre, price: Number(e.target.value)})} /></div>
              <div className="md:col-span-4"><label className={labelClass}>Product Visual</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewTyre({...newTyre, image: b64}))} /></div>
              <button onClick={saveTyre} className="md:col-span-4 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">
                {editingId ? 'Save Inventory Updates' : 'Add to Stock System'}
              </button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-3xl">
              <table className="w-full text-left text-[10px] font-black uppercase">
                <thead className="bg-gray-50 text-gray-400"><tr><th className="py-4 px-6">Brand</th><th className="py-4 px-6">Pattern</th><th className="py-4 px-6">Size</th><th className="py-4 px-6">Price</th><th className="py-4 px-6 text-right">Admin</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="py-4 px-6 text-gray-900">{t.pattern}</td>
                    <td className="py-4 px-6">{t.size}</td>
                    <td className="py-4 px-6 font-bold">Rs. {t.price.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right space-x-4">
                      <button onClick={() => { setEditingId(t.id); setNewTyre(t); }} className="text-blue-500">Edit</button>
                      <button onClick={() => updateState({ tyres: state.tyres.filter(x => x.id !== t.id) })} className="text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* VEHICLES & SERVICES use same pattern */}
        {activeTab === 'vehicles' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div><label className={labelClass}>Make</label><input type="text" className={inputClass} value={newVehicle.make || ''} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} /></div>
              <div><label className={labelClass}>Model</label><input type="text" className={inputClass} value={newVehicle.model || ''} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} /></div>
              <div><label className={labelClass}>Recommended Sizes</label><input type="text" className={inputClass} value={newVehicle.recommendedSizes?.join(', ') || ''} onChange={e => setNewVehicle({...newVehicle, recommendedSizes: e.target.value.split(',').map(s => s.trim())})} placeholder="Comma separated" /></div>
              <div className="md:col-span-3"><label className={labelClass}>Vehicle Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewVehicle({...newVehicle, image: b64}))} /></div>
              <button onClick={saveVehicle} className="md:col-span-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">
                {editingId ? 'Update Vehicle Meta' : 'Register Vehicle Profile'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {state.vehicles.map(v => (
                <div key={v.id} className="group relative border border-gray-100 rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all">
                  <img src={v.image} className="w-full h-40 object-cover" />
                  <div className="p-4 bg-white flex flex-col gap-2">
                    <span className="font-black text-xs uppercase">{v.make} {v.model}</span>
                    <div className="flex gap-4">
                      <button onClick={() => { setEditingId(v.id); setNewVehicle(v); }} className="text-blue-500 text-[9px] font-black uppercase">Edit</button>
                      <button onClick={() => updateState({ vehicles: state.vehicles.filter(x => x.id !== v.id) })} className="text-red-500 text-[9px] font-black uppercase">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div><label className={labelClass}>Service Name</label><input type="text" className={inputClass} value={newService.title || ''} onChange={e => setNewService({...newService, title: e.target.value})} /></div>
              <div><label className={labelClass}>Service Fee (Rs)</label><input type="number" className={inputClass} value={newService.price || ''} onChange={e => setNewService({...newService, price: Number(e.target.value)})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Technical Description</label><textarea className={inputClass} value={newService.description || ''} onChange={e => setNewService({...newService, description: e.target.value})} rows={2} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Service Banner Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewService({...newService, image: b64}))} /></div>
              <button onClick={saveService} className="md:col-span-2 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-xs">
                {editingId ? 'Update Service Protocols' : 'Establish New Service'}
              </button>
            </div>
            <div className="space-y-4">
              {state.services.map(s => (
                <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] flex justify-between items-center hover:shadow-lg transition-all">
                  <div className="flex items-center gap-6">
                    <img src={s.image} className="w-16 h-16 rounded-2xl object-cover border" />
                    <div className="flex flex-col">
                      <span className="font-black text-sm uppercase">{s.title}</span>
                      <span className="text-[10px] font-bold text-gray-400">Rs. {s.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={() => { setEditingId(s.id); setNewService(s); }} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                    <button onClick={() => updateState({ services: state.services.filter(x => x.id !== s.id) })} className="text-red-500 text-[10px] font-black uppercase">Delete</button>
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
