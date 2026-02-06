
import React, { useState, useMemo } from 'react';
import { AppState, Brand, Vehicle, Tyre } from '../types';

interface DashboardProps {
  state: AppState;
  onNavigate: (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => void;
  themeColor: string;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, themeColor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'brand' | 'size' | 'vehicle'>('brand');

  const filteredBrands = useMemo(() => {
    if (searchType !== 'brand') return state.brands;
    return state.brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [state.brands, searchTerm, searchType]);

  const filteredVehicles = useMemo(() => {
    if (searchType !== 'vehicle') return [];
    return state.vehicles.filter(v => 
      `${v.make} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.vehicles, searchTerm, searchType]);

  const filteredTyres = useMemo(() => {
    if (searchType !== 'size') return [];
    return state.tyres.filter(t => t.size.includes(searchTerm));
  }, [state.tyres, searchTerm, searchType]);

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
      {/* Running Banner of Vehicles - Full Colour & Permanent Names */}
      <div className="bg-black py-4 overflow-hidden border-b border-white/10 relative">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[...state.vehicles, ...state.vehicles, ...state.vehicles].map((vehicle, idx) => (
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
              {/* Permanent Gradient Overlay for Names */}
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
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
            CAPITAL <span className="text-amber-400">TRADERS</span>
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

      {/* Search Results / Content */}
      <div className="container mx-auto px-4 py-12">
        {searchTerm && (searchType === 'vehicle' || searchType === 'size') ? (
          <div className="mb-16">
            <h2 className="text-2xl font-black mb-8 flex items-center uppercase tracking-tight">
              <span className="w-8 h-1 bg-amber-400 mr-3"></span>
              Search Results for "{searchTerm}"
            </h2>
            {searchType === 'vehicle' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVehicles.map(v => (
                  <div key={v.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-16 rounded-2xl overflow-hidden border-2 border-gray-50">
                          <img src={v.image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-black text-2xl text-gray-900 uppercase">{v.make}</h3>
                          <p className="text-amber-500 font-black text-sm uppercase">{v.model}</p>
                        </div>
                      </div>
                      <i className="fas fa-car-side text-gray-100 text-4xl"></i>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Best Match Sizes:</p>
                      <div className="flex flex-wrap gap-2">
                        {v.recommendedSizes.map(size => (
                          <button 
                            key={size} 
                            onClick={() => { setSearchType('size'); setSearchTerm(size); }}
                            className="bg-gray-50 hover:bg-gray-900 hover:text-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black transition-all border border-gray-100"
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredTyres.map(t => (
                   <div key={t.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all">
                     <div className="h-56 overflow-hidden relative">
                       <img src={t.image} alt={t.pattern} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase text-gray-900 shadow-lg">
                         {state.brands.find(b => b.id === t.brandId)?.name}
                       </div>
                     </div>
                     <div className="p-6">
                       <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{t.pattern}</h3>
                       <p className="text-gray-400 font-bold mb-4">{t.size}</p>
                       <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                         <span className="text-gray-900 font-black text-xl">Rs. {t.price.toLocaleString()}</span>
                         <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${t.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                           {t.stock > 0 ? 'In Stock' : 'Out of Stock'}
                         </span>
                       </div>
                     </div>
                   </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Brands Grid */}
        <section id="brands" className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Premium Brands</h2>
            <div className="flex-grow h-px bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {filteredBrands.map(brand => (
              <div 
                key={brand.id}
                onClick={() => onNavigate('brand', brand.id)}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group text-center"
              >
                <div className="w-full aspect-square mb-6 rounded-2xl overflow-hidden bg-gray-50 p-4 group-hover:bg-white transition-colors flex items-center justify-center">
                  <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
                </div>
                <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">{brand.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{brand.origin}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services Showcase */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-xs mb-4">Complete Solutions</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">Expert Auto Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {state.services.map(service => (
              <div key={service.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:border-gray-900 transition-all flex flex-col">
                <div className="h-44 overflow-hidden relative">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-2">{service.title}</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 flex-grow">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">Rs. {service.price.toLocaleString()}</span>
                    <button onClick={() => onNavigate('contact')} className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:text-amber-700">Book <i className="fas fa-chevron-right ml-1"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className={`rounded-[3rem] bg-gradient-to-r ${themeColor} p-10 md:p-20 text-white relative overflow-hidden shadow-2xl`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none">NEED A CUSTOM <br/> QUOTATION?</h2>
              <p className="text-lg md:text-xl opacity-80 font-medium">Contact our specialists today for bulk orders or specific vehicle requirements.</p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <button 
                onClick={() => onNavigate('contact')}
                className="bg-white text-gray-900 px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-tighter shadow-xl hover:scale-105 transition-all"
              >
                Contact Support
              </button>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-black">
                <span className="flex items-center opacity-70"><i className="fas fa-check-circle mr-2"></i> Genuine Tyres</span>
                <span className="flex items-center opacity-70"><i className="fas fa-check-circle mr-2"></i> Fast Fitting</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
