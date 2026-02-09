import React, { useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_BRANDS, 
  INITIAL_TYRES, 
  INITIAL_VEHICLES, 
  INITIAL_SERVICES, 
  INITIAL_BUSINESS, 
  THEMES 
} from './constants.ts';
import { AppState, AppTheme } from './types.ts';
import Navbar from './components/Navbar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import BrandDetails from './pages/BrandDetails.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import ContactUs from './pages/ContactUs.tsx';

const DEFAULT_STATE: AppState = {
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

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<{ page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string }>({ page: 'dashboard' });
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateState = (data: any): data is AppState => {
    return data && 
           Array.isArray(data.brands) && 
           Array.isArray(data.tyres) && 
           typeof data.businessInfo === 'object';
  };

  const fetchCloudState = useCallback(async (syncId: string) => {
    if (!syncId || syncId === 'undefined') return;
    try {
      const response = await fetch(`https://api.npoint.io/${syncId}`);
      if (response.ok) {
        const cloudData = await response.json();
        if (validateState(cloudData)) {
          setState(prev => ({ ...prev, ...cloudData }));
          setIsCloudSynced(true);
          localStorage.setItem('capital_traders_cloud_id', syncId);
        }
      }
    } catch (error) {
      console.error("Cloud Sync Fetch Failed:", error);
    }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const saved = localStorage.getItem('capital_traders_enterprise_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (validateState(parsed)) {
            setState(prev => ({ ...prev, ...parsed }));
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const syncId = urlParams.get('sync') || localStorage.getItem('capital_traders_cloud_id');
        
        if (syncId) {
          await fetchCloudState(syncId);
          const interval = setInterval(() => fetchCloudState(syncId), 60000);
          return () => clearInterval(interval);
        }
      } catch (e) {
        console.error("Hydration Failed:", e);
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, [fetchCloudState]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('capital_traders_enterprise_state', JSON.stringify(state));
    }
  }, [state, isLoading]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const navigate = (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => {
    setCurrentView({ page, id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    if (confirm("This will clear all local changes and reset to factory defaults. Continue?")) {
      localStorage.removeItem('capital_traders_enterprise_state');
      localStorage.removeItem('capital_traders_cloud_id');
      window.location.href = window.location.pathname;
    }
  };

  const currentTheme = THEMES.find(t => t.id === (state?.theme || 'classic')) || THEMES[0];

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-gray-900 border-t-amber-400 rounded-full animate-spin mb-4"></div>
        <p className="font-black text-[10px] uppercase tracking-widest text-gray-400">Booting Enterprise Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 selection:bg-gray-900 selection:text-white">
      <Navbar 
        businessName={state?.businessInfo?.name || 'CAPITAL TRADERS'} 
        onNavigate={navigate} 
        themeClass={currentTheme.classes}
        isAdminAuthenticated={isAdminAuthenticated}
        isCloudSynced={isCloudSynced}
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

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10 border-b border-white/5 pb-10">
             <div className="text-center md:text-left">
                <p className="font-black text-2xl tracking-tighter uppercase mb-2">{state?.businessInfo?.name}</p>
                <p className="text-gray-500 text-sm max-w-xs">{state?.businessInfo?.address}</p>
             </div>
             <div className="flex flex-wrap justify-center gap-10">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Enterprise Status</p>
                  <span className={`flex items-center gap-2 text-xs font-bold ${isCloudSynced ? 'text-green-400' : 'text-amber-400'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isCloudSynced ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                    {isCloudSynced ? 'Sync Active' : 'Standalone'}
                  </span>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Recovery</p>
                  <button onClick={handleReset} className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 transition-colors">Clear Cache & Reset</button>
                </div>
             </div>
          </div>
          <p className="text-center text-gray-600 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} Capital Traders Enterprise. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
