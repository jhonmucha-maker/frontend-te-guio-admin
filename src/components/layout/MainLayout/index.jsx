import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Spinner } from '../../ui';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { SIDEBAR_WIDTH } from '../../../utils/constants';

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cerrar sidebar en mobile al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col min-h-screen w-full transition-all duration-200"
        style={{
          marginLeft: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
        }}
      >
        {/* Header */}
        <Header onMenuClick={handleDrawerToggle} showMenuButton={isMobile} />

        {/* Page Content */}
        <div className="flex-1 bg-neutral-50">
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
