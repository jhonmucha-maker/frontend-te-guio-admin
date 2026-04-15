import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Store,
  User,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  Search,
  Edit3,
  Image,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS, API_BASE_URL, APPROVAL_STATUS, SUBSCRIPTION_STATUS } from '../../../utils/constants';
import { formatDate, formatDateTime, formatCurrency } from '../../../utils/helpers';
import { Button, Card, Spinner, Dialog, Input } from '../../../components/ui';
import {
  StatsHeader,
  FilterChips,
  ImagePreview,
  EmptyState,
  ConfirmDialog,
} from '../../../components';
import { DetailModal, DetailRow, DetailSection, RejectModal } from '../../../components';

// Construir URL de uploads
const getUploadUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace('/api', ''); // http://localhost:4002
  if (path.startsWith('/')) return `${base}${path}`;
  return `${base}/uploads/${path}`;
};

// Parsear fecha sin desfase de zona horaria
const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T12:00:00');
  }
  return new Date(dateString);
};

const PremiumSubscriptionsPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Estado local
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showEditExpirationModal, setShowEditExpirationModal] = useState(false);
  const [subscriptionToProcess, setSubscriptionToProcess] = useState(null);
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expiringDaysThreshold, setExpiringDaysThreshold] = useState(15);

  // Cargar suscripciones
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingSubscriptions();
      const items = Array.isArray(data) ? data : [];

      const mapped = items.map((item) => {
        const tienda = item.tbl_tiendas || {};
        const usuario = item.tbl_usuarios || {};
        const galeria = tienda.tbl_galerias || {};
        const ciudad = galeria.tbl_ciudades || {};
        const subActiva = tienda.suscripcion_activa || null;

        const statusMap = {
          [APPROVAL_STATUS.PENDING]: 'pending',
          [APPROVAL_STATUS.APPROVED]: 'approved',
          [APPROVAL_STATUS.REJECTED]: 'rejected',
        };

        // Obtener comprobante
        const archivos = item.archivos || [];
        const comprobante = archivos.find((a) => a.es_comprobante);
        const paymentProof = comprobante?.url_archivo || archivos[0]?.url_archivo || null;

        // Obtener documentos adicionales (no comprobante)
        const additionalDocs = archivos.filter((a) => !a.es_comprobante);

        return {
          id: item.id,
          storeName: tienda.nombre || '',
          sellerName: usuario.nombre || '',
          galleryName: galeria.nombre || '',
          storeCity: ciudad.nombre || '',
          amount: item.plan?.precio,
          subscriptionType: item.tipo_plan_solicitado || item.plan?.tipo || '',
          planName: item.plan?.nombre || '',
          status: statusMap[item.estado] || 'pending',
          requestDate: item.solicitado_en || '',
          approvalDate: item.decidido_en || '',
          rejectionReason: item.motivo_rechazo || '',
          paymentProof,
          additionalDocs,
          // Suscripcion activa
          activeSubscription: subActiva
            ? {
                id: subActiva.id,
                expirationDate: subActiva.fin_en,
                status: subActiva.estado,
              }
            : null,
        };
      });

      setSubscriptions(mapped);
      setSelectedIds(new Set());
    } catch (err) {
      enqueueSnackbar('Error al cargar suscripciones', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Cargar threshold de "por vencer" desde config del sistema
  useEffect(() => {
    adminService.getSystemConfig().then((data) => {
      const arr = Array.isArray(data) ? data : [];
      const cfg = arr.find((c) => c.clave === 'dias_filtro_por_vencer_suscripcion');
      if (cfg?.valor) setExpiringDaysThreshold(parseInt(cfg.valor) || 15);
    }).catch(() => {});
  }, []);

  // Cargar al montar + SSE
  useEffect(() => {
    loadData();

    const handleNewSubscription = () => loadData();
    const handleUpdated = () => loadData();

    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_SUBSCRIPTION, handleNewSubscription);
    subscribeToEvent(SSE_EVENTS.SUBSCRIPTION_REQUEST_UPDATED, handleUpdated);

    // Recargar cuando la pestana vuelve a ser visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_SUBSCRIPTION, handleNewSubscription);
      unsubscribeFromEvent(SSE_EVENTS.SUBSCRIPTION_REQUEST_UPDATED, handleUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // Calcular dias restantes
  const getDaysRemaining = (sub) => {
    if (!sub.activeSubscription?.expirationDate || sub.status !== 'approved') return null;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const expDate = parseDateSafe(sub.activeSubscription.expirationDate);
    if (!expDate) return null;
    return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  };

  const isExpiringSoon = (sub) => {
    const days = getDaysRemaining(sub);
    return days !== null && days > 0 && days <= expiringDaysThreshold;
  };

  const isExpired = (sub) => {
    const days = getDaysRemaining(sub);
    return days !== null && days <= 0;
  };

  // Estadisticas
  const stats = useMemo(() => {
    const pending = subscriptions.filter((s) => s.status === 'pending').length;
    const approved = subscriptions.filter((s) => s.status === 'approved').length;
    const rejected = subscriptions.filter((s) => s.status === 'rejected').length;
    const expiringSoon = subscriptions.filter(isExpiringSoon).length;
    const expired = subscriptions.filter(isExpired).length;
    return [
      { key: 'pending', label: 'Pendientes', value: pending, color: 'warning' },
      { key: 'approved', label: 'Aprobadas', value: approved, color: 'success' },
      { key: 'rejected', label: 'Rechazadas', value: rejected, color: 'error' },
      { key: 'expiring', label: 'Por vencer', value: expiringSoon, color: 'warning' },
      { key: 'expired', label: 'Vencidos', value: expired, color: 'error' },
    ];
  }, [subscriptions, expiringDaysThreshold]);

  // Filtrar
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Filtrar por estado especial
    if (filter === 'expiring') {
      filtered = filtered.filter(isExpiringSoon);
    } else if (filter === 'expired') {
      filtered = filtered.filter(isExpired);
    } else if (filter !== 'all') {
      filtered = filtered.filter((s) => s.status === filter);
    }

    // Filtrar por busqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.storeName?.toLowerCase().includes(query) ||
          s.sellerName?.toLowerCase().includes(query) ||
          s.galleryName?.toLowerCase().includes(query) ||
          s.storeCity?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [subscriptions, filter, searchQuery, expiringDaysThreshold]);

  // Filtros rapidos
  const quickFilters = [
    { key: 'pending', label: 'Pendientes', count: stats[0].value },
    { key: 'all', label: 'Todas', count: subscriptions.length },
    { key: 'approved', label: 'Aprobadas', count: stats[1].value },
    { key: 'rejected', label: 'Rechazadas', count: stats[2].value },
    { key: 'expired', label: 'Vencidos', count: stats[4].value },
    { key: 'expiring', label: 'Por vencer', count: stats[3].value },
  ];

  const rejectedItems = useMemo(() => filteredSubscriptions.filter((s) => s.status === 'rejected'), [filteredSubscriptions]);
  const allRejectedSelected = rejectedItems.length > 0 && rejectedItems.every((s) => selectedIds.has(s.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allRejectedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rejectedItems.map((s) => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      await adminService.bulkDeleteRejectedSubscriptions([...selectedIds]);
      enqueueSnackbar(`${selectedIds.size} solicitud(es) eliminada(s) correctamente`, { variant: 'success' });
      setShowDeleteDialog(false);
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al eliminar', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  // Aprobar
  const handleApprove = async () => {
    if (!subscriptionToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveSubscription(subscriptionToProcess.id, { estado: APPROVAL_STATUS.APPROVED });
      enqueueSnackbar(
        `Suscripcion de "${subscriptionToProcess.storeName || subscriptionToProcess.sellerName}" aprobada correctamente`,
        { variant: 'success' }
      );
      setShowApproveDialog(false);
      setSelectedSubscription(null);
      setSubscriptionToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al aprobar suscripcion', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar
  const handleReject = async (reason) => {
    if (!subscriptionToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveSubscription(subscriptionToProcess.id, {
        estado: APPROVAL_STATUS.REJECTED,
        motivo_rechazo: reason,
      });
      enqueueSnackbar(
        `Suscripcion de "${subscriptionToProcess.storeName || subscriptionToProcess.sellerName}" rechazada`,
        { variant: 'info' }
      );
      setShowRejectModal(false);
      setSelectedSubscription(null);
      setSubscriptionToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al rechazar suscripcion', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Editar fecha de expiracion
  const handleEditExpiration = async () => {
    if (!subscriptionToProcess?.activeSubscription?.id || !newExpirationDate) return;
    setActionLoading(true);
    try {
      await adminService.updateSubscriptionEndDate(subscriptionToProcess.activeSubscription.id, {
        fecha_fin: newExpirationDate,
      });
      enqueueSnackbar('Fecha de expiracion actualizada correctamente', { variant: 'success' });
      setShowEditExpirationModal(false);
      setSelectedSubscription(null);
      setSubscriptionToProcess(null);
      setNewExpirationDate('');
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al actualizar fecha', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de edicion de fecha
  const openEditExpirationModal = (subscription) => {
    setSubscriptionToProcess(subscription);
    if (subscription.activeSubscription?.expirationDate) {
      const date = parseDateSafe(subscription.activeSubscription.expirationDate);
      if (date) {
        setNewExpirationDate(date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
      } else {
        setNewExpirationDate('');
      }
    } else {
      setNewExpirationDate('');
    }
    setShowEditExpirationModal(true);
  };

  const isPdf = (path) => path?.toLowerCase().endsWith('.pdf');

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Suscripciones
        </h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Search y Filtros */}
      <Card className="mb-6">
        <Card.Content className="py-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar tienda, vendedor o galeria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <FilterChips
              filters={quickFilters}
              activeFilter={filter}
              onChange={setFilter}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Loading */}
      {loading && subscriptions.length === 0 && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Selection bar for rejected items */}
      {rejectedItems.length > 0 && (
        <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allRejectedSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Marcar todas las rechazadas ({rejectedItems.length})
          </label>
          {selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              startIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Eliminar seleccionadas ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      {/* Subscriptions Grid */}
      {(subscriptions.length > 0 || !loading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="Sin suscripciones"
                message="No hay suscripciones para mostrar."
              />
            </div>
          ) : (
            filteredSubscriptions.map((item) => {
              const daysRemaining = getDaysRemaining(item);
              const expiring = isExpiringSoon(item);
              const expired = isExpired(item);

              return (
                <Card
                  key={item.id}
                  hover
                  onClick={() => setSelectedSubscription(item)}
                  className="cursor-pointer"
                >
                  <Card.Content>
                    {/* Header */}
                    {item.status === 'rejected' && (
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-xs text-gray-500">Seleccionar para eliminar</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 truncate">Tienda:</p>
                        <h3 className="font-semibold text-gray-800 truncate">
                          {item.storeName || item.sellerName}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Galería:</p>
                        <p className="text-sm text-gray-500 truncate">
                          {item.galleryName || '-'}{item.storeCity ? ` - ${item.storeCity}` : ''}
                        </p>
                        {item.sellerName && item.storeName && (
                          <p className="text-xs text-gray-400 truncate mt-1">
                            Vendedor: <span className="text-gray-500">{item.sellerName}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        {item.subscriptionType && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.subscriptionType === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.subscriptionType === 'PREMIUM' ? 'Premium' : 'Estándar'}
                          </span>
                        )}
                      </div>
                    </div>

                    <hr className="border-gray-100 my-3" />

                    {/* Monto */}
                    <div className="flex items-center justify-between bg-primary/5 rounded-lg p-2 mb-3">
                      <span className="text-sm text-gray-500">Monto:</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Solicitud: {formatDate(item.requestDate)}</span>
                      </div>

                      {item.approvalDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {item.status === 'approved' ? 'Aprobacion' : 'Rechazo'}: {formatDate(item.approvalDate)}
                          </span>
                        </div>
                      )}

                      {item.activeSubscription?.expirationDate && item.status === 'approved' && (
                        <div className={`flex items-center gap-2 ${expired ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-gray-500'}`}>
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Expira: {formatDate(item.activeSubscription.expirationDate)}
                            {daysRemaining !== null && (
                              <span className="ml-1 font-medium">
                                ({expired ? 'Vencido' : `${daysRemaining} dias`})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Alerta de vencimiento */}
                    {(expiring || expired) && (
                      <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-1.5 ${expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        <AlertTriangle size={14} />
                        {expired ? 'Suscripcion vencida' : `Vence en ${daysRemaining} dias`}
                      </div>
                    )}

                    {/* Motivo rechazo */}
                    {item.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                        {item.rejectionReason}
                      </div>
                    )}

                    {/* Quick Actions - Pendientes */}
                    {item.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="danger"
                          size="sm"
                          fullWidth
                          startIcon={<XCircle className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubscriptionToProcess(item);
                            setShowRejectModal(true);
                          }}
                        >
                          Rechazar
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          fullWidth
                          startIcon={<CheckCircle className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubscriptionToProcess(item);
                            setShowApproveDialog(true);
                          }}
                        >
                          Aprobar
                        </Button>
                      </div>
                    )}

                    {/* Boton editar fecha para aprobadas */}
                    {item.status === 'approved' && item.activeSubscription && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          startIcon={<Edit3 className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditExpirationModal(item);
                          }}
                        >
                          Editar Fecha
                        </Button>
                      </div>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Modal de detalle */}
      <DetailModal
        open={selectedSubscription !== null && !showRejectModal && !showApproveDialog && !showEditExpirationModal}
        onClose={() => setSelectedSubscription(null)}
        title="Detalle de Suscripcion"
        subtitle={selectedSubscription?.storeName || selectedSubscription?.sellerName}
        headerIcon={<Star className="w-5 h-5 text-amber-500" />}
        maxWidth="md"
        actions={
          selectedSubscription?.status === 'pending' ? (
            <>
              <Button
                variant="danger"
                startIcon={<XCircle className="w-4 h-4" />}
                onClick={() => {
                  setSubscriptionToProcess(selectedSubscription);
                  setShowRejectModal(true);
                }}
              >
                Rechazar
              </Button>
              <Button
                variant="success"
                startIcon={<CheckCircle className="w-4 h-4" />}
                onClick={() => {
                  setSubscriptionToProcess(selectedSubscription);
                  setShowApproveDialog(true);
                }}
              >
                Aprobar
              </Button>
            </>
          ) : selectedSubscription?.status === 'approved' && selectedSubscription?.activeSubscription ? (
            <>
              <Button
                variant="outline"
                startIcon={<Edit3 className="w-4 h-4" />}
                onClick={() => openEditExpirationModal(selectedSubscription)}
              >
                Editar Fecha
              </Button>
              <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
                Cerrar
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
              Cerrar
            </Button>
          )
        }
      >
        {selectedSubscription && (
          <>
            {/* Estado y Tipo */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedSubscription.status)}`}>
                {getStatusLabel(selectedSubscription.status)}
              </span>
              {selectedSubscription.subscriptionType && (
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedSubscription.subscriptionType === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedSubscription.subscriptionType === 'PREMIUM' ? 'Premium' : 'Estándar'}
                </span>
              )}
              {selectedSubscription.status === 'approved' && selectedSubscription.activeSubscription?.expirationDate && (
                <span className="text-sm text-amber-600">
                  Expira: {formatDate(selectedSubscription.activeSubscription.expirationDate)}
                </span>
              )}
            </div>

            <DetailSection title="Informacion de la Tienda">
              <DetailRow
                icon={<Store className="w-4 h-4" />}
                label="Tienda"
                value={selectedSubscription.storeName || selectedSubscription.sellerName}
              />
              <DetailRow
                icon={<Building2 className="w-4 h-4" />}
                label="Galeria"
                value={selectedSubscription.galleryName || '-'}
              />
              {selectedSubscription.storeCity && (
                <DetailRow
                  label="Ciudad"
                  value={selectedSubscription.storeCity}
                />
              )}
              {selectedSubscription.sellerName && selectedSubscription.storeName && (
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Vendedor"
                  value={selectedSubscription.sellerName}
                />
              )}
            </DetailSection>

            <DetailSection title="Informacion del Pago">
              <DetailRow
                icon={<Star className="w-4 h-4" />}
                label="Tipo de Suscripcion"
                value={
                  selectedSubscription.subscriptionType
                    ? (selectedSubscription.subscriptionType === 'PREMIUM' ? 'Premium' : 'Estándar')
                    : '-'
                }
              />
              <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3 mb-3">
                <span className="text-gray-600">Monto:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(selectedSubscription.amount)}
                </span>
              </div>
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Fecha de Solicitud"
                value={formatDateTime(selectedSubscription.requestDate)}
              />
              {selectedSubscription.approvalDate && (
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label={selectedSubscription.status === 'approved' ? 'Fecha de Aprobacion' : 'Fecha de Rechazo'}
                  value={formatDateTime(selectedSubscription.approvalDate)}
                />
              )}
              {selectedSubscription.activeSubscription?.expirationDate && selectedSubscription.status === 'approved' && (
                <DetailRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Fecha de Expiracion"
                  value={formatDate(selectedSubscription.activeSubscription.expirationDate)}
                />
              )}
            </DetailSection>

            {/* Comprobante de Pago */}
            {(() => {
              // Construir galeria de todas las imagenes (no PDFs)
              const allImages = [];
              if (selectedSubscription.paymentProof && !isPdf(selectedSubscription.paymentProof)) {
                allImages.push(getUploadUrl(selectedSubscription.paymentProof));
              }
              if (selectedSubscription.additionalDocs?.length > 0) {
                selectedSubscription.additionalDocs.forEach((doc) => {
                  if (!isPdf(doc.url_archivo)) {
                    allImages.push(getUploadUrl(doc.url_archivo));
                  }
                });
              }
              let galleryIdx = 0;

              return (
                <>
                  <DetailSection title="Comprobante de Pago">
                    {selectedSubscription.paymentProof ? (
                      isPdf(selectedSubscription.paymentProof) ? (
                        <a
                          href={getUploadUrl(selectedSubscription.paymentProof)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center p-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-12 h-12 text-red-500 mb-2" />
                          <span className="text-primary font-medium">Ver PDF del comprobante</span>
                          <span className="text-xs text-gray-500">Clic para abrir</span>
                        </a>
                      ) : (
                        <ImagePreview
                          src={getUploadUrl(selectedSubscription.paymentProof)}
                          alt="Comprobante de pago"
                          width="100%"
                          height={300}
                          gallery={allImages}
                          galleryIndex={galleryIdx++}
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center p-6 bg-gray-100 rounded-lg">
                        <Image className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Sin comprobante</span>
                      </div>
                    )}
                  </DetailSection>

                  {/* Documentos Adicionales */}
                  {selectedSubscription.additionalDocs?.length > 0 && (
                    <DetailSection title={`Documentos Adicionales (${selectedSubscription.additionalDocs.length})`}>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedSubscription.additionalDocs.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {isPdf(doc.url_archivo) ? (
                              <a
                                href={getUploadUrl(doc.url_archivo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <FileText className="w-8 h-8 text-red-500 mb-1" />
                                <span className="text-xs text-primary font-medium">Ver PDF</span>
                              </a>
                            ) : (
                              <ImagePreview
                                src={getUploadUrl(doc.url_archivo)}
                                alt="Documento adicional"
                                width="100%"
                                height={150}
                                gallery={allImages}
                                galleryIndex={galleryIdx++}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </DetailSection>
                  )}
                </>
              );
            })()}

            {/* Suscripcion activa - info adicional */}
            {selectedSubscription.status === 'approved' && selectedSubscription.activeSubscription && (
              <DetailSection title="Suscripcion Activa">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-500">Estado:</span>{' '}
                    <span className={`font-semibold ${selectedSubscription.activeSubscription.status === SUBSCRIPTION_STATUS.ACTIVE ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedSubscription.activeSubscription.status === SUBSCRIPTION_STATUS.ACTIVE ? 'Activa' : 'Expirada'}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-500">Expira:</span>{' '}
                    <span className="font-semibold text-amber-600">
                      {formatDateTime(selectedSubscription.activeSubscription.expirationDate)}
                    </span>
                  </p>
                </div>
              </DetailSection>
            )}

            {/* Motivo de rechazo */}
            {selectedSubscription.rejectionReason && (
              <DetailSection title="Motivo de Rechazo">
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-700">
                    {selectedSubscription.rejectionReason}
                  </p>
                </div>
              </DetailSection>
            )}
          </>
        )}
      </DetailModal>

      {/* Modal de aprobacion */}
      <ConfirmDialog
        open={showApproveDialog}
        onClose={() => {
          setShowApproveDialog(false);
          setSubscriptionToProcess(null);
        }}
        onConfirm={handleApprove}
        title="Aprobar Suscripcion?"
        message={`Estas a punto de aprobar la suscripcion premium de "${subscriptionToProcess?.storeName || subscriptionToProcess?.sellerName}". La tienda obtendra beneficios premium.`}
        confirmText="Si, Aprobar"
        type="success"
        loading={actionLoading}
      />

      {/* Modal de rechazo */}
      <RejectModal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSubscriptionToProcess(null);
        }}
        onConfirm={handleReject}
        title="Rechazar Suscripcion"
        itemName={subscriptionToProcess?.storeName || subscriptionToProcess?.sellerName}
        subtitle="El vendedor sera notificado con el motivo proporcionado."
        loading={actionLoading}
      />

      {/* Modal de edicion de fecha de expiracion */}
      <Dialog
        open={showEditExpirationModal}
        onClose={() => {
          setShowEditExpirationModal(false);
          setSubscriptionToProcess(null);
          setNewExpirationDate('');
        }}
        maxWidth="sm"
      >
        <Dialog.Header
          onClose={() => {
            setShowEditExpirationModal(false);
            setSubscriptionToProcess(null);
            setNewExpirationDate('');
          }}
        >
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Editar Fecha de Expiracion
          </div>
        </Dialog.Header>

        <Dialog.Content>
          <p className="text-gray-500 mb-4">
            Modifica la fecha de expiracion de la suscripcion de{' '}
            <strong>{subscriptionToProcess?.storeName || subscriptionToProcess?.sellerName}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva fecha de expiracion
            </label>
            <input
              type="date"
              value={newExpirationDate}
              onChange={(e) => setNewExpirationDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </Dialog.Content>

        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={() => {
              setShowEditExpirationModal(false);
              setSubscriptionToProcess(null);
              setNewExpirationDate('');
            }}
            disabled={actionLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleEditExpiration}
            disabled={!newExpirationDate || actionLoading}
            loading={actionLoading}
          >
            Guardar
          </Button>
        </Dialog.Footer>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar solicitudes rechazadas?"
        message={`Se eliminaran ${selectedIds.size} solicitud(es) de suscripcion rechazada(s). Los datos de transacciones y finanzas no se veran afectados.`}
        confirmText="Si, Eliminar"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default PremiumSubscriptionsPage;
