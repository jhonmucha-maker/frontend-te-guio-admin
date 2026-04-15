import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Store,
  MapPin,
  Mail,
  Phone,
  User,
  Map,
  CheckCircle,
  XCircle,
  Calendar,
  Hash,
  Trash2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS, APPROVAL_STATUS } from '../../../utils/constants';
import { formatDate, getImageUrl } from '../../../utils/helpers';
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

const StoreRequestsPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Estado local
  const [storeRequests, setStoreRequests] = useState([]);
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
      const data = await adminService.getPendingStores();
      const items = Array.isArray(data) ? data : [];

      const mapped = items.map((store) => {
        const galeria = store.galeria || {};
        const vendedor = store.vendedor || {};
        const fotos = store.fotos || [];
        const galeriaFotos = galeria.fotos || [];

        const statusMap = {
          [APPROVAL_STATUS.PENDING]: 'pending',
          [APPROVAL_STATUS.APPROVED]: 'approved',
          [APPROVAL_STATUS.REJECTED]: 'rejected',
        };

        // Coordenadas de galeria
        let galleryCoordinates = null;
        if (galeria.latitud && galeria.longitud) {
          galleryCoordinates = {
            latitude: parseFloat(galeria.latitud),
            longitude: parseFloat(galeria.longitud),
          };
        }

        return {
          id: store.id,
          storeName: store.nombre || '',
          storeNumber: store.numero_local || store.direccion || '',
          description: store.descripcion || '',
          ownerName: vendedor.nombre || '-',
          email: vendedor.correo || '-',
          phone: vendedor.telefono || '-',
          galleryName: galeria.nombre || '',
          galleryAddress: galeria.direccion || '',
          cityName: galeria.ciudad || '',
          zoneName: galeria.zona || '',
          galleryCoordinates,
          storePhotos: fotos.map((f) => getImageUrl(f.url || f)),
          galleryPhotos: galeriaFotos.map((f) => getImageUrl(f.url || f)),
          status: statusMap[store.estado_aprobacion] || 'pending',
          rejectionReason: store.motivo_aprobacion || '',
          createdAt: store.fecha_hora_registro || '',
        };
      });

      setStoreRequests(mapped);
      setSelectedIds(new Set());
    } catch (err) {
      enqueueSnackbar('Error al cargar solicitudes de tiendas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Cargar al montar + SSE
  useEffect(() => {
    loadData();

    const handleSSE = () => loadData();
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_STORE, handleSSE);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_STORE, handleSSE);
    };
  }, [loadData]);

  // Estadisticas
  const stats = useMemo(() => {
    const pending = storeRequests.filter((r) => r.status === 'pending').length;
    const approved = storeRequests.filter((r) => r.status === 'approved').length;
    const rejected = storeRequests.filter((r) => r.status === 'rejected').length;
    return [
      { key: 'pending', label: 'Pendientes', value: pending, color: 'warning' },
      { key: 'approved', label: 'Aprobadas', value: approved, color: 'success' },
      { key: 'rejected', label: 'Rechazadas', value: rejected, color: 'error' },
    ];
  }, [storeRequests]);

  // Filtrar
  const filteredRequests = useMemo(() => {
    if (filter === 'all') return storeRequests;
    return storeRequests.filter((r) => r.status === filter);
  }, [storeRequests, filter]);

  // Filtros rapidos
  const quickFilters = [
    { key: 'pending', label: 'Pendientes', count: stats[0].value },
    { key: 'all', label: 'Todas', count: storeRequests.length },
    { key: 'approved', label: 'Aprobadas', count: stats[1].value },
    { key: 'rejected', label: 'Rechazadas', count: stats[2].value },
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
      await adminService.bulkDeleteRejectedStores([...selectedIds]);
      enqueueSnackbar(`${selectedIds.size} tienda(s) eliminada(s) correctamente`, { variant: 'success' });
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
      await adminService.approveStore(requestToProcess.id, { estado: APPROVAL_STATUS.APPROVED });
      enqueueSnackbar(`Tienda "${requestToProcess.storeName}" aprobada correctamente`, { variant: 'success' });
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setRequestToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al aprobar tienda', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar
  const handleReject = async (reason) => {
    if (!requestToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveStore(requestToProcess.id, {
        estado: APPROVAL_STATUS.REJECTED,
        motivo_rechazo: reason,
      });
      enqueueSnackbar(`Tienda "${requestToProcess.storeName}" rechazada`, { variant: 'info' });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRequestToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al rechazar tienda', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir Google Maps
  const openGoogleMaps = (coords) => {
    if (coords?.latitude && coords?.longitude) {
      window.open(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`, '_blank');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Solicitudes de Tiendas
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
          message="No hay solicitudes de tiendas para mostrar."
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
              Marcar todas las rechazadas ({rejectedItems.length})
            </label>
            {selectedIds.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                startIcon={<Trash2 size={16} />}
                onClick={() => setShowDeleteDialog(true)}
              >
                Eliminar seleccionadas ({selectedIds.size})
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
              {/* Foto principal de la tienda */}
              {item.storePhotos.length > 0 && (
                <img
                  src={item.storePhotos[0]}
                  alt={item.storeName}
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
                {/* Header: Nombre + badge */}
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="flex-1 font-semibold text-gray-900 truncate">
                    {item.storeName}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {item.ownerName}
                </p>

                <div className="border-t border-gray-100 my-2" />

                {/* Info rows */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Store size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.galleryName || '-'}</span>
                  </div>
                  {item.storeNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash size={16} className="text-gray-400 flex-shrink-0" />
                      <span>Stand: {item.storeNumber}</span>
                    </div>
                  )}
                  {item.cityName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{item.cityName}{item.zoneName ? ` - ${item.zoneName}` : ''}</span>
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

      {/* Modal de detalle */}
      <DetailModal
        open={selectedRequest !== null && !showRejectModal && !showApproveDialog}
        onClose={() => setSelectedRequest(null)}
        title="Detalle de Tienda"
        subtitle={selectedRequest?.storeName}
        headerIcon={<Store className="text-primary" />}
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
              <span className="text-sm text-gray-500">
                Solicitud: {formatDate(selectedRequest.createdAt)}
              </span>
            </div>

            {/* Fotos de la tienda */}
            {selectedRequest.storePhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Fotos de la tienda:</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedRequest.storePhotos.map((url, i) => (
                    <ImagePreview
                      key={i}
                      src={url}
                      alt={`Tienda ${i + 1}`}
                      width={100}
                      height={100}
                    />
                  ))}
                </div>
              </div>
            )}

            <DetailSection title="Informacion de la Tienda">
              <DetailRow
                icon={<Store size={16} />}
                label="Nombre"
                value={selectedRequest.storeName}
              />
              {selectedRequest.storeNumber && (
                <DetailRow
                  icon={<Hash size={16} />}
                  label="N. Tienda / Stand"
                  value={selectedRequest.storeNumber}
                />
              )}
              {selectedRequest.cityName && (
                <DetailRow
                  icon={<MapPin size={16} />}
                  label="Ciudad"
                  value={selectedRequest.cityName}
                />
              )}
              {selectedRequest.zoneName && (
                <DetailRow
                  label="Zona"
                  value={selectedRequest.zoneName}
                />
              )}
              <DetailRow
                icon={<Store size={16} />}
                label="Galeria"
                value={selectedRequest.galleryName || '-'}
              />
              {selectedRequest.galleryAddress && (
                <DetailRow
                  icon={<MapPin size={16} />}
                  label="Dir. Galeria"
                  value={selectedRequest.galleryAddress}
                  fullWidth
                />
              )}
              {selectedRequest.description && (
                <DetailRow
                  label="Descripcion"
                  value={selectedRequest.description}
                  fullWidth
                />
              )}
            </DetailSection>

            <DetailSection title="Informacion del Propietario">
              <DetailRow
                icon={<User size={16} />}
                label="Nombre"
                value={selectedRequest.ownerName}
              />
              <DetailRow
                icon={<Mail size={16} />}
                label="Email"
                value={selectedRequest.email}
              />
              <DetailRow
                icon={<Phone size={16} />}
                label="Telefono"
                value={selectedRequest.phone}
              />
            </DetailSection>

            {/* Fotos de la Galeria */}
            {selectedRequest.galleryPhotos.length > 0 && (
              <DetailSection title="Fotos de la Galeria">
                <div className="flex gap-2 flex-wrap">
                  {selectedRequest.galleryPhotos.map((url, i) => (
                    <ImagePreview
                      key={i}
                      src={url}
                      alt={`Galeria ${i + 1}`}
                      width={100}
                      height={100}
                    />
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Ver en Google Maps */}
            {selectedRequest.galleryCoordinates && (
              <DetailSection title="Ubicacion">
                <Button
                  variant="primary"
                  startIcon={<Map size={18} />}
                  onClick={() => openGoogleMaps(selectedRequest.galleryCoordinates)}
                >
                  Ver en Google Maps
                </Button>
              </DetailSection>
            )}

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
        title="Aprobar Tienda?"
        message={`Estas a punto de aprobar la tienda "${requestToProcess?.storeName}". La tienda sera visible en la plataforma y el vendedor podra publicar productos.`}
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
        title="Rechazar Tienda"
        itemName={requestToProcess?.storeName}
        subtitle="El vendedor sera notificado con el motivo proporcionado y podra corregir y reenviar la solicitud."
        loading={actionLoading}
      />

      {/* Modal de eliminacion masiva */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar tiendas rechazadas?"
        message={`Se eliminaran ${selectedIds.size} tienda(s) rechazada(s) y todos sus productos asociados. Los datos historicos (reportes, finanzas, calificaciones) no se veran afectados.`}
        confirmText="Si, Eliminar"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default StoreRequestsPage;
