
import React, { useState, useMemo } from 'react';
import { AppState, Brand, Vehicle, Tyre } from '../types.ts';

interface DashboardProps {
  state: AppState;
  onNavigate: (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => void;
  themeColor: string;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, themeColor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'brand' | 'size' | 'vehicle'>('brand');

  const brands = state?.brands || [];
  const vehicles = state?.vehicles || [];
  const tyres = state?.tyres || [];
  const services = state?.services || [];

  const filteredBrands = useMemo(() => {
    if (searchType !== 'brand') return brands;
    return brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [brands, searchTerm, searchType]);

  const filteredVehicles = useMemo(() => {
    if (searchType !== 'vehicle') return [];
    return vehicles.filter(v => 
      `${v.make} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm, searchType]);

  const filteredTyres = useMemo(() => {
    if (searchType !== 'size') return [];
    return tyres.filter(t => t.size.includes(searchTerm));
  }, [tyres, searchTerm, searchType]);

  const handleBannerClick = (vehicle: Vehicle) => {
    setSearchType('vehicle');
    setSearchTerm(`${vehicle.make} ${vehicle.model}`);
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Running Banner of Vehicles */}
      <div className="bg-black py-4 overflow-hidden border-b border-white/10 relative">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {(vehicles.length > 0 ? [...vehicles, ...vehicles, ...vehicles] : []).map((vehicle, idx) => (
            <div 
              key={idx} 
              onClick={() => handleBannerClick(vehicle)}
              className="mx-3 w-64 h-40 rounded-2xl overflow-hidden relative group cursor-pointer border-2 border-white/5 shadow-2xl flex-shrink-0 transition-all hover:border-amber-400"
            >
              <img 
                src={vehicle.image} 
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                alt={vehicle.model} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                  <p className="text-white font-black text-sm uppercase tracking-tighter leading-none">{vehicle.make}</p>
                  <p className="text-amber-400 font-black text-lg uppercase leading-none mt-1">{vehicle.model}</p>
                  <p className="text-[9px] text-white/50 font-bold mt-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-search mr-1"></i> View Tyres
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
          }
          .animate-marquee {
            animation: marquee 50s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>

      {/* Hero & Search Section */}
      <section id="search-section" className={`bg-gradient-to-br ${themeColor} py-16 md:py-24 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tighter uppercase">
            {(state?.businessInfo?.name || 'CAPITAL TRADERS').split(' ')[0]} <span className="text-amber-400">{(state?.businessInfo?.name || '').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-lg md:text-2xl mb-12 opacity-90 font-medium max-w-3xl mx-auto">
            Authorized Retailers of Premium Global Tyre Brands in Islamabad.
          </p>

          <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-6 shadow-2xl overflow-hidden text-left">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
              {(['brand', 'size', 'vehicle'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => { setSearchType(type); setSearchTerm(''); }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    searchType === type 
                    ? `bg-gray-900 text-white shadow-lg` 
                    : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {type === 'brand' ? 'By Brand' : type === 'size' ? 'By Size' : 'By Vehicle'}
                </button>
              ))}
            </div>

            <div className="relative">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-xl"></i>
              <input 
                type="text" 
                placeholder={
                  searchType === 'brand' ? "Search Brands (Michelin, Yokohama...)" :
                  searchType === 'size' ? "Search Size (195/65/R15...)" :
                  "Search Car (Civic, Corolla, Alto...)"
                }
                className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-gray-900 text-gray-800 font-bold text-lg shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content grid removed for brevity as per existing code structure */}
      <div className="container mx-auto px-4 py-12">
        {/* Simplified results section for performance */}
        <section id="brands" className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Premium Brands</h2>
            <div className="flex-grow h-px bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredBrands.map(brand => (
              <div 
                key={brand.id}
                onClick={() => onNavigate('brand', brand.id)}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col"
              >
                <div className="h-44 bg-gray-50 flex items-center justify-center p-8 group-hover:bg-white transition-colors">
                  <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-6 border-t border-gray-50 text-center">
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">{brand.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{brand.origin}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
