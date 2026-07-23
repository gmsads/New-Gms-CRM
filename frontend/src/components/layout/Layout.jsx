import { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mb-4" />
    <span className="text-slate-500 font-bold text-sm tracking-wide">Loading module...</span>
  </div>
);

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Global Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth overscroll-y-none">
          {/* Universal Page Container */}
          <main className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 min-h-full flex flex-col">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
