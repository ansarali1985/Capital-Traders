
import React, { useState, useRef } from 'react';
import { AppState, Brand, Tyre, Vehicle, Service } from '../types';
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

  // Editing state IDs
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingTyreId, setEditingTyreId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Security editing state
  const [showCredentialEditor, setShowCredentialEditor] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

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
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    onNavigate('dashboard');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1985') {
      setShowCredentialEditor(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Access Denied.');
    }
  };

  // --- CRUD Operations ---

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

  const deleteItem = (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    updateState({ [type]: (state as any)[type].filter((item: any) => item.id !== id) });
  };

  // Backup Functions
  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "capital_traders_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedState = JSON.parse(event.target?.result as string);
          updateState(importedState);
          alert('Database restored successfully!');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const inputClass = "w-full bg-white text-gray-900 border-2 border-gray-400 p-3 rounded-xl focus:border-gray-900 focus:outline-none placeholder:text-gray-400 font-bold";
  const fileInputClass = "w-full bg-white text-gray-900 border-2 border-dashed border-gray-400 p-2 rounded-xl text-xs font-bold cursor-pointer hover:border-gray-900 transition-all";
  const labelClass = "block text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 ml-1";

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-gray-100 animate-fadeIn">
          <div className="text-center mb-10">
            <Logo size="lg" className="mx-auto mb-6 bg-gray-900" />
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Portal</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div><label className={labelClass}>Username</label><input type="text" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
            <div><label className={labelClass}>Password</label><input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            {loginError && <p className="text-red-600 text-xs font-bold text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-gray-900">Capital Traders Admin</h1>
        <button onClick={handleLogout} className="text-red-600 font-black uppercase text-xs border-2 border-red-600 px-4 py-2 rounded-xl">Logout</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-gray-200 p-2 rounded-2xl">
        {(['brands', 'tyres', 'vehicles', 'services', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-6 py-3 rounded-xl text-sm font-black capitalize ${activeTab === tab ? 'bg-white shadow-md' : 'text-gray-500'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border-2 border-gray-100">
        {activeTab === 'brands' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-2 border-gray-400 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div><label className={labelClass}>Name</label><input type="text" className={inputClass} value={newBrand.name || ''} onChange={e => setNewBrand({...newBrand, name: e.target.value})} /></div>
              <div><label className={labelClass}>Origin</label><input type="text" className={inputClass} value={newBrand.origin || ''} onChange={e => setNewBrand({...newBrand, origin: e.target.value})} /></div>
              <div><label className={labelClass}>Logo</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewBrand({...newBrand, logo: b64}))} /></div>
              <button onClick={saveBrand} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">{editingBrandId ? 'Update' : 'Add'} Brand</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {state.brands.map(b => (
                <div key={b.id} className="p-4 border-2 border-gray-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={b.logo} className="w-10 h-10 object-contain" />
                    <span className="font-black">{b.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setNewBrand(b); setEditingBrandId(b.id); }} className="text-blue-600"><i className="fas fa-edit"></i></button>
                    <button onClick={() => deleteItem('brands', b.id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tyres' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-2 border-gray-400 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              <div><label className={labelClass}>Brand</label><select className={inputClass} value={newTyre.brandId || ''} onChange={e => setNewTyre({...newTyre, brandId: e.target.value})}><option value="">Select</option>{state.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Pattern</label><input type="text" className={inputClass} value={newTyre.pattern || ''} onChange={e => setNewTyre({...newTyre, pattern: e.target.value})} /></div>
              <div><label className={labelClass}>Size</label><input type="text" className={inputClass} value={newTyre.size || ''} onChange={e => setNewTyre({...newTyre, size: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={newTyre.price || ''} onChange={e => setNewTyre({...newTyre, price: Number(e.target.value)})} /></div>
              <div><label className={labelClass}>Stock</label><input type="number" className={inputClass} value={newTyre.stock || ''} onChange={e => setNewTyre({...newTyre, stock: Number(e.target.value)})} /></div>
              <div><label className={labelClass}>Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewTyre({...newTyre, image: b64}))} /></div>
              <button onClick={saveTyre} className="md:col-span-2 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">{editingTyreId ? 'Update' : 'Add'} Tyre</button>
            </div>
            <div className="overflow-x-auto border-2 border-gray-200 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-gray-900 text-white"><tr><th className="px-4 py-3">Image</th><th className="px-4 py-3">Brand</th><th className="px-4 py-3">Pattern</th><th className="px-4 py-3">Actions</th></tr></thead>
                <tbody>{state.tyres.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="px-4 py-2"><img src={t.image} className="w-10 h-10 object-cover" /></td>
                    <td className="px-4 py-2 font-bold">{state.brands.find(b => b.id === t.brandId)?.name}</td>
                    <td className="px-4 py-2">{t.pattern}</td>
                    <td className="px-4 py-2 flex gap-4">
                      <button onClick={() => { setNewTyre(t); setEditingTyreId(t.id); }} className="text-blue-600">Edit</button>
                      <button onClick={() => deleteItem('tyres', t.id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-2 border-gray-400 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div><label className={labelClass}>Make</label><input type="text" className={inputClass} value={newVehicle.make || ''} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} /></div>
              <div><label className={labelClass}>Model</label><input type="text" className={inputClass} value={newVehicle.model || ''} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} /></div>
              <div><label className={labelClass}>Banner Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewVehicle({...newVehicle, image: b64}))} /></div>
              <div className="md:col-span-3"><label className={labelClass}>Sizes (comma separated)</label><input type="text" className={inputClass} value={newVehicle.recommendedSizes?.join(', ') || ''} onChange={e => setNewVehicle({...newVehicle, recommendedSizes: e.target.value.split(',').map(s => s.trim())})} /></div>
              <button onClick={saveVehicle} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">{editingVehicleId ? 'Update' : 'Add'} Vehicle</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {state.vehicles.map(v => (
                <div key={v.id} className="border-2 rounded-2xl overflow-hidden">
                  <img src={v.image} className="h-32 w-full object-cover" />
                  <div className="p-4 flex justify-between items-center">
                    <span className="font-black uppercase">{v.make} {v.model}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewVehicle(v); setEditingVehicleId(v.id); }} className="text-blue-600"><i className="fas fa-edit"></i></button>
                      <button onClick={() => deleteItem('vehicles', v.id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-2 border-gray-400 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div><label className={labelClass}>Title</label><input type="text" className={inputClass} value={newService.title || ''} onChange={e => setNewService({...newService, title: e.target.value})} /></div>
              <div><label className={labelClass}>Price</label><input type="number" className={inputClass} value={newService.price || ''} onChange={e => setNewService({...newService, price: Number(e.target.value)})} /></div>
              <div><label className={labelClass}>Image</label><input type="file" className={fileInputClass} onChange={e => handleFileUpload(e, b64 => setNewService({...newService, image: b64}))} /></div>
              <div className="md:col-span-3"><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={newService.description || ''} onChange={e => setNewService({...newService, description: e.target.value})} /></div>
              <button onClick={saveService} className="md:col-span-3 bg-gray-900 text-white py-3 rounded-xl font-black uppercase">{editingServiceId ? 'Update' : 'Add'} Service</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {state.services.map(s => (
                <div key={s.id} className="border-2 p-4 rounded-2xl flex items-center gap-4">
                  <img src={s.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-grow font-black">{s.title}</div>
                  <div className="flex gap-4">
                    <button onClick={() => { setNewService(s); setEditingServiceId(s.id); }} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteItem('services', s.id)} className="text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12">
            <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200">
              <h3 className="text-xl font-black mb-4 uppercase">Database Backup (Crucial for 1500+ items)</h3>
              <p className="text-xs text-amber-700 font-bold mb-6 uppercase">Since the browser limit is 5MB, always export your data as a backup file. If you switch computers or clear history, simply import this file to restore everything.</p>
              <div className="flex flex-wrap gap-4">
                <button onClick={exportData} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Export Backup (.JSON)</button>
                <label className="bg-white border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer hover:bg-gray-50 transition-colors">
                  Import Backup
                  <input type="file" className="hidden" accept=".json" onChange={importData} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-lg font-black mb-6 uppercase">Theme Selection</h3>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(theme => (
                    <button key={theme.id} onClick={() => updateState({ theme: theme.id })} className={`p-4 rounded-2xl border-4 transition-all ${state.theme === theme.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}>
                      <div className={`h-8 w-full rounded mb-2 bg-gradient-to-r ${theme.classes}`}></div>
                      <p className="font-black text-[10px] uppercase">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 text-white p-8 rounded-[2rem]">
                <h3 className="text-lg font-black mb-6 uppercase text-amber-400">Security Control</h3>
                {!showCredentialEditor ? (
                  <form onSubmit={handlePinSubmit} className="space-y-4">
                    <input type="password" className="w-full bg-white/10 border-2 border-white/20 p-4 rounded-xl text-center text-2xl font-black tracking-widest" placeholder="PIN" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)} />
                    <button className="w-full bg-white text-gray-900 py-3 rounded-xl font-black uppercase">Unlock Editor</button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <input type="text" className="w-full bg-white text-gray-900 p-4 rounded-xl font-black" value={state.adminCredentials.username} onChange={e => updateState({ adminCredentials: {...state.adminCredentials, username: e.target.value}})} />
                    <input type="text" className="w-full bg-white text-gray-900 p-4 rounded-xl font-black" value={state.adminCredentials.password} onChange={e => updateState({ adminCredentials: {...state.adminCredentials, password: e.target.value}})} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
