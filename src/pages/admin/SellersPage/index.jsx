import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Building2,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Store,
  FileText,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/helpers';
import { Button, Switch, Spinner, Select } from '../../../components/ui';
import {
  StatsHeader,
  DataTable,
  SearchInput,
  FilterChips,
  StatusBadge,
  ConfirmDialog,
} from '../../../components';
import DetailModal, { DetailRow, DetailSection } from '../../../components/modals/DetailModal';

const SellersPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Data state
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, seller: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [filterCity, setFilterCity] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterGallery, setFilterGallery] = useState('');

  // Load sellers
  const loadSellers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getSellers();
      // Backend returns { vendedores, total, activos, inactivos, premium }
      setSellers(data?.vendedores || []);
    } catch {
      enqueueSnackbar('Error al cargar vendedores', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const [citiesData, zonesData, galleriesData] = await Promise.all([
        adminService.getCities(),
        adminService.getZones(),
        adminService.getGalleries(),
      ]);
      setCities(citiesData || []);
      setZones(zonesData || []);
      setGalleries(galleriesData || []);
    } catch {
      // Silently fail - filters are optional
    }
  }, []);

  useEffect(() => {
    loadSellers();
    loadFilterOptions();

    const handler = () => loadSellers();
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_SELLER, handler);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_SELLER, handler);
    };
  }, [loadSellers, loadFilterOptions]);

  // Toggle active status
  const handleToggleActive = async (seller) => {
    setActionLoading(true);
    try {
      await adminService.toggleUserActive(seller.id);
      enqueueSnackbar(
        seller.activo ? 'Vendedor desactivado' : 'Vendedor activado',
        { variant: 'success' }
      );
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, activo: !s.activo } : s))
      );
      if (selectedSeller?.id === seller.id) {
        setSelectedSeller((prev) => ({ ...prev, activo: !prev.activo }));
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al cambiar estado', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete seller (cascade)
  const handleDeleteSeller = async () => {
    const seller = confirmDialog.seller;
    if (!seller) return;
    setActionLoading(true);
    try {
      await adminService.cascadeDeleteSeller(seller.id);
      enqueueSnackbar('Vendedor eliminado correctamente', { variant: 'success' });
      setSellers((prev) => prev.filter((s) => s.id !== seller.id));
      setSelectedSeller(null);
      setConfirmDialog({ open: false, seller: null });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al eliminar vendedor', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await adminService.exportSellersExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vendedores.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Excel descargado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al exportar', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // Computed stats — count stores, not sellers
  const allStores = useMemo(() => sellers.flatMap((s) => s.tiendas || []), [sellers]);
  const premiumStoreCount = useMemo(() => allStores.filter((t) => t.tipo_plan === 'PREMIUM').length, [allStores]);
  const standardStoreCount = useMemo(() => allStores.filter((t) => t.tipo_plan === 'ESTANDAR').length, [allStores]);
  const activeCount = useMemo(() => sellers.filter((s) => s.activo).length, [sellers]);
  const inactiveCount = useMemo(() => sellers.filter((s) => !s.activo).length, [sellers]);

  // Stats header
  const stats = [
    { key: 'total', label: 'Total', value: sellers.length, color: 'primary' },
    { key: 'active', label: 'Activos', value: activeCount, color: 'success' },
    { key: 'inactive', label: 'Inactivos', value: inactiveCount, color: 'error' },
    { key: 'premium', label: 'Premium', value: premiumStoreCount, color: 'premium', icon: <Star size={18} /> },
  ];

  // Filter chips — counters reflect store subscriptions
  const filterOptions = [
    { key: 'all', label: 'Todos', count: sellers.length },
    { key: 'premium', label: 'Premium', count: premiumStoreCount },
    { key: 'standard', label: 'Estandar', count: standardStoreCount },
  ];

  // Active advanced filter count
  const activeFiltersCount = [filterCity, filterZone, filterGallery].filter(Boolean).length;

  const clearAdvancedFilters = () => {
    setFilterCity('');
    setFilterZone('');
    setFilterGallery('');
  };

  // Filtered sellers
  const filteredSellers = useMemo(() => {
    return sellers.filter((u) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchSearch =
          (u.nombre || '').toLowerCase().includes(query) ||
          (u.correo || '').toLowerCase().includes(query) ||
          (u.tiendas || []).some((t) => (t.nombre || '').toLowerCase().includes(query));
        if (!matchSearch) return false;
      }

      // Type filter — based on store-level tipo_plan
      const tiendas = u.tiendas || [];
      if (filter === 'premium' && !tiendas.some((t) => t.tipo_plan === 'PREMIUM')) return false;
      if (filter === 'standard' && !tiendas.some((t) => t.tipo_plan === 'ESTANDAR')) return false;

      // Advanced filters (match against stores)
      if (filterCity && !tiendas.some((t) => t.ciudad === filterCity)) return false;
      if (filterZone && !tiendas.some((t) => t.zona === filterZone)) return false;
      if (filterGallery && !tiendas.some((t) => t.galeria === filterGallery)) return false;

      return true;
    });
  }, [sellers, searchQuery, filter, filterCity, filterZone, filterGallery]);

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
      id: 'tiendas',
      label: 'Tiendas',
      minWidth: 150,
      hideOnMobile: true,
      render: (value) => {
        if (!value || value.length === 0) return <span className="text-gray-400 italic">Sin tiendas</span>;
        return (
          <div className="flex flex-col gap-1">
            {value.slice(0, 2).map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-700">{t.nombre}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${t.tipo_plan === 'PREMIUM' ? 'bg-amber-50 text-amber-700' : t.tipo_plan ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {t.tipo_plan === 'PREMIUM' ? 'Premium' : t.tipo_plan ? 'Estandar' : 'Sin suscripcion'}
                </span>
              </div>
            ))}
            {value.length > 2 && (
              <span className="text-xs text-gray-400">+{value.length - 2} mas</span>
            )}
          </div>
        );
      },
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
          setConfirmDialog({ open: true, seller: row });
        }}
        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  // Mobile card render
  const renderMobileCard = (seller) => (
    <div>
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-gray-900">{seller.nombre}</p>
        <StatusBadge status={seller.activo ? 'active' : 'inactive'} />
      </div>
      <p className="text-sm text-gray-500 mb-1">{seller.correo}</p>
      {seller.tiendas && seller.tiendas.length > 0 && (
        <div className="mt-2 space-y-1">
          {seller.tiendas.map((t, i) => (
            <div key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
              <Store size={12} />
              <span>{t.nombre}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${t.tipo_plan === 'PREMIUM' ? 'bg-amber-50 text-amber-700' : t.tipo_plan ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                {t.tipo_plan === 'PREMIUM' ? 'Premium' : t.tipo_plan ? 'Estandar' : 'Sin suscripcion'}
              </span>
              {t.galeria && <span className="text-gray-400">({t.galeria})</span>}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-3 gap-2">
        <Switch
          checked={seller.activo}
          onChange={() => handleToggleActive(seller)}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDialog({ open: true, seller });
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
          Gestion de Vendedores
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            startIcon={<Download size={16} />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exportando...' : 'Exportar'}
          </Button>
          <button
            onClick={loadSellers}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Search + Filter Toggle */}
      <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-3 sm:p-4 mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre, email o tienda..."
            />
          </div>
          <Button
            variant={showFilters || activeFiltersCount > 0 ? 'primary' : 'outline'}
            startIcon={<Filter size={18} />}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            {showFilters ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Todas las ciudades</option>
                {cities.filter((c) => c.activo !== false).map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Zona</label>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Todas las zonas</option>
                {zones.filter((z) => z.activo !== false).map((z) => (
                  <option key={z.id} value={z.nombre}>{z.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Galeria</label>
              <select
                value={filterGallery}
                onChange={(e) => setFilterGallery(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Todas las galerias</option>
                {galleries.filter((g) => g.activo !== false).map((g) => (
                  <option key={g.id} value={g.nombre}>{g.nombre}</option>
                ))}
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <div className="sm:col-span-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  startIcon={<X size={14} />}
                  onClick={clearAdvancedFilters}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}
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
        rows={filteredSellers}
        loading={loading}
        onRowClick={(seller) => setSelectedSeller(seller)}
        getRowActions={getRowActions}
        renderMobileCard={renderMobileCard}
        emptyMessage="No se encontraron vendedores"
        rowKey="id"
      />

      {/* Detail Modal */}
      <DetailModal
        open={selectedSeller !== null}
        onClose={() => setSelectedSeller(null)}
        title="Detalle del Vendedor"
        subtitle={selectedSeller?.correo}
        headerIcon={<User className="text-primary" />}
        maxWidth="md"
        actions={
          <>
            <Button
              variant={selectedSeller?.activo ? 'danger' : 'success'}
              onClick={() => handleToggleActive(selectedSeller)}
              disabled={actionLoading}
            >
              {selectedSeller?.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              variant="outline"
              startIcon={<Trash2 size={18} />}
              onClick={() => setConfirmDialog({ open: true, seller: selectedSeller })}
              disabled={actionLoading}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              Eliminar
            </Button>
            <Button variant="primary" onClick={() => setSelectedSeller(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {selectedSeller && (
          <>
            {/* Status badge */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={selectedSeller.activo ? 'active' : 'inactive'} size="medium" />
            </div>

            <DetailSection title="Informacion del Vendedor">
              <DetailRow
                icon={<User size={16} />}
                label="Nombre"
                value={selectedSeller.nombre}
              />
              <DetailRow
                icon={<Mail size={16} />}
                label="Email"
                value={selectedSeller.correo}
              />
              <DetailRow
                icon={<Phone size={16} />}
                label="Telefono"
                value={selectedSeller.telefono || 'No registrado'}
              />
            </DetailSection>

            {/* Stores */}
            {selectedSeller.tiendas && selectedSeller.tiendas.length > 0 && (
              <DetailSection title={`Tiendas Registradas (${selectedSeller.tiendas.length})`}>
                <div className="space-y-3">
                  {selectedSeller.tiendas.map((t, i) => (
                    <div key={i} className={`bg-gray-50 rounded-lg p-3 border-l-4 ${t.tipo_plan === 'PREMIUM' ? 'border-l-amber-400' : t.tipo_plan ? 'border-l-blue-400' : 'border-l-gray-300'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Store size={14} className={t.tipo_plan === 'PREMIUM' ? 'text-amber-500' : t.tipo_plan ? 'text-blue-500' : 'text-gray-400'} />
                        <p className="text-sm font-semibold text-gray-800">{t.nombre}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${t.tipo_plan === 'PREMIUM' ? 'bg-amber-50 text-amber-700' : t.tipo_plan ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          {t.tipo_plan === 'PREMIUM' ? 'Premium' : t.tipo_plan ? 'Estandar' : 'Sin suscripcion'}
                        </span>
                      </div>
                      <div className="space-y-0.5 ml-5">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Galeria:</span> {t.galeria || '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Ciudad:</span> {t.ciudad || '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Zona:</span> {t.zona || '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Billing data */}
            {selectedSeller.datos_facturacion && (
              <DetailSection title="Datos de Facturacion">
                <DetailRow
                  icon={<FileText size={16} />}
                  label="Tipo"
                  value={selectedSeller.datos_facturacion.tipo_documento || '-'}
                />
                {selectedSeller.datos_facturacion.ruc && (
                  <DetailRow label="RUC" value={selectedSeller.datos_facturacion.ruc} />
                )}
                {selectedSeller.datos_facturacion.dni && (
                  <DetailRow label="DNI" value={selectedSeller.datos_facturacion.dni} />
                )}
                {selectedSeller.datos_facturacion.razon_social && (
                  <DetailRow label="Razon Social" value={selectedSeller.datos_facturacion.razon_social} />
                )}
              </DetailSection>
            )}
          </>
        )}
      </DetailModal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, seller: null })}
        onConfirm={handleDeleteSeller}
        title="Eliminar Vendedor"
        message="Se eliminaran el vendedor, sus tiendas y productos asociados. Esta accion no se puede deshacer."
        confirmText="Eliminar"
        type="error"
        loading={actionLoading}
      />
    </div>
  );
};

export default SellersPage;
