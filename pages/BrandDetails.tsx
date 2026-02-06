
import React, { useMemo } from 'react';
import { AppState } from '../types';

interface BrandDetailsProps {
  brandId: string;
  state: AppState;
  onNavigate: (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => void;
}

const BrandDetails: React.FC<BrandDetailsProps> = ({ brandId, state, onNavigate }) => {
  const brand = useMemo(() => state.brands.find(b => b.id === brandId), [state.brands, brandId]);
  const tyres = useMemo(() => state.tyres.filter(t => t.brandId === brandId), [state.tyres, brandId]);

  if (!brand) return <div className="p-20 text-center">Brand not found</div>;

  return (
    <div className="container mx-auto px-4 py-12 animate-fadeIn">
      <button 
        onClick={() => onNavigate('dashboard')}
        className="mb-8 flex items-center text-gray-500 hover:text-gray-900 font-bold transition-colors"
      >
        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="w-48 h-48 bg-gray-50 rounded-2xl p-4 flex items-center justify-center">
          <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
        </div>
        <div>
          <h1 className="text-5xl font-black text-gray-900 mb-2">{brand.name}</h1>
          <p className="text-xl text-gray-400 font-medium mb-6">Origin: {brand.origin}</p>
          <div className="flex gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-xl">
              <span className="block text-xs font-bold text-blue-400 uppercase">Available Patterns</span>
              <span className="text-xl font-black text-blue-700">{new Set(tyres.map(t => t.pattern)).size}</span>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-xl">
              <span className="block text-xs font-bold text-green-400 uppercase">Total Stock</span>
              <span className="text-xl font-black text-green-700">{tyres.reduce((acc, t) => acc + t.stock, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-black mb-8 text-gray-900">AVAILABLE TYRES</h2>
      
      {tyres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tyres.map(tyre => (
            <div key={tyre.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
              <div className="h-56 overflow-hidden">
                <img src={tyre.image} alt={tyre.pattern} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-gray-900 mb-1">{tyre.pattern}</h3>
                <p className="text-sm font-bold text-gray-400 mb-4">{tyre.size}</p>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-black text-blue-600">Rs. {tyre.price.toLocaleString()}</span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${tyre.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tyre.stock > 0 ? `In Stock (${tyre.stock})` : 'Out of Stock'}
                  </span>
                </div>
                <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                  Inquire via WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">Currently no tyres listed for this brand.</p>
        </div>
      )}
    </div>
  );
};

export default BrandDetails;
