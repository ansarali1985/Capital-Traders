
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
    // 1. Check for Cloud Sync Parameter (Deployment)
    const urlParams = new URLSearchParams(window.location.search);
    const deployData = urlParams.get('deploy');
    if (deployData) {
      try {
        const decoded = JSON.parse(atob(deployData));
        localStorage.setItem('capital_traders_enterprise_state', JSON.stringify(decoded));
        // Strip the URL param to keep it clean and prevent loop reloads
        window.history.replaceState({}, document.title, window.location.pathname);
        return decoded;
      } catch (e) {
        console.error("Cloud Sync: Encryption Key Invalid", e);
      }
    }

    // 2. Local State Persistence
    const saved = localStorage.getItem('capital_traders_enterprise_state');
    if (saved) return JSON.parse(saved);

    // 3. System Defaults
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

  // Real-time local persistence
  useEffect(() => {
    localStorage.setItem('capital_traders_enterprise_state', JSON.stringify(state));
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const navigate = (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => {
    setCurrentView({ page, id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentTheme = THEMES.find(t => t.id === state.theme) || THEMES[0];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 selection:bg-gray-900 selection:text-white">
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

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10 border-b border-white/5 pb-10">
             <div className="text-center md:text-left">
                <p className="font-black text-2xl tracking-tighter uppercase mb-2">{state.businessInfo.name}</p>
                <p className="text-gray-500 text-sm max-w-xs">{state.businessInfo.address}</p>
             </div>
             <div className="flex flex-wrap justify-center gap-10">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Hotline</p>
                  <a href={`tel:${state.businessInfo.phone}`} className="hover:text-amber-400 transition-all font-bold">{state.businessInfo.phone}</a>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Global Sync</p>
                  <span className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Operational
                  </span>
                </div>
             </div>
          </div>
          <p className="text-center text-gray-600 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} Capital Traders Enterprise. Synchronized via Global Net.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
