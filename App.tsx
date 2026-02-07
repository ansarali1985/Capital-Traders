
import React, { useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_BRANDS, 
  INITIAL_TYRES, 
  INITIAL_VEHICLES, 
  INITIAL_SERVICES, 
  INITIAL_BUSINESS, 
  THEMES 
} from './constants';
import { AppState, AppTheme } from './types';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BrandDetails from './pages/BrandDetails';
import AdminDashboard from './pages/AdminDashboard';
import ContactUs from './pages/ContactUs';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    // 1. Check if we have a deployment key in the URL (for syncing browsers)
    const urlParams = new URLSearchParams(window.location.search);
    const deployData = urlParams.get('deploy');
    if (deployData) {
      try {
        const decoded = JSON.parse(atob(deployData));
        localStorage.setItem('capital_traders_state', JSON.stringify(decoded));
        // Remove the param from URL to keep it clean
        window.history.replaceState({}, document.title, window.location.pathname);
        return decoded;
      } catch (e) {
        console.error("Failed to decode deployment link", e);
      }
    }

    // 2. Fallback to Local Storage
    const saved = localStorage.getItem('capital_traders_state');
    if (saved) return JSON.parse(saved);

    // 3. Fallback to Defaults
    return {
      brands: INITIAL_BRANDS,
      tyres: INITIAL_TYRES,
      vehicles: INITIAL_VEHICLES,
      services: INITIAL_SERVICES,
      businessInfo: INITIAL_BUSINESS,
      adminCredentials: {
        username: 'Abid_Abbas',
        password: 'Capitaltraders@123'
      },
      theme: 'classic' as AppTheme,
    };
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<{ page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string }>({ page: 'dashboard' });

  useEffect(() => {
    localStorage.setItem('capital_traders_state', JSON.stringify(state));
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const navigate = (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => {
    setCurrentView({ page, id });
    window.scrollTo(0, 0);
  };

  const currentTheme = THEMES.find(t => t.id === state.theme) || THEMES[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        businessName={state.businessInfo.name} 
        onNavigate={navigate} 
        themeClass={currentTheme.classes}
        isAdminAuthenticated={isAdminAuthenticated}
      />
      
      <main className="flex-grow">
        {currentView.page === 'dashboard' && (
          <Dashboard 
            state={state} 
            onNavigate={navigate} 
            themeColor={currentTheme.classes}
          />
        )}
        
        {currentView.page === 'brand' && currentView.id && (
          <BrandDetails 
            brandId={currentView.id} 
            state={state} 
            onNavigate={navigate}
          />
        )}

        {currentView.page === 'admin' && (
          <AdminDashboard 
            state={state} 
            updateState={updateState} 
            onNavigate={navigate}
            isAdminAuthenticated={isAdminAuthenticated}
            setIsAdminAuthenticated={setIsAdminAuthenticated}
          />
        )}

        {currentView.page === 'contact' && (
          <ContactUs 
            businessInfo={state.businessInfo} 
            themeColor={currentTheme.classes}
          />
        )}
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-bold text-xl mb-2">{state.businessInfo.name}</p>
          <p className="text-gray-400 text-sm mb-4">{state.businessInfo.address}</p>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <a href={`tel:${state.businessInfo.phone}`} className="hover:text-blue-400 transition-colors">
              <i className="fas fa-phone mr-2"></i> {state.businessInfo.phone}
            </a>
            <a href={`https://wa.me/${state.businessInfo.whatsapp.replace(/\D/g, '').startsWith('0') ? '92' + state.businessInfo.whatsapp.replace(/\D/g, '').slice(1) : state.businessInfo.whatsapp.replace(/\D/g, '')}`} className="hover:text-green-400 transition-colors">
              <i className="fab fa-whatsapp mr-2"></i> WhatsApp
            </a>
          </div>
          {isAdminAuthenticated && (
            <button 
              onClick={() => navigate('admin')}
              className="text-amber-400 text-xs font-bold uppercase tracking-widest hover:underline mb-4 block mx-auto"
            >
              Admin Dashboard
            </button>
          )}
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} Capital Traders. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
