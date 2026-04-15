import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Store,
  MapPin,
  DollarSign,
  Tag,
  Building2,
  Hash,
  Calendar,
  Info,
  Trash2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS, APPROVAL_STATUS } from '../../../utils/constants';
import { formatDate, formatCurrency, getImageUrl } from '../../../utils/helpers';
import { Button, Spinner } from '../../../components/ui';
import {
  StatsHeader,
  FilterChips,
  StatusBadge,
  EmptyState,
  ImagePreview,
  ConfirmDialog,
} from '../../../components';
import { DetailModal, DetailRow, DetailSection, RejectModal } from '../../../components';

const ProductRequestsPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Estado local
  const [productRequests, setProductRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [requestToProcess, setRequestToProcess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Cargar solicitudes
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingProducts();
      const items = Array.isArray(data) ? data : [];

      const mapped = items.map((item) => {
        const tienda = item.tienda || {};
        const fotos = item.fotos || [];

        const statusMap = {
          [APPROVAL_STATUS.PENDING]: 'pending',
          [APPROVAL_STATUS.APPROVED]: 'approved',
          [APPROVAL_STATUS.REJECTED]: 'rejected',
        };

        return {
          id: item.id,
          name: item.nombre || '',
          description: item.descripcion || '',
          category: item.categoria || '-',
          price: item.precio,
          images: fotos.map((f) => getImageUrl(f.url || f)),
          status: statusMap[item.estado_aprobacion] || 'pending',
          createdAt: item.fecha_hora_registro || '',
          rejectionReason: item.motivo_rechazo || '',
          // Tienda info
          shopName: tienda.nombre || '-',
          sellerName: tienda.vendedor_nombre || '-',
          shopStatus: tienda.estado_aprobacion || '',
          shopSubscription: tienda.suscripcion || null,
          galleryName: tienda.galeria || '-',
          storeNumber: tienda.numero_local || '',
          cityName: tienda.ciudad || '-',
          zoneName: tienda.zona || '-',
        };
      });

      setProductRequests(mapped);
      setSelectedIds(new Set());
    } catch (err) {
      enqueueSnackbar('Error al cargar solicitudes de productos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Cargar al montar + SSE
  useEffect(() => {
    loadData();

    const handleSSE = () => loadData();
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_PRODUCT, handleSSE);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_PRODUCT, handleSSE);
    };
  }, [loadData]);

  // Estadisticas
  const stats = useMemo(() => {
    const pending = productRequests.filter((r) => r.status === 'pending').length;
    const approved = productRequests.filter((r) => r.status === 'approved').length;
    const rejected = productRequests.filter((r) => r.status === 'rejected').length;
    return [
      { key: 'pending', label: 'Pendientes', value: pending, color: 'warning' },
      { key: 'approved', label: 'Aprobados', value: approved, color: 'success' },
      { key: 'rejected', label: 'Rechazados', value: rejected, color: 'error' },
    ];
  }, [productRequests]);

  // Filtrar
  const filteredRequests = useMemo(() => {
    if (filter === 'all') return productRequests;
    return productRequests.filter((r) => r.status === filter);
  }, [productRequests, filter]);

  // Filtros rapidos
  const quickFilters = [
    { key: 'pending', label: 'Pendientes', count: stats[0].value },
    { key: 'all', label: 'Todos', count: productRequests.length },
    { key: 'approved', label: 'Aprobados', count: stats[1].value },
    { key: 'rejected', label: 'Rechazados', count: stats[2].value },
  ];

  const rejectedItems = useMemo(() => filteredRequests.filter((r) => r.status === 'rejected'), [filteredRequests]);
  const allRejectedSelected = rejectedItems.length > 0 && rejectedItems.every((r) => selectedIds.has(r.id));

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
      setSelectedIds(new Set(rejectedItems.map((r) => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      await adminService.bulkDeleteRejectedProducts([...selectedIds]);
      enqueueSnackbar(`${selectedIds.size} producto(s) eliminado(s) correctamente`, { variant: 'success' });
      setShowDeleteDialog(false);
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al eliminar', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Aprobar
  const handleApprove = async () => {
    if (!requestToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveProduct(requestToProcess.id, { estado: APPROVAL_STATUS.APPROVED });
      enqueueSnackbar(`Producto "${requestToProcess.name}" aprobado correctamente`, { variant: 'success' });
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setRequestToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al aprobar producto', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar
  const handleReject = async (reason) => {
    if (!requestToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveProduct(requestToProcess.id, {
        estado: APPROVAL_STATUS.REJECTED,
        motivo_rechazo: reason,
      });
      enqueueSnackbar(`Producto "${requestToProcess.name}" rechazado`, { variant: 'info' });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRequestToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al rechazar producto', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Solicitudes de Productos
        </h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Filtros */}
      <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-4 mb-6">
        <FilterChips
          filters={quickFilters}
          activeFilter={filter}
          onChange={setFilter}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="Sin solicitudes"
          message="No hay solicitudes de productos para mostrar."
        />
      ) : (
        <>
        {rejectedItems.length > 0 && (
          <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allRejectedSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Marcar todos los rechazados ({rejectedItems.length})
            </label>
            {selectedIds.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                startIcon={<Trash2 size={16} />}
                onClick={() => setShowDeleteDialog(true)}
              >
                Eliminar seleccionados ({selectedIds.size})
              </Button>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-xl shadow-card border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
              onClick={() => setSelectedRequest(item)}
            >
              {/* Imagen del producto */}
              {item.images.length > 0 && (
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}

              <div className="p-4">
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
                {/* Nombre + badge */}
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="flex-1 font-semibold text-gray-900 truncate">
                    {item.name}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {item.sellerName}
                </p>

                {/* Sub-card tienda */}
                {item.shopName !== '-' && (
                  <div className="border-l-4 border-primary/30 bg-gray-50 rounded-r-lg p-2.5 mb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.shopName}</p>
                      {item.shopStatus === APPROVAL_STATUS.APPROVED && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle size={12} /> Activa
                        </span>
                      )}
                    </div>
                    {item.shopSubscription && (
                      <div className="flex items-center gap-1.5">
                        <Info size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500 bg-gray-200/60 px-1.5 py-0.5 rounded-full">
                          Plan {item.shopSubscription}
                        </span>
                      </div>
                    )}
                    {item.galleryName !== '-' && (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">
                          {item.galleryName}{item.storeNumber ? ` - Stand ${item.storeNumber}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Detalles */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{item.price != null ? formatCurrency(item.price) : '-'}</span>
                  </div>
                  {item.cityName !== '-' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{item.cityName}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Fecha: {formatDate(item.createdAt)}
                </p>

                {/* Motivo rechazo */}
                {item.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">{item.rejectionReason}</p>
                  </div>
                )}

                {/* Quick Actions */}
                {item.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      startIcon={<XCircle size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRequestToProcess(item);
                        setShowRejectModal(true);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Rechazar
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      fullWidth
                      startIcon={<CheckCircle size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRequestToProcess(item);
                        setShowApproveDialog(true);
                      }}
                    >
                      Aprobar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Detail Modal */}
      <DetailModal
        open={selectedRequest !== null && !showRejectModal && !showApproveDialog}
        onClose={() => setSelectedRequest(null)}
        title="Detalle del Producto"
        subtitle={selectedRequest?.name}
        headerIcon={<Package className="text-primary" />}
        maxWidth="md"
        actions={
          selectedRequest?.status === 'pending' ? (
            <>
              <Button
                variant="outline"
                startIcon={<XCircle size={18} />}
                onClick={() => {
                  setRequestToProcess(selectedRequest);
                  setShowRejectModal(true);
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Rechazar
              </Button>
              <Button
                variant="success"
                startIcon={<CheckCircle size={18} />}
                onClick={() => {
                  setRequestToProcess(selectedRequest);
                  setShowApproveDialog(true);
                }}
              >
                Aprobar
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setSelectedRequest(null)}>
              Cerrar
            </Button>
          )
        }
      >
        {selectedRequest && (
          <>
            {/* Estado */}
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={selectedRequest.status} size="medium" />
            </div>

            {/* Fotos */}
            {selectedRequest.images.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-2 flex-wrap">
                  {selectedRequest.images.map((url, i) => (
                    <ImagePreview
                      key={i}
                      src={url}
                      alt={`Producto ${i + 1}`}
                      width={100}
                      height={100}
                    />
                  ))}
                </div>
              </div>
            )}

            <DetailSection title="Informacion del Producto">
              <DetailRow
                icon={<Package size={16} />}
                label="Nombre"
                value={selectedRequest.name}
              />
              <DetailRow
                label="Descripcion"
                value={selectedRequest.description || 'Sin descripcion'}
                fullWidth
              />
              <DetailRow
                icon={<Tag size={16} />}
                label="Categoria"
                value={selectedRequest.category}
              />
              <DetailRow
                icon={<DollarSign size={16} />}
                label="Precio"
                value={selectedRequest.price != null ? formatCurrency(selectedRequest.price) : '-'}
              />
              <DetailRow
                icon={<Calendar size={16} />}
                label="Fecha Solicitud"
                value={formatDate(selectedRequest.createdAt)}
              />
            </DetailSection>

            <DetailSection title="Informacion del Vendedor">
              <DetailRow
                label="Vendedor"
                value={selectedRequest.sellerName}
              />
              <DetailRow
                icon={<Store size={16} />}
                label="Tienda"
                value={selectedRequest.shopName}
              />
            </DetailSection>

            <DetailSection title="Ubicacion de la Tienda">
              <DetailRow
                icon={<MapPin size={16} />}
                label="Ciudad"
                value={selectedRequest.cityName}
              />
              <DetailRow
                label="Zona"
                value={selectedRequest.zoneName}
              />
              <DetailRow
                icon={<Building2 size={16} />}
                label="Galeria"
                value={selectedRequest.galleryName}
              />
              <DetailRow
                icon={<Hash size={16} />}
                label="Stand"
                value={selectedRequest.storeNumber || '-'}
              />
            </DetailSection>

            {/* Motivo de rechazo */}
            {selectedRequest.rejectionReason && (
              <DetailSection title="Motivo de Rechazo">
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-800">
                    {selectedRequest.rejectionReason}
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
          setRequestToProcess(null);
        }}
        onConfirm={handleApprove}
        title="Aprobar Producto?"
        message={`Estas a punto de aprobar el producto "${requestToProcess?.name}". El producto sera visible en la plataforma.`}
        confirmText="Si, Aprobar"
        type="success"
        loading={actionLoading}
      />

      {/* Modal de rechazo */}
      <RejectModal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRequestToProcess(null);
        }}
        onConfirm={handleReject}
        title="Rechazar Producto"
        itemName={requestToProcess?.name}
        subtitle="Proporciona un motivo para el rechazo. El vendedor podra corregir y reenviar el producto."
        loading={actionLoading}
      />

      {/* Modal de eliminacion masiva */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar productos rechazados?"
        message={`Se eliminaran ${selectedIds.size} producto(s) rechazado(s). Los datos historicos (calificaciones, favoritos, listas de compra) no se veran afectados.`}
        confirmText="Si, Eliminar"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default ProductRequestsPage;
