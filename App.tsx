
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('capital_traders_enterprise_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure minimum required properties exist to prevent crashes
        if (parsed && Array.isArray(parsed.brands) && Array.isArray(parsed.tyres)) {
          return { ...DEFAULT_STATE, ...parsed };
        }
      }
    } catch (e) {
      console.error("Local storage corruption, reverting to defaults.");
    }
    return DEFAULT_STATE;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<{ page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string }>({ page: 'dashboard' });
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const isInitialMount = useRef(true);

  // CLOUD SYNC ENGINE: Pull latest data from public hub
  const fetchCloudState = useCallback(async (syncId: string) => {
    if (!syncId || syncId === 'undefined') return;
    try {
      const response = await fetch(`https://api.npoint.io/${syncId}`);
      if (response.ok) {
        const cloudData = await response.json();
        // Validation Layer: Only update if the data is valid
        if (cloudData && Array.isArray(cloudData.brands)) {
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
    const urlParams = new URLSearchParams(window.location.search);
    const syncId = urlParams.get('sync') || localStorage.getItem('capital_traders_cloud_id');
    
    if (syncId) {
      fetchCloudState(syncId);
      // Auto-refresh cloud data every 60 seconds
      const interval = setInterval(() => fetchCloudState(syncId), 60000);
      return () => clearInterval(interval);
    }
  }, [fetchCloudState]);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('capital_traders_enterprise_state', JSON.stringify(state));
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const navigate = (page: 'dashboard' | 'brand' | 'admin' | 'contact', id?: string) => {
    setCurrentView({ page, id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe theme lookup
  const currentTheme = THEMES.find(t => t.id === (state?.theme || 'classic')) || THEMES[0];

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
                    {isCloudSynced ? 'Synchronized' : 'Standalone'}
                  </span>
                </div>
             </div>
          </div>
          <p className="text-center text-gray-600 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} Capital Traders Enterprise.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
