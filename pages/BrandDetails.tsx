
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

  if (!brand) return <div className="p-20 text-center font-bold">Brand not found</div>;

  const handleWhatsAppInquiry = (tyre: any) => {
    // Better Pakistan Number Formatting
    let cleanNumber = state.businessInfo.whatsapp.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    }
    if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }

    const message = encodeURIComponent(
      `Assalam-o-Alaikum ${state.businessInfo.name},\n\n` +
      `I saw this on your website:\n\n` +
      `📦 *Brand:* ${brand.name}\n` +
      `🔄 *Pattern:* ${tyre.pattern}\n` +
      `📐 *Size:* ${tyre.size}\n` +
      `💰 *Price:* Rs. ${tyre.price.toLocaleString()}\n\n` +
      `Is this available for fitting?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-fadeIn">
      <button 
        onClick={() => onNavigate('dashboard')}
        className="mb-8 flex items-center text-gray-400 hover:text-gray-900 font-black transition-colors uppercase text-xs tracking-widest"
      >
        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
      </button>

      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-10 mb-12">
        <div className="w-40 h-40 bg-gray-50 rounded-3xl p-6 flex items-center justify-center border border-gray-100">
          <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black text-gray-900 mb-2 uppercase tracking-tighter">{brand.name}</h1>
          <p className="text-xl text-gray-400 font-bold mb-6">Imported from {brand.origin}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
              <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest">Patterns</span>
              <span className="text-2xl font-black text-blue-700">{new Set(tyres.map(t => t.pattern)).size}</span>
            </div>
            <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
              <span className="block text-[10px] font-black text-amber-400 uppercase tracking-widest">Inventory</span>
              <span className="text-2xl font-black text-amber-700">{tyres.length} Sizes</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-black mb-8 text-gray-900 uppercase tracking-tight">Stock Inventory</h2>
      
      {tyres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tyres.map(tyre => (
            <div key={tyre.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
              <div className="h-56 overflow-hidden relative bg-gray-50">
                <img src={tyre.image} alt={tyre.pattern} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-gray-900 mb-1 uppercase tracking-tight">{tyre.pattern}</h3>
                <p className="text-sm font-bold text-gray-400 mb-6">{tyre.size}</p>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-black text-gray-900">Rs. {tyre.price.toLocaleString()}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${tyre.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tyre.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <button 
                  onClick={() => handleWhatsAppInquiry(tyre)}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <i className="fab fa-whatsapp text-lg"></i> WhatsApp Inquiry
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-black uppercase tracking-widest">No tyres listed yet.</p>
        </div>
      )}
    </div>
  );
};

export default BrandDetails;
