import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  RefreshCw,
  Users,
  Store,
  Star,
  DollarSign,
  Trash2,
  TrendingUp,
  LayoutGrid,
  User,
  Loader2,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { formatCurrency } from '../../../utils/helpers';
import { ConfirmDialog } from '../../../components';
import { Button, Card, Spinner } from '../../../components/ui';

// Inline ProgressBar component
const ProgressBar = ({ value, max, color = 'primary' }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    secondary: 'bg-indigo-600',
    info: 'bg-blue-500',
    teal: 'bg-teal-500',
    error: 'bg-red-500',
  };
  return (
    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color] || colorClasses.primary} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const DAYS_OPTIONS = [7, 15, 30, 60, 90, 180];

export default function ReportsPage() {
  const { enqueueSnackbar } = useSnackbar();

  // Report state
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inactive users state
  const [inactiveDays, setInactiveDays] = useState('30');
  const [inactiveUserType, setInactiveUserType] = useState('all');
  const [inactiveData, setInactiveData] = useState({ total: 0, usuarios: [] });
  const [loadingInactive, setLoadingInactive] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load report
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports({ period });
      setReport(data);
    } catch (error) {
      enqueueSnackbar('Error al cargar reporte', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [period, enqueueSnackbar]);

  // Load inactive users
  const loadInactiveUsers = useCallback(async () => {
    const days = parseInt(inactiveDays, 10);
    if (isNaN(days) || days < 1 || days > 365) return;

    setLoadingInactive(true);
    try {
      const data = await adminService.getInactiveUsers({ days, type: inactiveUserType });
      setInactiveData(data || { total: 0, usuarios: [] });
    } catch (error) {
      enqueueSnackbar('Error al cargar usuarios inactivos', { variant: 'error' });
    } finally {
      setLoadingInactive(false);
    }
  }, [inactiveDays, inactiveUserType, enqueueSnackbar]);

  // Load report when period changes
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Load inactive users when filters change
  useEffect(() => {
    const days = parseInt(inactiveDays, 10);
    if (!isNaN(days) && days >= 1 && days <= 365) {
      loadInactiveUsers();
    }
  }, [inactiveDays, inactiveUserType, loadInactiveUsers]);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    await Promise.all([loadReport(), loadInactiveUsers()]);
  }, [loadReport, loadInactiveUsers]);

  // Delete user
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteUser(userToDelete.id);
      enqueueSnackbar('Usuario eliminado correctamente', { variant: 'success' });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadInactiveUsers();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al eliminar usuario', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Extract report data with safe defaults
  const totalBuyers = report?.total_compradores || 0;
  const totalSellers = report?.total_vendedores || 0;
  const premiumActive = report?.premium_activos || 0;
  const totalRevenue = report?.ingresos_totales || 0;

  const productsData = report?.productos || {};
  const productsApproved = productsData.aprobados || 0;
  const productsPending = productsData.pendientes || 0;
  const productsTotal = productsData.total || 0;
  const productsMax = Math.max(productsTotal, 1);

  const activityData = report?.actividad_periodo || {};
  const newUsers = activityData.nuevos_usuarios || 0;
  const newProducts = activityData.nuevos_productos || 0;
  const activeSessions = activityData.sesiones_activas || 0;
  const activityMax = Math.max(newUsers, newProducts, activeSessions, 1);

  const topSellers = report?.top_vendedores || [];

  const distribution = report?.distribucion_usuarios || {};
  const distBuyers = distribution.compradores || 0;
  const distSellers = distribution.vendedores || 0;
  const distMax = Math.max(distBuyers, distSellers, 1);

  const inactiveUsers = inactiveData?.usuarios || [];
  const inactiveTotal = inactiveData?.total || 0;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Reportes y Analisis
          </h1>
        </div>
        <Button
          variant="outline"
          startIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Actualizar
        </Button>
      </div>

      {/* Period Selector */}
      <Card className="mb-6">
        <Card.Content className="py-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'week', label: 'Ultima semana' },
              { key: 'month', label: 'Este mes' },
              { key: 'all', label: 'Todo el tiempo' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setPeriod(option.key)}
                className={`
                  flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${period === option.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card.Content>
      </Card>

      {loading && !report ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumen General</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500 text-white rounded-xl p-4 text-center">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p className="text-2xl sm:text-3xl font-bold">{totalBuyers}</p>
              <p className="text-sm opacity-80">Compradores</p>
            </div>
            <div className="bg-purple-600 text-white rounded-xl p-4 text-center">
              <Store className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p className="text-2xl sm:text-3xl font-bold">{totalSellers}</p>
              <p className="text-sm opacity-80">Vendedores</p>
            </div>
            <div className="bg-amber-500 text-white rounded-xl p-4 text-center">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p className="text-2xl sm:text-3xl font-bold">{premiumActive}</p>
              <p className="text-sm opacity-80">Premium Activos</p>
            </div>
            <div className="bg-green-500 text-white rounded-xl p-4 text-center">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p className="text-2xl sm:text-3xl font-bold truncate">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm opacity-80">Ingresos Totales</p>
            </div>
          </div>

          {/* Stats Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Products Stats */}
            <Card>
              <Card.Content>
                <div className="flex items-center gap-2 mb-4">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">Productos</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Aprobados</span>
                      <span className="text-sm font-semibold text-gray-800">{productsApproved}</span>
                    </div>
                    <ProgressBar value={productsApproved} max={productsMax} color="success" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Pendientes</span>
                      <span className="text-sm font-semibold text-gray-800">{productsPending}</span>
                    </div>
                    <ProgressBar value={productsPending} max={productsMax} color="warning" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="text-sm font-semibold text-gray-800">{productsTotal}</span>
                    </div>
                    <ProgressBar value={productsTotal} max={productsMax} color="primary" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Period Activity */}
            <Card>
              <Card.Content>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">Actividad del Periodo</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Nuevos usuarios</span>
                      <span className="text-sm font-semibold text-gray-800">{newUsers}</span>
                    </div>
                    <ProgressBar value={newUsers} max={activityMax} color="secondary" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Nuevos productos</span>
                      <span className="text-sm font-semibold text-gray-800">{newProducts}</span>
                    </div>
                    <ProgressBar value={newProducts} max={activityMax} color="warning" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Sesiones activas</span>
                      <span className="text-sm font-semibold text-gray-800">{activeSessions}</span>
                    </div>
                    <ProgressBar value={activeSessions} max={activityMax} color="teal" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Top Sellers */}
            <Card>
              <Card.Content>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">Top 5 Vendedores (por rating)</h3>
                </div>

                {topSellers.length > 0 ? (
                  <div className="space-y-2">
                    {topSellers.map((seller, index) => (
                      <div
                        key={seller.id || index}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
                          {index + 1}. {seller.nombre || seller.storeName || 'Vendedor'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 shrink-0">
                          <Star className="w-3 h-3" />
                          {(parseFloat(seller.rating) || 0).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm text-center">
                    No hay vendedores registrados
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* User Distribution */}
            <Card>
              <Card.Content>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">Distribucion de Usuarios</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Compradores</span>
                      <span className="text-sm font-semibold text-gray-800">{distBuyers}</span>
                    </div>
                    <ProgressBar value={distBuyers} max={distMax} color="info" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Vendedores</span>
                      <span className="text-sm font-semibold text-gray-800">{distSellers}</span>
                    </div>
                    <ProgressBar value={distSellers} max={distMax} color="secondary" />
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Inactive Users */}
          <Card>
            <Card.Content>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-800">Usuarios Inactivos</h3>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  Total: {inactiveTotal}
                </span>
              </div>

              {/* Days filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Usuarios sin actividad en los ultimos:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={inactiveDays}
                      onChange={(e) => setInactiveDays(e.target.value.replace(/[^0-9]/g, ''))}
                      min={1}
                      max={365}
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="text-sm text-gray-600">dias</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {DAYS_OPTIONS.map((days) => (
                      <button
                        key={days}
                        onClick={() => setInactiveDays(String(days))}
                        className={`
                          px-2 py-1 text-xs rounded-full transition-colors
                          ${inactiveDays === String(days)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }
                        `}
                      >
                        {days} dias
                      </button>
                    ))}
                  </div>
                </div>

                {/* User type filter */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tipo de usuario:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'Todos', icon: Users },
                      { key: 'compradores', label: 'Compradores', icon: User },
                      { key: 'vendedores', label: 'Vendedores', icon: Store },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setInactiveUserType(option.key)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors
                          ${inactiveUserType === option.key
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }
                        `}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 mb-4" />

              {/* Inactive Users List */}
              <div className="relative min-h-[200px]">
                {loadingInactive && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <Spinner />
                  </div>
                )}

                {inactiveUsers.length > 0 ? (
                  <div className="space-y-2">
                    {inactiveUsers.slice(0, 20).map((user) => {
                      const userName = user.nombre || user.name || 'Sin nombre';
                      const userEmail = user.correo || user.email || '';
                      const userRole = user.rol || user.role || '';
                      const lastLogin = user.ultimo_login || user.lastLogin;

                      // Determine display role
                      const isSellerRole = userRole === 'VENDEDOR' || userRole === 'seller' || userRole === 'Vendedor';
                      const roleLabel = isSellerRole ? 'Vendedor' : 'Comprador';

                      return (
                        <div key={user.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 truncate">{userName}</span>
                              <span className={`
                                px-2 py-0.5 text-[10px] font-medium rounded-full
                                ${isSellerRole
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                                }
                              `}>
                                {roleLabel}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                            <p className="text-xs text-red-500 mt-0.5">
                              {lastLogin
                                ? `Ultimo login: ${new Date(lastLogin).toLocaleDateString('es-PE')}`
                                : 'Nunca inicio sesion'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenDeleteDialog({
                              id: user.id,
                              name: userName,
                              role: isSellerRole ? 'seller' : 'buyer',
                            })}
                            className="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : !loadingInactive && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
                    <User className="w-5 h-5" />
                    <span>No hay usuarios inactivos en el periodo seleccionado</span>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message={
          <>
            Estas seguro de eliminar a <strong>{userToDelete?.name}</strong>?
            <br />
            <span className="text-red-600 text-sm">Esta accion no se puede deshacer.</span>
          </>
        }
        confirmText="Eliminar"
        type="error"
        loading={deleteLoading}
      />
    </div>
  );
}
