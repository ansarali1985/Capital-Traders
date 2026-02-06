
import React, { useState, useEffect } from 'react';
import Logo from './Logo';

interface NavbarProps {
  businessName: string;
  onNavigate: (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => void;
  themeClass: string;
  isAdminAuthenticated: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ businessName, onNavigate, themeClass, isAdminAuthenticated }) => {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount >= 3) {
      onNavigate('admin');
      setClickCount(0);
    }
    const timer = setTimeout(() => setClickCount(0), 1000);
    return () => clearTimeout(timer);
  }, [clickCount, onNavigate]);

  return (
    <nav className={`sticky top-0 z-50 bg-gradient-to-r ${themeClass} text-white shadow-lg`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer select-none group"
          onClick={() => setClickCount(prev => prev + 1)}
        >
          <div className="relative">
            <Logo size="md" />
            {isAdminAuthenticated && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            )}
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="font-extrabold text-xl tracking-tighter uppercase leading-none">{businessName}</span>
            <span className="text-[10px] font-bold tracking-[0.2em] opacity-70 uppercase">Premium Tyres</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-amber-200 font-bold transition-colors text-sm uppercase tracking-wider">Home</button>
          <button onClick={() => onNavigate('dashboard')} className="hover:text-amber-200 font-bold transition-colors text-sm uppercase tracking-wider">Brands</button>
          <button onClick={() => onNavigate('contact')} className="hover:text-amber-200 font-bold transition-colors text-sm uppercase tracking-wider">Contact</button>
          {isAdminAuthenticated && (
            <button onClick={() => onNavigate('admin')} className="text-amber-400 font-black transition-colors text-xs uppercase tracking-widest border border-amber-400/30 px-3 py-1 rounded-md bg-amber-400/10">Admin</button>
          )}
          <button 
            onClick={() => onNavigate('contact')} 
            className="bg-white text-gray-900 px-5 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-md active:scale-95"
          >
            Get a Quote
          </button>
        </div>

        {/* Mobile menu icon */}
        <div className="md:hidden">
          <button className="text-2xl p-2" onClick={() => onNavigate('dashboard')}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
