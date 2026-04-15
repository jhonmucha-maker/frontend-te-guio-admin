import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  ClipboardList,
  Package,
  CreditCard,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/helpers';
import { Card, Spinner } from '../../../components/ui';

const capitalizeWords = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

const DashboardPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await adminService.getDashboard();
      setData(result);
    } catch {
      enqueueSnackbar('Error al cargar el dashboard', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadDashboard();

    const handler = () => loadDashboard();
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_SELLER, handler);
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_STORE, handler);
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_PRODUCT, handler);
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_SUBSCRIPTION, handler);
    subscribeToEvent(SSE_EVENTS.TICKET_CREATED, handler);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_SELLER, handler);
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_STORE, handler);
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_PRODUCT, handler);
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_SUBSCRIPTION, handler);
      unsubscribeFromEvent(SSE_EVENTS.TICKET_CREATED, handler);
    };
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const today = capitalizeWords(
    new Date().toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  );

  // 8 stat cards matching the reference
  const cards = [
    {
      label: 'Total Compradores',
      value: data?.totalBuyers || 0,
      subtitle: `${data?.totalBuyers || 0} registrados`,
      icon: Users,
      color: 'info',
      borderColor: 'border-t-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      to: '/buyers',
    },
    {
      label: 'Total Vendedores',
      value: data?.totalSellers || 0,
      subtitle: `${data?.premiumSellers || 0} Premium · ${data?.standardSellers || 0} Estándar`,
      icon: Building2,
      color: 'success',
      borderColor: 'border-t-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      to: '/sellers',
    },
    {
      label: 'Solicitudes de Registro',
      value: data?.pendingSellers || 0,
      subtitle: 'Nuevos vendedores',
      icon: ClipboardList,
      color: 'warning',
      borderColor: 'border-t-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      to: '/registration-requests',
    },
    {
      label: 'Solicitudes de Tiendas',
      value: data?.pendingStores || 0,
      subtitle: 'Nuevas tiendas',
      icon: Building2,
      color: 'accent',
      borderColor: 'border-t-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      to: '/store-requests',
    },
    {
      label: 'Solicitudes de Productos',
      value: data?.pendingProducts || 0,
      subtitle: 'Nuevos productos',
      icon: Package,
      color: 'success',
      borderColor: 'border-t-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      to: '/product-requests',
    },
    {
      label: 'Suscripciones Pendientes',
      value: data?.pendingSubscriptions || 0,
      subtitle: 'Por aprobar',
      icon: CreditCard,
      color: 'primary',
      borderColor: 'border-t-indigo-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      to: '/subscriptions',
    },
    {
      label: 'Ingresos Totales',
      value: formatCurrency(data?.totalRevenue || 0),
      subtitle: `${formatCurrency(data?.monthlyRevenue || 0)} este mes`,
      icon: DollarSign,
      color: 'accent',
      borderColor: 'border-t-teal-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      to: '/finances',
    },
    {
      label: 'Quejas Pendientes',
      value: data?.openTickets || 0,
      subtitle: 'Por atender',
      icon: AlertCircle,
      color: 'error',
      borderColor: 'border-t-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      to: '/complaints',
    },
  ];

  // Pending actions - only show those with value > 0
  const pendingActions = [
    { value: data?.pendingSellers || 0, label: 'Solicitud(es) de registro', to: '/registration-requests' },
    { value: data?.pendingStores || 0, label: 'Solicitud(es) de tiendas', to: '/store-requests' },
    { value: data?.pendingProducts || 0, label: 'Solicitud(es) de productos', to: '/product-requests' },
    { value: data?.pendingSubscriptions || 0, label: 'Suscripcion(es) pendiente(s)', to: '/subscriptions' },
    { value: data?.openTickets || 0, label: 'Queja(s) pendiente(s)', to: '/complaints' },
  ].filter((a) => a.value > 0);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <p className="text-sm text-gray-500 font-medium">Bienvenido, Admin</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Summary Bar */}
      <Card className="mb-6">
        <Card.Content>
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="flex flex-col items-center justify-center px-2">
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {(data?.totalBuyers || 0) + (data?.totalSellers || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Usuarios</p>
            </div>
            <div className="flex flex-col items-center justify-center px-2">
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {data?.subscribedSellers || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Suscritos</p>
            </div>
            <div className="flex flex-col items-center justify-center px-2">
              <p className="text-lg sm:text-2xl font-bold text-primary whitespace-nowrap">
                {formatCurrency(data?.totalRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ingresos</p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Section Title */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen General</h2>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={i}
              hover
              onClick={() => navigate(card.to)}
              className={`relative border-t-4 ${card.borderColor}`}
            >
              <Card.Content>
                {/* Arrow icon in top-right corner */}
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <Card.Content>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-amber-700">
                Acciones Pendientes
              </h3>
            </div>

            {/* Action list */}
            <div className="space-y-1">
              {pendingActions.map((action, i) => (
                <Link
                  key={i}
                  to={action.to}
                  className="flex items-center gap-3 py-2.5 px-2 hover:bg-amber-100/60 rounded-lg transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {action.value}
                  </span>
                  <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
