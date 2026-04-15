import { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  ClipboardList,
  Package,
  Building2,
  CreditCard,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  FolderTree,
  ShieldCheck,
  Bell,
  X,
} from 'lucide-react';
import { SIDEBAR_WIDTH, APP_NAME, APP_VERSION, SSE_EVENTS } from '../../../utils/constants';
import adminService from '../../../services/adminService';
import useAuthStore from '../../../store/useAuthStore';
import { connectSocket, subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';

const getMenuSections = (isPrimaryAdmin) => [
  {
    title: 'Principal',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestion de Usuarios',
    items: [
      { path: '/buyers', label: 'Compradores', icon: Users },
      { path: '/sellers', label: 'Vendedores', icon: Store },
    ],
  },
  {
    title: 'Solicitudes',
    items: [
      { path: '/registration-requests', label: 'Registro de Vendedores', icon: ClipboardList, badgeKey: 'pendingSellers' },
      { path: '/product-requests', label: 'Productos', icon: FolderTree, badgeKey: 'pendingProducts' },
      { path: '/store-requests', label: 'Tiendas', icon: Building2, badgeKey: 'pendingStores' },
    ],
  },
  {
    title: 'Gestion de Contenido',
    items: [
      { path: '/products', label: 'Productos', icon: Package },
      { path: '/stores', label: 'Tiendas', icon: Building2 },
    ],
  },
  {
    title: 'Negocio',
    items: [
      { path: '/subscriptions', label: 'Suscripciones', icon: CreditCard, badgeKey: 'pendingSubscriptions' },
      { path: '/payment-methods', label: 'Metodos de Pago', icon: DollarSign },
      { path: '/finances', label: 'Finanzas', icon: BarChart3 },
      { path: '/reports', label: 'Reportes', icon: BarChart3 },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { path: '/complaints', label: 'Quejas y Sugerencias', icon: MessageSquare, badgeKey: 'openTickets' },
      ...(isPrimaryAdmin ? [{ path: '/admins', label: 'Administradores', icon: ShieldCheck }] : []),
      { path: '/push-notifications', label: 'Notificaciones Push', icon: Bell },
      { path: '/config', label: 'Configuracion', icon: Settings },
    ],
  },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isPrimaryAdmin = !user?.id_usuario_registro || user.id_usuario_registro === user.id;
  const menuSections = useMemo(() => getMenuSections(isPrimaryAdmin), [isPrimaryAdmin]);
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(() => {
    adminService.getDashboard()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();

    const socketEvents = Object.values(SSE_EVENTS);
    const handleSocketEvent = () => loadStats();

    const setupSocket = async () => {
      try {
        await connectSocket();
        socketEvents.forEach((event) => {
          subscribeToEvent(event, handleSocketEvent);
        });
      } catch (err) {
        console.log('[Sidebar] Error conectando socket:', err);
      }
    };

    setupSocket();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadStats();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socketEvents.forEach((event) => {
        unsubscribeFromEvent(event, handleSocketEvent);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadStats]);

  const getBadgeValue = (key) => {
    if (!key || !stats) return 0;
    return stats[key] || 0;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-primary text-white">
      <div className="p-4 sm:p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 sm:w-11 sm:h-11 object-contain" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold truncate">{APP_NAME}</h1>
            <p className="text-xs text-white/60">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <h2 className="px-5 py-2 text-2xs sm:text-xs font-semibold text-white/50 uppercase tracking-wider">
              {section.title}
            </h2>
            <ul className="px-3 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const badgeValue = getBadgeValue(item.badgeKey);

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => variant === 'temporary' && onClose?.()}
                      className={`
                        flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-lg
                        transition-all duration-150
                        ${isActive
                          ? 'bg-accent/20 text-accent border-l-[3px] border-accent -ml-[3px] pl-[15px]'
                          : 'text-white/80 hover:bg-white/10'
                        }
                      `}
                    >
                      <Icon size={18} className={isActive ? 'text-accent' : 'text-white/60'} />
                      <span className="text-xs sm:text-sm flex-1 truncate">{item.label}</span>
                      {badgeValue > 0 && (
                        <span className="bg-secondary text-white text-2xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {badgeValue > 99 ? '99+' : badgeValue}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            {sectionIndex < menuSections.length - 1 && (
              <div className="my-3 mx-4 border-t border-white/10" />
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 text-center">
        <span className="text-2xs text-white/50">v{APP_VERSION}</span>
      </div>
    </div>
  );

  if (variant === 'permanent') {
    return (
      <aside className="fixed left-0 top-0 h-screen z-30" style={{ width: `${SIDEBAR_WIDTH}px` }}>
        {sidebarContent}
      </aside>
    );
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: `${SIDEBAR_WIDTH}px` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg z-10"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
