
import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'brands' | 'tyres' | 'vehicles' | 'services' | 'settings'>('brands');
  
  // Forms states
  const [newBrand, setNewBrand] = useState<Partial<Brand>>({});
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({});
  const [newTyre, setNewTyre] = useState<Partial<Tyre>>({});
  const [newService, setNewService] = useState<Partial<Service>>({});
  const [editBusiness, setEditBusiness] = useState<BusinessInfo>(state.businessInfo);

  // Tracking what we are currently editing
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setEditBusiness(state.businessInfo);
  }, [state.businessInfo, activeTab]);

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
      setUsername('');
      setPassword('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const generateProductionCode = () => {
    const code = `
// COPY THIS CODE AND SEND IT TO THE AI DEVELOPER
export const INITIAL_BRANDS = ${JSON.stringify(state.brands, null, 2)};
export const INITIAL_TYRES = ${JSON.stringify(state.tyres, null, 2)};
export const INITIAL_VEHICLES = ${JSON.stringify(state.vehicles, null, 2)};
export const INITIAL_SERVICES = ${JSON.stringify(state.services, null, 2)};
export const INITIAL_BUSINESS = ${JSON.stringify(state.businessInfo, null, 2)};
    `;
    navigator.clipboard.writeText(code).then(() => alert("PRODUCTION CODE COPIED!"));
  };

  // Explicit Save Handlers to ensure NO logic is removed
  const saveBrand = () => {
    if (!newBrand.name) return;
    if (editingId) {
      updateState({ brands: state.brands.map(b => b.id === editingId ? { ...b, ...newBrand } as Brand : b) });
    } else {
      updateState({ brands: [...state.brands, { ...newBrand, id: 'b' + Date.now() } as Brand] });
    }
    setNewBrand({}); setEditingId(null);
  };

  const saveTyre = () => {
    if (!newTyre.pattern || !newTyre.brandId) return;
    if (editingId) {
      updateState({ tyres: state.tyres.map(t => t.id === editingId ? { ...t, ...newTyre } as Tyre : t) });
    } else {
      updateState({ tyres: [...state.tyres, { ...newTyre, id: 't' + Date.now() } as Tyre] });
    }
    setNewTyre({}); setEditingId(null);
  };

  const saveVehicle = () => {
    if (!newVehicle.model) return;
    if (editingId) {
      updateState({ vehicles: state.vehicles.map(v => v.id === editingId ? { ...v, ...newVehicle } as Vehicle : v) });
    } else {
      updateState({ vehicles: [...state.vehicles, { ...newVehicle, id: 'v' + Date.now() } as Vehicle] });
    }
    setNewVehicle({}); setEditingId(null);
  };

  const saveService = () => {
    if (!newService.title) return;
    if (editingId) {
      updateState({ services: state.services.map(s => s.id === editingId ? { ...s, ...newService } as Service : s) });
    } else {
      updateState({ services: [...state.services, { ...newService, id: 's' + Date.now() } as Service] });
    }
    setNewService({}); setEditingId(null);
  };

  // Added missing handleLogout function
  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    onNavigate('dashboard');
  };

  const labelClass = "block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 ml-1";
  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-200 p-3 rounded-xl focus:border-gray-900 focus:outline-none font-bold";
  const fileInputClass = "w-full bg-white text-gray-900 border-2 border-dashed border-gray-300 p-2 rounded-xl text-xs font-bold cursor-pointer";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-gray-100">
          <Logo size="lg" className="mx-auto mb-6 bg-gray-900" />
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8 uppercase tracking-tighter">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div><label className={labelClass}>Username</label><input type="text" className={inputClass} value={username} onChange={e => setUsername(e.target.value)} required /></div>
            <div><label className={labelClass}>Password</label><input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required /></div>
            {loginError && <p className="text-red-500 text-center font-bold text-xs">{loginError}</p>}
            <button className="w-full bg-gray-900 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-gray-900">ADMIN CONTROL PANEL</h1>
        <button onClick={handleLogout} className="text-red-600 font-black uppercase text-xs border-2 border-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">Logout</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-2xl">
        {(['brands', 'tyres', 'vehicles', 'services', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-md text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm min-h-[500px]">
        {activeTab === 'settings' && (
          <div className="space-y-12">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10 text-8xl"><i className="fas fa-globe-americas"></i></div>
               <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">WORLDWIDE SYNCHRONISATION</h3>
               <button onClick={generateProductionCode} className="bg-white text-blue-800 px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:scale-105 transition-all">
                 <i className="fas fa-code mr-2"></i> Generate Production Code for AI
               </button>
            </div>

            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200">
              <h3 className="text-xl font-black mb-6 uppercase">App Theme Customisation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={() => updateState({ theme: theme.id as AppTheme })} className={`p-4 rounded-2xl border-2 transition-all text-left ${state.theme === theme.id ? 'border-gray-900 bg-white shadow-lg scale-105' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                    <div className={`h-4 w-full rounded-full bg-gradient-to-r ${theme.classes} mb-2`}></div>
                    <span className="text-[10px] font-black uppercase">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200">
              <h3 className="text-xl font-black mb-6 uppercase text-gray-400">Store Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
                <div><label className={labelClass}>WhatsApp (Must start with 03...)</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} /></div>
                <div><label className={labelClass}>Phone</label><input type="text" className={inputClass} value={editBusiness.phone} onChange={e => setEditBusiness({...editBusiness, phone: e.target.value})} /></div>
                <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={editBusiness.email} onChange={e => setEditBusiness({...editBusiness, email: e.target.value})} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Address</label><textarea className={inputClass} value={editBusiness.address} onChange={e => setEditBusiness({...editBusiness, address: e.target.value})} rows={2} /></div>
              </div>
              <button onClick={() => updateState({ businessInfo: editBusiness })} className="mt-8 bg-gray-900 text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">Update Local Settings</button>
            </div>
          </div>
        )}

        {/* BRANDS TAB with EDIT and DELETE */}
        {activeTab === 'brands' && (
           <div className="space-y-10">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div><label className={labelClass}>Name</label><input type="text" className={inputClass} value={newBrand.name || ''} onChange={e => setNewBrand({...newBrand, name: e.target.value})} /></div>
              <div><label className={labelClass}>Origin</label><input type="text" className={inputClass} value={newBrand.origin || ''} onChange={e => setNewBrand({...newBrand, origin: e.target.value})} /></div>
              <div><label className={labelClass}>Logo</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewBrand({...newBrand, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase tracking-widest">
                {editingId ? 'Update Brand' : 'Add Brand'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {state.brands.map(b => (
                <div key={b.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center group relative shadow-sm hover:shadow-md transition-all">
                  <img src={b.logo} className="w-20 h-20 object-contain mb-4" />
                  <span className="font-black text-xs text-center uppercase tracking-tighter mb-4">{b.name}</span>
                  <div className="flex gap-4">
                    <button onClick={() => { setEditingId(b.id); setNewBrand(b); }} className="text-blue-500 text-[10px] font-black uppercase hover:underline">Edit</button>
                    <button onClick={() => updateState({ brands: state.brands.filter(x => x.id !== b.id) })} className="text-red-500 text-[10px] font-black uppercase hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYRES TAB with EDIT and DELETE */}
        {activeTab === 'tyres' && (
           <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
              <div><label className={labelClass}>Brand</label><select className={inputClass} value={newTyre.brandId || ''} onChange={e => setNewTyre({...newTyre, brandId: e.target.value})}><option value="">Select</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={newTyre.pattern || ''} onChange={e => setNewTyre({...newTyre, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size</label><input type="text" className={inputClass} value={newTyre.size || ''} onChange={e => setNewTyre({...newTyre, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={newTyre.price || ''} onChange={e => setNewTyre({...newTyre, price: Number(e.target.value)})} /></div>
              <div className="md:col-span-5"><label className={labelClass}>Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewTyre({...newTyre, image: b64}))} /></div>
              <button onClick={saveTyre} className="md:col-span-5 bg-gray-900 text-white py-4 rounded-xl font-black uppercase tracking-widest">
                {editingId ? 'Update Tyre Entry' : 'Add New Tyre Size'}
              </button>
            </div>
            <div className="overflow-x-auto bg-gray-50 rounded-2xl p-4">
              <table className="w-full text-left text-xs font-bold uppercase">
                <thead className="border-b-2 border-gray-200"><tr className="text-gray-400"><th className="py-4 px-2">Brand</th><th className="py-4 px-2">Pattern</th><th className="py-4 px-2">Size</th><th className="py-4 px-2">Price</th><th className="py-4 px-2 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-white transition-colors">
                    <td className="py-4 px-2">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="py-4 px-2">{t.pattern}</td>
                    <td className="py-4 px-2">{t.size}</td>
                    <td className="py-4 px-2">Rs. {t.price.toLocaleString()}</td>
                    <td className="py-4 px-2 text-right">
                      <button onClick={() => { setEditingId(t.id); setNewTyre(t); }} className="text-blue-500 mr-4 font-black">EDIT</button>
                      <button onClick={() => updateState({ tyres: state.tyres.filter(x => x.id !== t.id) })} className="text-red-500 font-black">DELETE</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* VEHICLES TAB with EDIT and DELETE */}
        {activeTab === 'vehicles' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div><label className={labelClass}>Make</label><input type="text" className={inputClass} value={newVehicle.make || ''} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} /></div>
              <div><label className={labelClass}>Model</label><input type="text" className={inputClass} value={newVehicle.model || ''} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} /></div>
              <div className="md:col-span-3"><label className={labelClass}>Banner Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewVehicle({...newVehicle, image: b64}))} /></div>
              <button onClick={saveVehicle} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase tracking-widest">
                {editingId ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {state.vehicles.map(v => (
                <div key={v.id} className="border rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-md transition-all group">
                  <img src={v.image} className="w-full h-40 object-cover" />
                  <div className="p-4 flex justify-between items-center bg-gray-50 border-t">
                    <span className="text-xs font-black uppercase tracking-tighter">{v.make} {v.model}</span>
                    <div className="flex gap-4">
                      <button onClick={() => { setEditingId(v.id); setNewVehicle(v); }} className="text-blue-500 text-[10px] font-black uppercase hover:underline">Edit</button>
                      <button onClick={() => updateState({ vehicles: state.vehicles.filter(x => x.id !== v.id) })} className="text-red-500 text-[10px] font-black uppercase hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES TAB with EDIT and DELETE */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div><label className={labelClass}>Title</label><input type="text" className={inputClass} value={newService.title || ''} onChange={e => setNewService({...newService, title: e.target.value})} /></div>
              <div><label className={labelClass}>Price (Rs)</label><input type="number" className={inputClass} value={newService.price || ''} onChange={e => setNewService({...newService, price: Number(e.target.value)})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea className={inputClass} value={newService.description || ''} onChange={e => setNewService({...newService, description: e.target.value})} rows={2} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Service Banner Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewService({...newService, image: b64}))} /></div>
              <button onClick={saveService} className="md:col-span-2 bg-gray-900 text-white py-3 rounded-xl font-black uppercase tracking-widest">
                {editingId ? 'Update Service Details' : 'Add New Service'}
              </button>
            </div>
            <div className="space-y-4">
              {state.services.map(s => (
                <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <img src={s.image} className="w-16 h-16 rounded-2xl object-cover border" />
                    <div className="flex flex-col">
                      <span className="font-black text-sm uppercase tracking-tighter">{s.title}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rs. {s.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={() => { setEditingId(s.id); setNewService(s); }} className="text-blue-500 text-xs font-black uppercase hover:underline">Edit</button>
                    <button onClick={() => updateState({ services: state.services.filter(x => x.id !== s.id) })} className="text-red-500 text-xs font-black uppercase hover:underline">Delete</button>
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
