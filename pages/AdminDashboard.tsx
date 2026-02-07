
import React, { useState, useEffect } from 'react';
import { AppState, Brand, Tyre, Vehicle, Service, BusinessInfo } from '../types';
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

  // Sync settings whenever tab is opened or state changes
  useEffect(() => {
    setEditBusiness(state.businessInfo);
  }, [state.businessInfo, activeTab]);

  // Editing state IDs
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingTyreId, setEditingTyreId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
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

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    onNavigate('dashboard');
  };

  const saveBrand = () => {
    if (!newBrand.name) return;
    if (editingBrandId) {
      const updatedBrands = state.brands.map(b => b.id === editingBrandId ? { ...b, ...newBrand } as Brand : b);
      updateState({ brands: updatedBrands });
      setEditingBrandId(null);
    } else {
      const brand: Brand = {
        id: 'b' + Date.now(),
        name: newBrand.name,
        origin: newBrand.origin || 'Unknown',
        logo: newBrand.logo || 'https://picsum.photos/seed/brand/200/200'
      };
      updateState({ brands: [...state.brands, brand] });
    }
    setNewBrand({});
  };

  const saveTyre = () => {
    if (!newTyre.brandId || !newTyre.pattern || !newTyre.size) return;
    if (editingTyreId) {
      const updatedTyres = state.tyres.map(t => t.id === editingTyreId ? { ...t, ...newTyre } as Tyre : t);
      updateState({ tyres: updatedTyres });
      setEditingTyreId(null);
    } else {
      const tyre: Tyre = {
        id: 't' + Date.now(),
        brandId: newTyre.brandId,
        pattern: newTyre.pattern,
        size: newTyre.size,
        price: Number(newTyre.price) || 0,
        stock: Number(newTyre.stock) || 0,
        image: newTyre.image || 'https://picsum.photos/seed/tyre/400/300'
      };
      updateState({ tyres: [...state.tyres, tyre] });
    }
    setNewTyre({});
  };

  const saveVehicle = () => {
    if (!newVehicle.make || !newVehicle.model) return;
    if (editingVehicleId) {
      const updatedVehicles = state.vehicles.map(v => v.id === editingVehicleId ? { ...v, ...newVehicle } as Vehicle : v);
      updateState({ vehicles: updatedVehicles });
      setEditingVehicleId(null);
    } else {
      const vehicle: Vehicle = {
        id: 'v' + Date.now(),
        make: newVehicle.make,
        model: newVehicle.model,
        yearRange: newVehicle.yearRange || 'All Years',
        recommendedSizes: newVehicle.recommendedSizes || [],
        image: newVehicle.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80'
      };
      updateState({ vehicles: [...state.vehicles, vehicle] });
    }
    setNewVehicle({});
  };

  const saveService = () => {
    if (!newService.title) return;
    if (editingServiceId) {
      const updatedServices = state.services.map(s => s.id === editingServiceId ? { ...s, ...newService } as Service : s);
      updateState({ services: updatedServices });
      setEditingServiceId(null);
    } else {
      const service: Service = {
        id: 's' + Date.now(),
        title: newService.title,
        description: newService.description || '',
        price: Number(newService.price) || 0,
        image: newService.image || 'https://picsum.photos/seed/service/400/300'
      };
      updateState({ services: [...state.services, service] });
    }
    setNewService({});
  };

  const saveBusinessInfo = () => {
    updateState({ businessInfo: editBusiness });
    alert('Business info updated! Now click "Generate Global Deploy Link" below to sync with other devices.');
  };

  const generateDeployLink = () => {
    const dataStr = btoa(JSON.stringify(state));
    const deployUrl = `${window.location.origin}${window.location.pathname}?deploy=${dataStr}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(deployUrl).then(() => {
      alert('SUCCESS! A special "Sync Link" has been copied to your clipboard.\n\nOpen this link on any other computer/browser to automatically see all your 1500+ items and images!');
    }).catch(err => {
      console.error('Failed to copy', err);
      prompt('Copy this link manually:', deployUrl);
    });
  };

  const labelClass = "block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 ml-1";
  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-200 p-3 rounded-xl focus:border-gray-900 focus:outline-none placeholder:text-gray-400 font-bold";
  const fileInputClass = "w-full bg-white text-gray-900 border-2 border-dashed border-gray-300 p-2 rounded-xl text-xs font-bold cursor-pointer hover:border-gray-900 transition-all";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-gray-100">
          <Logo size="lg" className="mx-auto mb-6 bg-gray-900" />
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8 uppercase tracking-tighter">Admin Access</h2>
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-gray-900">ADMIN DASHBOARD</h1>
        <button onClick={handleLogout} className="text-red-600 font-black uppercase text-xs border-2 border-red-600 px-4 py-2 rounded-xl">Logout</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-2xl">
        {(['brands', 'tyres', 'vehicles', 'services', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === tab ? 'bg-white shadow-md text-gray-900' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm">
        {activeTab === 'settings' && (
          <div className="space-y-12">
            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200">
              <h3 className="text-xl font-black mb-6 uppercase">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelClass}>Business Name</label><input type="text" className={inputClass} value={editBusiness.name} onChange={e => setEditBusiness({...editBusiness, name: e.target.value})} /></div>
                <div><label className={labelClass}>WhatsApp Number</label><input type="text" className={inputClass} value={editBusiness.whatsapp} onChange={e => setEditBusiness({...editBusiness, whatsapp: e.target.value})} placeholder="e.g. 03001234567" /></div>
                <div><label className={labelClass}>Phone</label><input type="text" className={inputClass} value={editBusiness.phone} onChange={e => setEditBusiness({...editBusiness, phone: e.target.value})} /></div>
                <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={editBusiness.email} onChange={e => setEditBusiness({...editBusiness, email: e.target.value})} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Address</label><textarea className={inputClass} value={editBusiness.address} onChange={e => setEditBusiness({...editBusiness, address: e.target.value})} rows={2} /></div>
              </div>
              <button onClick={saveBusinessInfo} className="mt-8 bg-gray-900 text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">Save Locally</button>
            </div>

            <div className="bg-blue-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10 text-8xl"><i className="fas fa-globe"></i></div>
               <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">GLOBAL SYNC (For Clients & Other Devices)</h3>
               <p className="text-sm font-medium opacity-80 mb-8 leading-relaxed max-w-2xl">
                 Since this is a client-side app, your changes are normally hidden from other users. 
                 Use the tool below to generate a "Sync Link". When you open this link on another device, 
                 it will permanently update that device with all your new inventory and images!
               </p>
               <button 
                 onClick={generateDeployLink}
                 className="bg-amber-400 text-gray-900 px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-amber-300 transition-all active:scale-95"
               >
                 <i className="fas fa-link mr-2"></i> Generate & Copy Global Sync Link
               </button>
            </div>
          </div>
        )}

        {/* Existing Brand/Tyre/Vehicle/Service Tabs ... (Keep original logic) */}
        {activeTab === 'brands' && (
           <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div><label className={labelClass}>Name</label><input type="text" className={inputClass} value={newBrand.name || ''} onChange={e => setNewBrand({...newBrand, name: e.target.value})} /></div>
              <div><label className={labelClass}>Origin</label><input type="text" className={inputClass} value={newBrand.origin || ''} onChange={e => setNewBrand({...newBrand, origin: e.target.value})} /></div>
              <div><label className={labelClass}>Logo</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewBrand({...newBrand, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">{editingBrandId ? 'Update' : 'Add'} Brand</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {state.brands.map(b => (
                <div key={b.id} className="p-4 border border-gray-100 rounded-2xl flex flex-col items-center">
                  <img src={b.logo} className="w-16 h-16 object-contain mb-3" />
                  <span className="font-black text-xs text-center uppercase">{b.name}</span>
                  <div className="flex gap-4 mt-3">
                    <button onClick={() => { setNewBrand(b); setEditingBrandId(b.id); }} className="text-blue-500"><i className="fas fa-edit"></i></button>
                    <button onClick={() => { if(confirm('Delete?')) updateState({ brands: state.brands.filter(x => x.id !== b.id) }) }} className="text-red-500"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ... Tyres, Vehicles, Services tabs continue here with similar delete logic ... */}
        {activeTab === 'tyres' && (
           <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              <div><label className={labelClass}>Brand</label><select className={inputClass} value={newTyre.brandId || ''} onChange={e => setNewTyre({...newTyre, brandId: e.target.value})}><option value="">Select</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={newTyre.pattern || ''} onChange={e => setNewTyre({...newTyre, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size</label><input type="text" className={inputClass} value={newTyre.size || ''} onChange={e => setNewTyre({...newTyre, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={newTyre.price || ''} onChange={e => setNewTyre({...newTyre, price: Number(e.target.value)})} /></div>
              <div><label className={labelClass}>Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewTyre({...newTyre, image: b64}))} /></div>
              <button onClick={saveTyre} className="md:col-span-2 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">Save Tyre</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold uppercase">
                <thead className="border-b"><tr><th className="py-4">Pattern</th><th className="py-4">Size</th><th className="py-4">Price</th><th className="py-4 text-right">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-4">{t.pattern}</td>
                    <td className="py-4 text-gray-400">{t.size}</td>
                    <td className="py-4">Rs. {t.price.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => { setNewTyre(t); setEditingTyreId(t.id); }} className="text-blue-500 mr-4">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) updateState({ tyres: state.tyres.filter(x => x.id !== t.id) }) }} className="text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div><label className={labelClass}>Make</label><input type="text" className={inputClass} value={newVehicle.make || ''} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} /></div>
              <div><label className={labelClass}>Model</label><input type="text" className={inputClass} value={newVehicle.model || ''} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} /></div>
              <div><label className={labelClass}>Banner Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewVehicle({...newVehicle, image: b64}))} /></div>
              <button onClick={saveVehicle} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">Save Vehicle</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {state.vehicles.map(v => (
                <div key={v.id} className="border rounded-2xl overflow-hidden relative group">
                  <img src={v.image} className="w-full h-32 object-cover" />
                  <div className="p-3 bg-white flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase">{v.make} {v.model}</span>
                    <button onClick={() => { if(confirm('Delete?')) updateState({ vehicles: state.vehicles.filter(x => x.id !== v.id) }) }} className="text-red-500 text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div><label className={labelClass}>Title</label><input type="text" className={inputClass} value={newService.title || ''} onChange={e => setNewService({...newService, title: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={newService.price || ''} onChange={e => setNewService({...newService, price: Number(e.target.value)})} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea className={inputClass} value={newService.description || ''} onChange={e => setNewService({...newService, description: e.target.value})} rows={2} /></div>
              <button onClick={saveService} className="md:col-span-2 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">Save Service</button>
            </div>
            <div className="space-y-4">
              {state.services.map(s => (
                <div key={s.id} className="p-4 border rounded-2xl flex justify-between items-center">
                  <span className="font-black text-sm uppercase">{s.title} (Rs. {s.price})</span>
                  <button onClick={() => { if(confirm('Delete?')) updateState({ services: state.services.filter(x => x.id !== s.id) }) }} className="text-red-500 text-xs">Delete</button>
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
