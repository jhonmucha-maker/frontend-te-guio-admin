import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/helpers';
import { Button, Switch, Spinner } from '../../../components/ui';
import {
  StatsHeader,
  DataTable,
  SearchInput,
  FilterChips,
  StatusBadge,
  ConfirmDialog,
} from '../../../components';
import DetailModal, { DetailRow, DetailSection } from '../../../components/modals/DetailModal';

const BuyersPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Data state
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, buyer: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Load buyers from API
  const loadBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getBuyers();
      // Backend returns { compradores, total, activos, inactivos }
      setBuyers(data?.compradores || []);
    } catch {
      enqueueSnackbar('Error al cargar compradores', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadBuyers();

    loadBuyers();
  }, [loadBuyers]);

  // Toggle active status
  const handleToggleActive = async (buyer) => {
    setActionLoading(true);
    try {
      await adminService.toggleUserActive(buyer.id);
      enqueueSnackbar(
        buyer.activo ? 'Comprador desactivado' : 'Comprador activado',
        { variant: 'success' }
      );
      // Update local state
      setBuyers((prev) =>
        prev.map((b) => (b.id === buyer.id ? { ...b, activo: !b.activo } : b))
      );
      // Update modal if open
      if (selectedBuyer?.id === buyer.id) {
        setSelectedBuyer((prev) => ({ ...prev, activo: !prev.activo }));
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al cambiar estado', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete buyer
  const handleDeleteBuyer = async () => {
    const buyer = confirmDialog.buyer;
    if (!buyer) return;
    setActionLoading(true);
    try {
      await adminService.deleteUser(buyer.id);
      enqueueSnackbar('Comprador eliminado correctamente', { variant: 'success' });
      setBuyers((prev) => prev.filter((b) => b.id !== buyer.id));
      setSelectedBuyer(null);
      setConfirmDialog({ open: false, buyer: null });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al eliminar comprador', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Computed stats
  const activeCount = useMemo(() => buyers.filter((b) => b.activo).length, [buyers]);
  const inactiveCount = useMemo(() => buyers.filter((b) => !b.activo).length, [buyers]);

  // Filter chips
  const filterOptions = [
    { key: 'all', label: 'Todos', count: buyers.length },
    { key: 'active', label: 'Activos', count: activeCount },
    { key: 'inactive', label: 'Inactivos', count: inactiveCount },
  ];

  // Stats header
  const stats = [
    { key: 'total', label: 'Total', value: buyers.length, color: 'primary' },
    { key: 'active', label: 'Activos', value: activeCount, color: 'success' },
    { key: 'inactive', label: 'Inactivos', value: inactiveCount, color: 'error' },
  ];

  // Filtered buyers
  const filteredBuyers = useMemo(() => {
    return buyers.filter((u) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchSearch =
          (u.nombre || '').toLowerCase().includes(query) ||
          (u.correo || '').toLowerCase().includes(query) ||
          (u.telefono || '').includes(query);
        if (!matchSearch) return false;
      }
      // Status filter
      if (filter === 'active' && !u.activo) return false;
      if (filter === 'inactive' && u.activo) return false;
      return true;
    });
  }, [buyers, searchQuery, filter]);

  // Table columns
  const columns = [
    {
      id: 'nombre',
      label: 'Nombre',
      minWidth: 180,
      render: (value) => (
        <span className="font-medium text-gray-900">{value || '-'}</span>
      ),
    },
    {
      id: 'correo',
      label: 'Email',
      minWidth: 200,
      hideOnMobile: true,
    },
    {
      id: 'telefono',
      label: 'Telefono',
      minWidth: 120,
      hideOnMobile: true,
      render: (value) => value || '-',
    },
    {
      id: 'tbl_ciudades',
      label: 'Ciudad',
      minWidth: 130,
      hideOnMobile: true,
      render: (value) => value?.nombre || '-',
    },
    {
      id: 'activo',
      label: 'Estado',
      minWidth: 100,
      align: 'center',
      render: (value) => (
        <StatusBadge status={value ? 'active' : 'inactive'} />
      ),
    },
    {
      id: 'fecha_hora_registro',
      label: 'Registro',
      minWidth: 140,
      hideOnMobile: true,
      render: (value) => formatDateTime(value),
    },
  ];

  // Row actions
  const getRowActions = (row) => (
    <>
      <Switch
        checked={row.activo}
        onChange={() => handleToggleActive(row)}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmDialog({ open: true, buyer: row });
        }}
        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  // Mobile card render
  const renderMobileCard = (buyer) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-900">{buyer.nombre}</p>
          <p className="text-sm text-gray-500">{buyer.correo}</p>
        </div>
        <StatusBadge status={buyer.activo ? 'active' : 'inactive'} />
      </div>
      <div className="flex gap-4 mt-2 text-sm text-gray-500">
        {buyer.telefono && <span>{buyer.telefono}</span>}
        {buyer.tbl_ciudades?.nombre && <span>{buyer.tbl_ciudades.nombre}</span>}
      </div>
      <div className="flex justify-end mt-3 gap-2">
        <Switch
          checked={buyer.activo}
          onChange={() => handleToggleActive(buyer)}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDialog({ open: true, buyer });
          }}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Gestion de Compradores
        </h1>
        <button
          onClick={loadBuyers}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Search */}
      <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-3 sm:p-4 mb-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por nombre, email o telefono..."
        />
      </div>

      {/* Filter Chips */}
      <FilterChips
        filters={filterOptions}
        activeFilter={filter}
        onChange={setFilter}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={filteredBuyers}
        loading={loading}
        onRowClick={(buyer) => setSelectedBuyer(buyer)}
        getRowActions={getRowActions}
        renderMobileCard={renderMobileCard}
        emptyMessage="No se encontraron compradores"
        rowKey="id"
      />

      {/* Detail Modal */}
      <DetailModal
        open={selectedBuyer !== null}
        onClose={() => setSelectedBuyer(null)}
        title="Detalle del Comprador"
        subtitle={selectedBuyer?.correo}
        headerIcon={<User className="text-primary" />}
        maxWidth="sm"
        actions={
          <>
            <Button
              variant={selectedBuyer?.activo ? 'danger' : 'success'}
              onClick={() => handleToggleActive(selectedBuyer)}
              disabled={actionLoading}
            >
              {selectedBuyer?.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              variant="outline"
              startIcon={<Trash2 size={18} />}
              onClick={() => setConfirmDialog({ open: true, buyer: selectedBuyer })}
              disabled={actionLoading}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              Eliminar
            </Button>
            <Button variant="primary" onClick={() => setSelectedBuyer(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {selectedBuyer && (
          <>
            <DetailSection title="Informacion Personal">
              <DetailRow
                icon={<User size={16} />}
                label="Nombre"
                value={selectedBuyer.nombre}
              />
              <DetailRow
                icon={<Mail size={16} />}
                label="Email"
                value={selectedBuyer.correo}
              />
              <DetailRow
                icon={<Phone size={16} />}
                label="Telefono"
                value={selectedBuyer.telefono || 'No registrado'}
              />
            </DetailSection>

            <DetailSection title="Ubicacion">
              <DetailRow
                icon={<MapPin size={16} />}
                label="Ciudad"
                value={selectedBuyer.tbl_ciudades?.nombre || '-'}
              />
            </DetailSection>

            <DetailSection title="Estado">
              <DetailRow
                icon={<Calendar size={16} />}
                label="Fecha de registro"
                value={formatDateTime(selectedBuyer.fecha_hora_registro)}
              />
              <div className="flex items-center py-2">
                <span className="text-sm text-gray-500 font-medium min-w-[140px]">
                  Estado:
                </span>
                <StatusBadge status={selectedBuyer.activo ? 'active' : 'inactive'} />
              </div>
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, buyer: null })}
        onConfirm={handleDeleteBuyer}
        title="Eliminar Comprador"
        message={`Estas seguro de eliminar a "${confirmDialog.buyer?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        type="error"
        loading={actionLoading}
      />
    </div>
  );
};

export default BuyersPage;
