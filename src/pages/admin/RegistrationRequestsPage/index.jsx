import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Store,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Building2,
  FileText,
  Hash,
  Trash2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS, APPROVAL_STATUS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/helpers';
import { Button, Spinner } from '../../../components/ui';
import {
  StatsHeader,
  FilterChips,
  StatusBadge,
  EmptyState,
  ConfirmDialog,
} from '../../../components';
import { DetailModal, DetailRow, DetailSection, RejectModal } from '../../../components';

const RegistrationRequestsPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Estado local
  const [requests, setRequests] = useState([]);
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
      const data = await adminService.getPendingSellers();
      const items = Array.isArray(data) ? data : [];

      const mapped = items.map((item) => {
        const usuario = item.usuario || item.tbl_usuarios || {};
        const estado = item.estado || item.estado_aprobacion || APPROVAL_STATUS.PENDING;

        // Mapear estado backend a key para StatusBadge
        const statusMap = {
          [APPROVAL_STATUS.PENDING]: 'pending',
          [APPROVAL_STATUS.APPROVED]: 'approved',
          [APPROVAL_STATUS.REJECTED]: 'rejected',
        };

        return {
          id: item.id,
          ownerName: usuario.nombre || item.razon_social || 'Vendedor',
          shopName: item.nombre_tienda || usuario.tiendas?.[0]?.nombre || item.nombre_negocio || item.razon_social || '-',
          email: usuario.correo || '-',
          phone: usuario.telefono || '-',
          ruc: item.ruc || null,
          dni: item.dni || null,
          status: statusMap[estado] || 'pending',
          requestDate: item.fecha_hora_registro,
          rejectionReason: item.motivo_rechazo || '',
          // Guardar raw para enviar al backend
          _raw: item,
        };
      });

      setRequests(mapped);
      setSelectedIds(new Set());
    } catch (err) {
      enqueueSnackbar('Error al cargar solicitudes de registro', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Cargar al montar + SSE
  useEffect(() => {
    loadData();

    const handleSSE = () => loadData();

    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_SELLER, handleSSE);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_SELLER, handleSSE);
    };
  }, [loadData]);

  // Estadisticas
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    return [
      { key: 'pending', label: 'Pendientes', value: pending, color: 'warning' },
      { key: 'approved', label: 'Aprobados', value: approved, color: 'success' },
      { key: 'rejected', label: 'Rechazados', value: rejected, color: 'error' },
    ];
  }, [requests]);

  // Filtrar
  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  // Filtros rapidos
  const quickFilters = [
    { key: 'pending', label: 'Pendientes', count: stats[0].value },
    { key: 'all', label: 'Todos', count: requests.length },
    { key: 'approved', label: 'Aprobados', count: stats[1].value },
    { key: 'rejected', label: 'Rechazados', count: stats[2].value },
  ];

  // Aprobar solicitud
  const handleApprove = async () => {
    if (!requestToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveSeller(requestToProcess.id, { estado: APPROVAL_STATUS.APPROVED });
      enqueueSnackbar(`Solicitud de "${requestToProcess.shopName}" aprobada correctamente`, { variant: 'success' });
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setRequestToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al aprobar solicitud', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar solicitud
  const handleReject = async (reason) => {
    if (!requestToProcess) return;
    setActionLoading(true);
    try {
      await adminService.approveSeller(requestToProcess.id, {
        estado: APPROVAL_STATUS.REJECTED,
        motivo_rechazo: reason,
      });
      enqueueSnackbar(`Solicitud de "${requestToProcess.shopName}" rechazada`, { variant: 'info' });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRequestToProcess(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al rechazar solicitud', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle seleccion individual
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const rejectedItems = useMemo(() => filteredRequests.filter((r) => r.status === 'rejected'), [filteredRequests]);

  const allRejectedSelected = rejectedItems.length > 0 && rejectedItems.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allRejectedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rejectedItems.map((r) => r.id)));
    }
  };

  // Eliminar rechazados en bulk
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      await adminService.bulkDeleteRejectedSellers([...selectedIds]);
      enqueueSnackbar(`${selectedIds.size} vendedor(es) eliminado(s) correctamente`, { variant: 'success' });
      setShowDeleteDialog(false);
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al eliminar', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Solicitudes de Registro
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
          message="No hay solicitudes de registro para mostrar."
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
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.ownerName}</h3>
                    <p className="text-sm text-gray-500 truncate">{item.shopName}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="border-t border-gray-100 my-2" />

                {/* Info rows */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{item.phone}</span>
                  </div>
                  {(item.ruc || item.dni) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText size={16} className="text-gray-400 flex-shrink-0" />
                      <span>{item.ruc ? `RUC: ${item.ruc}` : `DNI: ${item.dni}`}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{formatDateTime(item.requestDate)}</span>
                  </div>
                </div>

                {/* Motivo rechazo */}
                {item.rejectionReason && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
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
        title="Detalle de Solicitud"
        subtitle={selectedRequest?.shopName}
        headerIcon={<Store className="text-primary" />}
        maxWidth="sm"
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
            <div className="flex items-center gap-3 mb-6">
              <StatusBadge status={selectedRequest.status} size="medium" />
              <span className="text-sm text-gray-500">
                Solicitud: {formatDateTime(selectedRequest.requestDate)}
              </span>
            </div>

            <DetailSection title="Informacion del Vendedor">
              <DetailRow
                icon={<Store size={16} />}
                label="Tienda"
                value={selectedRequest.shopName}
              />
              <DetailRow
                icon={<User size={16} />}
                label="Propietario"
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
              {selectedRequest.ruc && (
                <DetailRow
                  icon={<FileText size={16} />}
                  label="RUC"
                  value={selectedRequest.ruc}
                />
              )}
              {selectedRequest.dni && (
                <DetailRow
                  icon={<Hash size={16} />}
                  label="DNI"
                  value={selectedRequest.dni}
                />
              )}
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
        title="Aprobar Solicitud?"
        message={`Estas a punto de aprobar la solicitud de "${requestToProcess?.shopName}". El vendedor recibira acceso completo a la plataforma y podra comenzar a publicar productos.`}
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
        title="Rechazar Solicitud"
        itemName={requestToProcess?.shopName}
        subtitle="El solicitante sera notificado con el motivo proporcionado."
        loading={actionLoading}
      />

      {/* Modal de eliminacion masiva */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar vendedores rechazados?"
        message={`Se eliminaran ${selectedIds.size} vendedor(es) rechazado(s) y todas sus tiendas y productos asociados. Esta accion no se puede deshacer. Los datos historicos (reportes, finanzas, etc.) no se veran afectados.`}
        confirmText="Si, Eliminar"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default RegistrationRequestsPage;
