import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Calendar,
  RefreshCw,
  Building2,
  CreditCard,
  Star,
  Clock,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { Card, Spinner } from '../../../components/ui';
import { FilterChips, StatusBadge } from '../../../components';

const FinancesPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [summary, setSummary] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, txData] = await Promise.all([
        adminService.getFinanceSummary().catch(() => null),
        adminService.getTransactions(),
      ]);
      if (sumData) setSummary(sumData);
      const items = Array.isArray(txData) ? txData : (txData?.transacciones || []);
      setAllTransactions(items);
    } catch {
      enqueueSnackbar('Error al cargar transacciones', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Initial load + SSE
  useEffect(() => {
    loadData();

    const handler = () => loadData();
    subscribeToEvent(SSE_EVENTS.SUBSCRIPTION_REQUEST_UPDATED, handler);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.SUBSCRIPTION_REQUEST_UPDATED, handler);
    };
  }, [loadData]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Refresh
  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering (matches reference frontend)
  const activeTransactions = allTransactions.filter((t) => t.estado === 'ACTIVE');
  const expiredTransactions = allTransactions.filter((t) => t.estado !== 'ACTIVE');

  const filtered = (() => {
    if (filter === 'active') return activeTransactions;
    if (filter === 'expired') return expiredTransactions;
    return allTransactions;
  })();

  // Filter chips
  const quickFilters = [
    { key: 'all', label: 'Todas', count: allTransactions.length },
    { key: 'active', label: 'Activas', count: activeTransactions.length },
    { key: 'expired', label: 'Expiradas', count: expiredTransactions.length },
  ];

  // Format amount with safe parsing for Prisma Decimal strings
  const formatAmount = (amount) => {
    return formatCurrency(parseFloat(amount || 0));
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Flujo de Caja
        </h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Financial Summary */}
      {summary && (
        <div className="rounded-xl p-6 mb-6 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white">
          <h2 className="text-lg font-semibold mb-4">Resumen Financiero</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold">
                {formatAmount(summary.totalRevenue)}
              </p>
              <p className="text-sm opacity-80">Ingresos Totales</p>
            </div>

            {/* Monthly Revenue */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold">
                {formatAmount(summary.monthlyRevenue)}
              </p>
              <p className="text-sm opacity-80">Este Mes</p>
            </div>

            {/* Active Subscriptions Revenue */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/30 flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold">
                {formatAmount(summary.activeSubscriptionsRevenue)}
              </p>
              <p className="text-sm opacity-80">
                Suscripciones Activas ({summary.activeSubscriptionsCount || 0})
              </p>
            </div>
          </div>

          {/* Premium Price */}
          <hr className="my-4 border-white/20" />
          <div className="flex items-center justify-center text-sm">
            <span className="opacity-80">Precio Premium:</span>
            <span className="ml-2 font-semibold">
              {formatAmount(summary.premiumPrice)} / {summary.premiumDays || 30} dias
            </span>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <Card className="mb-6">
        <Card.Content className="py-3">
          <FilterChips
            filters={quickFilters}
            activeFilter={filter}
            onChange={handleFilterChange}
          />
        </Card.Content>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Transactions Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-6 text-center text-blue-700">
                No hay transacciones registradas
              </div>
            ) : (
              filtered.map((tx) => (
                <Card key={tx.id} hover>
                  <Card.Content>
                    {/* Seller + Amount */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {tx.vendedor_nombre || '-'}
                        </h3>
                      </div>
                      <p className="text-lg font-bold text-primary ml-2">
                        {formatAmount(tx.monto)}
                      </p>
                    </div>

                    <hr className="border-gray-100 mb-3" />

                    {/* Detail fields */}
                    <div className="space-y-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{tx.galeria_nombre || 'Sin galeria'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Pago: {formatDate(tx.pagado_en)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>Vence: {formatDate(tx.fin_en)}</span>
                      </div>

                      {tx.metodo_pago && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <span>{tx.metodo_pago}</span>
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="mt-3">
                      <StatusBadge
                        status={tx.estado === 'ACTIVE' ? 'active' : 'inactive'}
                        label={tx.estado === 'ACTIVE' ? 'Activo' : 'Expirado'}
                      />
                    </div>
                  </Card.Content>
                </Card>
              ))
            )}
          </div>

        </>
      )}
    </div>
  );
};

export default FinancesPage;
