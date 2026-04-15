import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Store,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Building2,
  Package,
  Star,
  DoorOpen,
  Map,
  MapPin,
  MessageCircle,
  Facebook,
  Instagram,
  Music,
  Globe,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import { getImageUrl } from '../../../utils/helpers';
import {
  StatsHeader,
  FilterChips,
  ImagePreview,
  ConfirmDialog,
} from '../../../components';
import DetailModal, { DetailRow, DetailSection } from '../../../components/modals/DetailModal';
import { Button, Card, Spinner } from '../../../components/ui';

// Parse date safely to avoid timezone offset issues
const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T12:00:00');
  }
  return new Date(dateString);
};

const formatDateSafe = (dateString) => {
  const date = parseDateSafe(dateString);
  if (!date) return '-';
  return date.toLocaleDateString('es-PE');
};

const AdminStoresPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [storeToProcess, setStoreToProcess] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load stores - only approved ones
  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingStores();
      const allStores = Array.isArray(data) ? data : [];
      const approved = allStores.filter(s => s.estado_aprobacion === 'APROBADO');

      // Map to English field names for UI consistency
      const mapped = approved.map(s => ({
        id: s.id,
        name: s.nombre || '',
        description: s.descripcion || '',
        status: s.activo ? 'active' : 'inactive',
        isPremium: s.es_premium || false,
        premiumExpiry: s.fecha_fin_premium || null,
        sellerName: s.vendedor?.nombre || '-',
        galleryName: s.galeria?.nombre || '-',
        galleryCity: s.galeria?.ciudad || '-',
        galleryZone: s.galeria?.zona || '-',
        galleryAddress: s.galeria?.direccion || '-',
        galleryLatitude: s.galeria?.latitud || null,
        galleryLongitude: s.galeria?.longitud || null,
        galleryImages: s.galeria?.fotos || [],
        storeImages: s.fotos || [],
        stallNumber: s.numero_local || '',
        productsCount: s.productos_count || 0,
        logo: s.fotos?.[0]?.url ? getImageUrl(s.fotos[0].url) : null,
        whatsapp: s.whatsapp || null,
        socialMedia: s.redes_sociales || {},
        // Keep raw data for toggle
        _raw: s,
      }));

      setStores(mapped);
    } catch (error) {
      enqueueSnackbar('Error al cargar tiendas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Load on mount + SSE
  useEffect(() => {
    loadStores();

    const handler = () => loadStores();
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_STORE, handler);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_STORE, handler);
    };
  }, [loadStores]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = stores.length;
    const active = stores.filter(s => s.status === 'active').length;
    const inactive = stores.filter(s => s.status === 'inactive').length;
    const premium = stores.filter(s => s.isPremium).length;
    const standard = total - premium;
    return [
      { key: 'total', label: 'Total', value: total, color: 'primary' },
      { key: 'active', label: 'Activas', value: active, color: 'success' },
      { key: 'inactive', label: 'Inactivas', value: inactive, color: 'error' },
      { key: 'premium', label: 'Premium', value: premium, color: 'warning' },
      { key: 'standard', label: 'Standard', value: standard, color: 'secondary' },
    ];
  }, [stores]);

  // Filter stores
  const filteredStores = useMemo(() => {
    let filtered = stores;

    if (filter === 'active') {
      filtered = filtered.filter(s => s.status === 'active');
    } else if (filter === 'inactive') {
      filtered = filtered.filter(s => s.status === 'inactive');
    } else if (filter === 'premium') {
      filtered = filtered.filter(s => s.isPremium);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.sellerName?.toLowerCase().includes(query) ||
        s.galleryName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [stores, filter, searchQuery]);

  // Quick filters
  const quickFilters = [
    { key: 'all', label: 'Todas', count: stats[0].value },
    { key: 'active', label: 'Activas', count: stats[1].value },
    { key: 'inactive', label: 'Inactivas', count: stats[2].value },
    { key: 'premium', label: 'Premium', count: stats[3].value },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'inactive': return 'Inactiva';
      default: return status;
    }
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (!storeToProcess || !actionType) return;
    setActionLoading(true);
    try {
      await adminService.approveStore(storeToProcess.id, { toggle_active: true });
      if (actionType === 'disable') {
        enqueueSnackbar(`Tienda "${storeToProcess.name}" deshabilitada`, { variant: 'warning' });
      } else {
        enqueueSnackbar(`Tienda "${storeToProcess.name}" habilitada`, { variant: 'success' });
      }
      setShowConfirmModal(false);
      setSelectedStore(null);
      setStoreToProcess(null);
      setActionType(null);
      loadStores();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al actualizar tienda', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = (store, action) => {
    setStoreToProcess(store);
    setActionType(action);
    setShowConfirmModal(true);
  };

  // Open Google Maps
  const openMap = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  // Process gallery images
  const parseGalleryImages = (images) => {
    if (!images) return [];
    try {
      const parsed = typeof images === 'string' ? JSON.parse(images) : images;
      if (Array.isArray(parsed)) {
        return parsed.map(img => {
          if (typeof img === 'string') return getImageUrl(img);
          if (img?.url) return getImageUrl(img.url);
          return null;
        }).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Gestion de Tiendas
        </h1>
        <button
          onClick={loadStores}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Search and Filters */}
      <Card className="mb-6">
        <Card.Content className="py-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tienda, vendedor o galeria..."
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
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
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Stores Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.length === 0 ? (
            <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
              No hay tiendas {filter !== 'all' ? getStatusLabel(filter).toLowerCase() + 's' : ''}
            </div>
          ) : (
            filteredStores.map((item) => (
              <Card
                key={item.id}
                hover
                onClick={() => setSelectedStore(item)}
                className="cursor-pointer flex flex-col"
              >
                {item.logo && (
                  <div className="h-36 overflow-hidden rounded-t-card">
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Card.Content className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </h3>
                      {item.isPremium && (
                        <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-2">{item.sellerName}</p>

                  <hr className="border-gray-100 my-2" />

                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.galleryName || 'Sin galeria'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span>{item.productsCount || 0} productos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 flex-shrink-0" />
                      <span>{item.stallNumber || 'No especificado'}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-auto pt-4">
                    {item.status === 'active' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        fullWidth
                        startIcon={<XCircle className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item, 'disable');
                        }}
                      >
                        Deshabilitar
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        startIcon={<CheckCircle className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item, 'enable');
                        }}
                      >
                        Habilitar
                      </Button>
                    )}
                  </div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        open={selectedStore !== null && !showConfirmModal}
        onClose={() => setSelectedStore(null)}
        title="Detalle de Tienda"
        subtitle={selectedStore?.name}
        headerIcon={
          <div className="flex items-center gap-1">
            <Store className="w-5 h-5 text-primary" />
            {selectedStore?.isPremium && <Star className="w-4 h-4 text-amber-400" />}
          </div>
        }
        maxWidth="md"
        actions={
          <>
            {selectedStore?.status === 'active' ? (
              <Button
                variant="danger"
                startIcon={<XCircle className="w-4 h-4" />}
                onClick={() => handleAction(selectedStore, 'disable')}
              >
                Deshabilitar
              </Button>
            ) : (
              <Button
                variant="success"
                startIcon={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleAction(selectedStore, 'enable')}
              >
                Habilitar
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedStore(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {selectedStore && (
          <>
            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedStore.status)}`}>
                {getStatusLabel(selectedStore.status)}
              </span>
              {selectedStore.isPremium && (
                <span className="px-3 py-1 text-sm rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>

            {/* Logo */}
            {selectedStore.logo && (
              <div className="mb-4">
                <ImagePreview
                  src={selectedStore.logo}
                  alt={selectedStore.name}
                  width="100%"
                  height={200}
                />
              </div>
            )}

            <DetailSection title="Informacion de la Tienda">
              <DetailRow
                icon={<Store className="w-4 h-4" />}
                label="Nombre"
                value={selectedStore.name}
              />
              <DetailRow
                label="Descripcion"
                value={selectedStore.description || 'Sin descripcion'}
                fullWidth
              />
              <DetailRow
                icon={<DoorOpen className="w-4 h-4" />}
                label="Puesto"
                value={selectedStore.stallNumber || 'No especificado'}
              />
              <DetailRow
                icon={<Package className="w-4 h-4" />}
                label="Productos"
                value={`${selectedStore.productsCount || 0} productos`}
              />
              {selectedStore.isPremium && selectedStore.premiumExpiry && (
                <DetailRow
                  label="Premium Expira"
                  value={formatDateSafe(selectedStore.premiumExpiry)}
                />
              )}
            </DetailSection>

            <DetailSection title="Ubicacion">
              <DetailRow
                icon={<MapPin className="w-4 h-4" />}
                label="Ciudad"
                value={selectedStore.galleryCity}
              />
              <DetailRow
                icon={<Map className="w-4 h-4" />}
                label="Zona Comercial"
                value={selectedStore.galleryZone}
              />
              <DetailRow
                icon={<Building2 className="w-4 h-4" />}
                label="Galeria"
                value={selectedStore.galleryName}
              />
              {selectedStore.galleryAddress && selectedStore.galleryAddress !== '-' && (
                <DetailRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Dir. Galeria"
                  value={selectedStore.galleryAddress}
                  fullWidth
                />
              )}
            </DetailSection>

            <DetailSection title="Informacion del Vendedor">
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Vendedor"
                value={selectedStore.sellerName}
              />
            </DetailSection>

            {/* Gallery Photos and Location */}
            {(() => {
              const galleryImages = parseGalleryImages(selectedStore.galleryImages);
              const hasCoords = selectedStore.galleryLatitude && selectedStore.galleryLongitude;

              if (!galleryImages.length && !hasCoords) return null;

              return (
                <DetailSection title="Galeria - Fotos y Ubicacion">
                  {galleryImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Fotos de la galeria:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {galleryImages.map((imageUrl, index) => (
                          <div key={index} className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={imageUrl}
                              alt={`Galeria ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasCoords && (
                    <Button
                      variant="primary"
                      startIcon={<Map className="w-4 h-4" />}
                      onClick={() => openMap(selectedStore.galleryLatitude, selectedStore.galleryLongitude)}
                      className="w-full sm:w-auto"
                    >
                      Ver Galeria en Google Maps
                    </Button>
                  )}
                </DetailSection>
              );
            })()}
          </>
        )}
      </DetailModal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setStoreToProcess(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        title={actionType === 'disable' ? 'Deshabilitar Tienda?' : 'Habilitar Tienda?'}
        message={
          actionType === 'disable'
            ? `Estas seguro de deshabilitar "${storeToProcess?.name}"? La tienda y sus productos no seran visibles para los compradores.`
            : `Estas seguro de habilitar "${storeToProcess?.name}"? La tienda y sus productos seran visibles para los compradores.`
        }
        confirmText={actionType === 'disable' ? 'Deshabilitar' : 'Habilitar'}
        type={actionType === 'disable' ? 'error' : 'success'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminStoresPage;
