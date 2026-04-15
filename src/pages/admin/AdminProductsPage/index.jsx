import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  FolderTree,
  DollarSign,
  Store,
  User,
  MapPin,
  Building2,
  Hash,
  Mail,
  Map,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import { getImageUrl, formatCurrency } from '../../../utils/helpers';
import {
  StatsHeader,
  FilterChips,
  SearchInput,
  ImagePreview,
  ConfirmDialog,
} from '../../../components';
import DetailModal, { DetailRow, DetailSection } from '../../../components/modals/DetailModal';
import { Button, Switch, Spinner } from '../../../components/ui';

const AdminProductsPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToProcess, setProductToProcess] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load products - only approved ones
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingProducts();
      const allProducts = Array.isArray(data) ? data : [];
      const approved = allProducts.filter(p => p.estado_aprobacion === 'APROBADO');

      // Map to English field names
      const mapped = approved.map(p => ({
        id: p.id,
        name: p.nombre || '',
        description: p.descripcion || '',
        status: p.estado === 'ACTIVE' ? 'active' : 'inactive',
        categoryName: p.categoria || '-',
        price: parseFloat(p.precio) || 0,
        showPrice: p.mostrar_precio !== false,
        images: (p.fotos || []).map(f => f?.url ? getImageUrl(f.url) : null).filter(Boolean),
        storeName: p.tienda?.nombre || '-',
        sellerName: p.tienda?.vendedor_nombre || '-',
        sellerEmail: p.tienda?.vendedor_correo || '-',
        storeCity: p.tienda?.ciudad || '-',
        zoneName: p.tienda?.zona || '-',
        galleryName: p.tienda?.galeria || '-',
        storeNumber: p.tienda?.numero_local || '-',
        storeAddress: p.tienda?.direccion || '',
        // Keep raw data
        _raw: p,
      }));

      setProducts(mapped);
    } catch (error) {
      enqueueSnackbar('Error al cargar productos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Load on mount + SSE
  useEffect(() => {
    loadProducts();

    const handler = () => loadProducts();
    subscribeToEvent(SSE_EVENTS.ADMIN_PENDING_PRODUCT, handler);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.ADMIN_PENDING_PRODUCT, handler);
    };
  }, [loadProducts]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const inactive = products.filter(p => p.status === 'inactive').length;
    return [
      { key: 'total', label: 'Total', value: total, color: 'primary' },
      { key: 'active', label: 'Activos', value: active, color: 'success' },
      { key: 'inactive', label: 'Inactivos', value: inactive, color: 'error' },
    ];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.storeName?.toLowerCase().includes(query) ||
        p.sellerName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, filter, searchQuery]);

  // Quick filters
  const quickFilters = [
    { key: 'all', label: 'Todos', count: stats[0].value },
    { key: 'active', label: 'Activos', count: stats[1].value },
    { key: 'inactive', label: 'Inactivos', count: stats[2].value },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  // Toggle product active status
  const handleToggleProduct = async (product) => {
    setActionLoading(true);
    try {
      await adminService.approveProduct(product.id, { toggle_active: true });
      if (product.status === 'active') {
        enqueueSnackbar(`Producto "${product.name}" deshabilitado`, { variant: 'warning' });
      } else {
        enqueueSnackbar(`Producto "${product.name}" habilitado`, { variant: 'success' });
      }
      // Update selected product if open
      if (selectedProduct?.id === product.id) {
        setSelectedProduct(prev => ({
          ...prev,
          status: prev.status === 'active' ? 'inactive' : 'active',
        }));
      }
      loadProducts();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al actualizar producto', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (!productToProcess || !actionType) return;
    setActionLoading(true);
    try {
      await adminService.approveProduct(productToProcess.id, { toggle_active: true });
      if (actionType === 'disable') {
        enqueueSnackbar(`Producto "${productToProcess.name}" deshabilitado`, { variant: 'warning' });
      } else {
        enqueueSnackbar(`Producto "${productToProcess.name}" habilitado`, { variant: 'success' });
      }
      setShowConfirmModal(false);
      setSelectedProduct(null);
      setProductToProcess(null);
      setActionType(null);
      loadProducts();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al actualizar producto', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price, showPrice) => {
    if (!showPrice) return 'No mostrado';
    return formatCurrency(price);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Gestion de Productos
        </h1>
        <button
          onClick={loadProducts}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg sm:rounded-xl shadow-card border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar producto, tienda o vendedor..."
            />
          </div>
          <FilterChips
            filters={quickFilters}
            activeFilter={filter}
            onChange={setFilter}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
                No hay productos {filter !== 'all' ? getStatusLabel(filter).toLowerCase() + 's' : ''}
              </div>
            </div>
          ) : (
            filteredProducts.map((item) => (
              <div
                key={item.id}
                className={`
                  bg-surface rounded-lg sm:rounded-xl shadow-card border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
                  ${item.status !== 'active' ? 'opacity-70' : ''}
                `}
                onClick={() => setSelectedProduct(item)}
              >
                {item.images && item.images.length > 0 && (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className={`w-full h-36 object-cover ${item.status !== 'active' ? 'opacity-50' : ''}`}
                  />
                )}
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className={`flex-1 font-semibold truncate ${item.status === 'active' ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.name}
                    </h3>
                    <Switch
                      checked={item.status === 'active'}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleProduct(item);
                      }}
                    />
                  </div>

                  <p className="text-sm text-gray-500 truncate">
                    {item.storeName}
                  </p>

                  <div className="border-t border-gray-100 my-2" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User size={14} className="text-gray-400" />
                      <span className="truncate">{item.sellerName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FolderTree size={14} className="text-gray-400" />
                      <span className="truncate">{item.categoryName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <DollarSign size={14} className="text-gray-400" />
                      <span>{formatPrice(item.price, item.showPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        open={selectedProduct !== null && !showConfirmModal}
        onClose={() => setSelectedProduct(null)}
        title="Detalle del Producto"
        subtitle={selectedProduct?.name}
        headerIcon={<Package className="text-primary" />}
        maxWidth="md"
        actions={
          <>
            {selectedProduct?.status === 'active' ? (
              <Button
                variant="outline"
                startIcon={<XCircle size={18} />}
                onClick={() => {
                  setProductToProcess(selectedProduct);
                  setActionType('disable');
                  setShowConfirmModal(true);
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Deshabilitar
              </Button>
            ) : (
              <Button
                variant="success"
                startIcon={<CheckCircle size={18} />}
                onClick={() => {
                  setProductToProcess(selectedProduct);
                  setActionType('enable');
                  setShowConfirmModal(true);
                }}
              >
                Habilitar
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {selectedProduct && (
          <>
            {/* Status */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`
                inline-flex px-3 py-1 text-sm font-medium rounded-full
                ${getStatusColor(selectedProduct.status) === 'success' ? 'bg-green-100 text-green-700' : ''}
                ${getStatusColor(selectedProduct.status) === 'error' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {getStatusLabel(selectedProduct.status)}
              </span>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <Switch
                  checked={selectedProduct.status === 'active'}
                  onChange={() => handleToggleProduct(selectedProduct)}
                />
                {selectedProduct.status === 'active' ? 'Producto Activo' : 'Producto Inactivo'}
              </label>
            </div>

            {/* Image Gallery */}
            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <div className="mb-4">
                {selectedProduct.images.length === 1 ? (
                  <ImagePreview
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    width="100%"
                    height={250}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Galeria ({selectedProduct.images.length} imagenes)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedProduct.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={img}
                            alt={`${selectedProduct.name} - ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(img, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DetailSection title="Informacion del Producto">
              <DetailRow
                icon={<Package size={16} />}
                label="Nombre"
                value={selectedProduct.name}
              />
              <DetailRow
                label="Descripcion"
                value={selectedProduct.description || 'Sin descripcion'}
                fullWidth
              />
              <DetailRow
                icon={<FolderTree size={16} />}
                label="Categoria"
                value={selectedProduct.categoryName}
              />
              <DetailRow
                icon={<DollarSign size={16} />}
                label="Precio"
                value={formatPrice(selectedProduct.price, selectedProduct.showPrice)}
              />
            </DetailSection>

            <DetailSection title="Propietario">
              <DetailRow
                icon={<User size={16} />}
                label="Vendedor"
                value={selectedProduct.sellerName}
              />
              <DetailRow
                icon={<Mail size={16} />}
                label="Email"
                value={selectedProduct.sellerEmail || 'No disponible'}
              />
            </DetailSection>

            <DetailSection title="Ubicacion de la Tienda">
              <DetailRow
                icon={<MapPin size={16} />}
                label="Ciudad"
                value={selectedProduct.storeCity}
              />
              <DetailRow
                icon={<Map size={16} />}
                label="Zona"
                value={selectedProduct.zoneName}
              />
              <DetailRow
                icon={<Building2 size={16} />}
                label="Galeria"
                value={selectedProduct.galleryName}
              />
              <DetailRow
                icon={<Hash size={16} />}
                label="Stand / Local"
                value={selectedProduct.storeNumber}
              />
              <DetailRow
                icon={<Store size={16} />}
                label="Tienda"
                value={selectedProduct.storeName}
              />
              {selectedProduct.storeAddress && (
                <DetailRow
                  icon={<MapPin size={16} />}
                  label="Direccion"
                  value={selectedProduct.storeAddress}
                  fullWidth
                />
              )}
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setProductToProcess(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        title={actionType === 'disable' ? 'Deshabilitar Producto?' : 'Habilitar Producto?'}
        message={
          actionType === 'disable'
            ? `Estas seguro de deshabilitar "${productToProcess?.name}"? El producto no sera visible para los compradores.`
            : `Estas seguro de habilitar "${productToProcess?.name}"? El producto sera visible para los compradores.`
        }
        confirmText={actionType === 'disable' ? 'Deshabilitar' : 'Habilitar'}
        type={actionType === 'disable' ? 'error' : 'success'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminProductsPage;
