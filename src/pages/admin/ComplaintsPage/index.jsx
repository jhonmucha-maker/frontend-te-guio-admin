import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  RefreshCw,
  User,
  Mail,
  Phone,
  Store,
  Calendar,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Loader2,
  Shield,
  ArrowRight,
  Search,
  X,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { apiService } from '../../../services/api';
import { subscribeToEvent, unsubscribeFromEvent } from '../../../services/socketService';
import { SSE_EVENTS } from '../../../utils/constants';
import {
  StatsHeader,
  FilterChips,
} from '../../../components';
import DetailModal, { DetailRow, DetailSection } from '../../../components/modals/DetailModal';
import { Button, Card, Dialog, Spinner } from '../../../components/ui';

export default function ComplaintsPage() {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Conversation messages state
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load all tickets
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllTickets();
      const allTickets = Array.isArray(data) ? data : [];

      // Map to a consistent shape
      const mapped = allTickets.map(t => ({
        id: t.id,
        subject: t.asunto || 'Sin asunto',
        description: t.descripcion || '',
        status: mapStatus(t.estado),
        rawStatus: t.estado,
        type: t.tipo === 'COMPLAINT' ? 'complaint' : 'suggestion',
        rawType: t.tipo,
        userName: t.usuario?.nombre || 'Desconocido',
        userEmail: t.usuario?.correo || '',
        userPhone: t.usuario?.telefono || '',
        userRole: t.usuario?.rol || '',
        userType: t.usuario?.rol === 'COMPRADOR' ? 'buyer' : 'seller',
        createdAt: t.creado_en,
        totalMessages: t.total_mensajes || 0,
        target: t.objetivo === 'STORE' ? 'seller' : 'admin',
        storeName: t.tienda?.nombre || '',
      }));

      setTickets(mapped);
    } catch (error) {
      enqueueSnackbar('Error al cargar quejas y sugerencias', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Map backend status to internal status
  function mapStatus(estado) {
    switch (estado) {
      case 'PENDIENTE': return 'pending';
      case 'RESPONDIDO': return 'responded';
      case 'EN_ESPERA_DE_RESPUESTA': return 'awaiting_buyer';
      case 'ATENDIDO': return 'attended';
      default: return 'pending';
    }
  }

  // Load on mount + SSE
  useEffect(() => {
    loadTickets();

    const handleNewTicket = () => {
      enqueueSnackbar('Nueva queja o sugerencia recibida', { variant: 'info', autoHideDuration: 5000 });
      loadTickets();
    };

    const handleTicketUpdate = () => loadTickets();

    subscribeToEvent(SSE_EVENTS.TICKET_CREATED, handleNewTicket);
    subscribeToEvent(SSE_EVENTS.TICKET_MESSAGE_CREATED, handleTicketUpdate);
    subscribeToEvent(SSE_EVENTS.TICKET_STATUS_UPDATED, handleTicketUpdate);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTickets();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeFromEvent(SSE_EVENTS.TICKET_CREATED, handleNewTicket);
      unsubscribeFromEvent(SSE_EVENTS.TICKET_MESSAGE_CREATED, handleTicketUpdate);
      unsubscribeFromEvent(SSE_EVENTS.TICKET_STATUS_UPDATED, handleTicketUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTickets, enqueueSnackbar]);

  // Load messages when a ticket is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedTicket?.id) {
        setLoadingMessages(true);
        try {
          // GET /tickets/:id devuelve { data: { ...ticket, mensajes: [...] } }
          const response = await apiService.get(`/tickets/${selectedTicket.id}`);
          const ticket = response.data || response;
          const rawMessages = ticket.mensajes || ticket.messages || [];
          // Mapear campos del backend para el render
          const mapped = rawMessages.map(msg => {
            const autor = msg.tbl_usuarios || {};
            const rol = autor.tbl_roles?.nombre || '';
            return {
              ...msg,
              tipo_remitente: rol,
              remitente: { nombre: autor.nombre || '' },
              cuerpo: msg.cuerpo || '',
              creado_en: msg.fecha_hora_registro || '',
            };
          });
          setConversationMessages(mapped);
        } catch (error) {
          console.log('[ComplaintsPage] Error loading messages:', error);
          setConversationMessages([]);
        } finally {
          setLoadingMessages(false);
        }
      } else {
        setConversationMessages([]);
      }
    };
    loadMessages();
  }, [selectedTicket?.id]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const responded = tickets.filter(t => t.status === 'responded' || t.status === 'awaiting_buyer').length;
    const attended = tickets.filter(t => t.status === 'attended').length;
    return [
      { key: 'total', label: 'Total', value: total, color: 'primary' },
      { key: 'pending', label: 'Pendientes', value: pending, color: 'warning' },
      { key: 'responded', label: 'Respondidos', value: responded, color: 'info' },
      { key: 'attended', label: 'Atendidos', value: attended, color: 'success' },
    ];
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Status filter
      const pendingStates = ['pending', 'responded', 'awaiting_buyer'];
      const attendedStates = ['attended'];

      if (filterStatus === 'pending' && !pendingStates.includes(t.status)) return false;
      if (filterStatus === 'attended' && !attendedStates.includes(t.status)) return false;

      // Type filter
      if (filterType === 'complaint' && t.type !== 'complaint') return false;
      if (filterType === 'suggestion' && t.type !== 'suggestion') return false;
      if (filterType === 'buyers' && t.userType !== 'buyer') return false;
      if (filterType === 'sellers' && t.userType !== 'seller') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const subject = (t.subject || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        const userName = (t.userName || '').toLowerCase();
        const userEmail = (t.userEmail || '').toLowerCase();

        if (
          !subject.includes(query) &&
          !description.includes(query) &&
          !userName.includes(query) &&
          !userEmail.includes(query)
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tickets, filterStatus, filterType, searchQuery]);

  // Status filters
  const statusFilters = [
    { key: 'pending', label: 'Por atender', count: tickets.filter(t => ['pending', 'responded', 'awaiting_buyer'].includes(t.status)).length },
    { key: 'attended', label: 'Atendidos', count: tickets.filter(t => t.status === 'attended').length },
    { key: 'all', label: 'Todos', count: tickets.length },
  ];

  // Type filters
  const typeFilters = [
    { key: 'all', label: 'Todos los tipos' },
    { key: 'complaint', label: 'Quejas' },
    { key: 'suggestion', label: 'Sugerencias' },
    { key: 'buyers', label: 'De Clientes' },
    { key: 'sellers', label: 'De Vendedores' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'responded': return 'bg-blue-100 text-blue-700';
      case 'awaiting_buyer': return 'bg-purple-100 text-purple-700';
      case 'attended': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'responded': return 'Respondido';
      case 'awaiting_buyer': return 'En espera';
      case 'attended': return 'Atendido';
      default: return status;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'complaint'
      ? <AlertCircle className="w-5 h-5 text-red-500" />
      : <Lightbulb className="w-5 h-5 text-amber-500" />;
  };

  const getTypeLabel = (type) => {
    return type === 'complaint' ? 'Queja' : 'Sugerencia';
  };

  const getUserTypeLabel = (userType) => {
    return userType === 'buyer' ? 'Cliente' : 'Vendedor';
  };

  const getUserTypeColor = (userType) => {
    return userType === 'buyer'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  };

  const getTargetLabel = (target, storeName) => {
    if (target === 'seller' && storeName) {
      return `Tienda: ${storeName}`;
    }
    return target === 'seller' ? 'Tienda' : 'Administrador';
  };

  const getTargetColor = (target) => {
    return target === 'seller'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-primary/10 text-primary';
  };

  const getTargetIcon = (target) => {
    return target === 'seller'
      ? <Store className="w-3.5 h-3.5" />
      : <Shield className="w-3.5 h-3.5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Reply and close ticket
  const handleReplyAndClose = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setActionLoading(true);
    try {
      // Send message first
      await apiService.post(`/tickets/${selectedTicket.id}/messages`, { cuerpo: replyText.trim() });
      // Then close the ticket
      await apiService.patch(`/tickets/${selectedTicket.id}/close`, { nota_cierre: replyText.trim() });
      enqueueSnackbar('Respuesta enviada y caso cerrado', { variant: 'success' });
      setShowReplyModal(false);
      setReplyText('');
      setSelectedTicket(null);
      loadTickets();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al responder', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openReplyModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowReplyModal(true);
    setReplyText('');
  };

  const isPending = (status) => status !== 'attended';

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Quejas y Sugerencias
        </h1>
        <button
          onClick={loadTickets}
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
      <Card className="mb-4">
        <Card.Content className="py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por asunto, descripcion, usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Status filter */}
      <Card className="mb-4">
        <Card.Content className="py-3">
          <p className="text-sm text-gray-500 mb-2">Filtrar por estado</p>
          <FilterChips
            filters={statusFilters}
            activeFilter={filterStatus}
            onChange={setFilterStatus}
          />
        </Card.Content>
      </Card>

      {/* Type filter */}
      <Card className="mb-6">
        <Card.Content className="py-3">
          <p className="text-sm text-gray-500 mb-2">Filtrar por tipo</p>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5
                  transition-all duration-200 hover:scale-[1.02]
                  ${filterType === f.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }
                `}
              >
                {f.key === 'buyers' && <User className="w-4 h-4" />}
                {f.key === 'sellers' && <Store className="w-4 h-4" />}
                {f.key === 'complaint' && <AlertCircle className="w-4 h-4" />}
                {f.key === 'suggestion' && <Lightbulb className="w-4 h-4" />}
                {f.label}
              </button>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Tickets List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
              No hay quejas o sugerencias
            </div>
          ) : (
            filteredTickets.map((item) => {
              const hasResponses = item.totalMessages > 1;
              const isAttended = item.status === 'attended';

              return (
                <Card
                  key={item.id}
                  hover
                  onClick={() => setSelectedTicket(item)}
                  className="cursor-pointer"
                >
                  <Card.Content>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        {getTypeIcon(item.type)}
                        <span className="font-semibold text-gray-800">
                          {getTypeLabel(item.type)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getUserTypeColor(item.userType)}`}>
                          {getUserTypeLabel(item.userType)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Target */}
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full mb-3 ${getTargetColor(item.target)}`}>
                      {getTargetIcon(item.target)}
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-medium">{getTargetLabel(item.target, item.storeName)}</span>
                    </div>

                    {/* Subject */}
                    <h3 className="font-medium text-gray-800 truncate mb-1">
                      {item.subject}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {item.description || 'Sin descripcion'}
                    </p>

                    <hr className="border-gray-100 mb-3" />

                    {/* User info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        {item.userName}
                      </div>

                      {item.userEmail && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          {item.userEmail}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>

                    {/* Response indicators */}
                    {(hasResponses || isAttended) && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {hasResponses && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            <MessageCircle className="w-3 h-3" /> {item.totalMessages} mensajes
                          </span>
                        )}
                        {isAttended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Atendido
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick action */}
                    {isPending(item.status) && (
                      <Button
                        size="sm"
                        fullWidth
                        className="mt-4"
                        startIcon={<CheckCircle className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openReplyModal(item);
                        }}
                      >
                        Responder y Cerrar
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        open={selectedTicket !== null && !showReplyModal}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? getTypeLabel(selectedTicket.type) : ''}
        subtitle={selectedTicket?.subject}
        headerIcon={selectedTicket ? getTypeIcon(selectedTicket.type) : <MessageSquare className="w-5 h-5" />}
        maxWidth="md"
        actions={
          <>
            {selectedTicket && isPending(selectedTicket.status) && (
              <Button
                startIcon={<CheckCircle className="w-4 h-4" />}
                onClick={() => openReplyModal(selectedTicket)}
              >
                Responder y Cerrar
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {selectedTicket && (
          <>
            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTicket.status)}`}>
                {getStatusLabel(selectedTicket.status)}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full border ${getUserTypeColor(selectedTicket.userType)}`}>
                {getUserTypeLabel(selectedTicket.userType)}
              </span>
            </div>

            {/* Target */}
            <div className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg mb-4 ${getTargetColor(selectedTicket.target)}`}>
              {getTargetIcon(selectedTicket.target)}
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">
                Dirigida a: {getTargetLabel(selectedTicket.target, selectedTicket.storeName)}
              </span>
            </div>

            <DetailSection title="Asunto">
              <p className="font-medium text-gray-800">
                {selectedTicket.subject}
              </p>
            </DetailSection>

            <DetailSection title="Descripcion">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedTicket.description || 'Sin descripcion'}
              </p>
            </DetailSection>

            <DetailSection title="Informacion del Usuario">
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Nombre"
                value={selectedTicket.userName}
              />
              <DetailRow
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={selectedTicket.userEmail || 'No registrado'}
              />
              <DetailRow
                icon={<Phone className="w-4 h-4" />}
                label="Telefono"
                value={selectedTicket.userPhone || 'No registrado'}
              />
              {selectedTicket.storeName && (
                <DetailRow
                  icon={<Store className="w-4 h-4" />}
                  label="Tienda Relacionada"
                  value={selectedTicket.storeName}
                />
              )}
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Fecha"
                value={formatDate(selectedTicket.createdAt)}
              />
            </DetailSection>

            {/* Conversation History */}
            <DetailSection title="Historial de Conversacion">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                  <span className="text-sm text-gray-500">Cargando mensajes...</span>
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay mensajes en esta conversacion</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversationMessages.map((msg, idx) => {
                    const senderType = msg.tipo_remitente || msg.senderType || msg.sender_type || '';
                    const isBuyer = senderType === 'COMPRADOR' || senderType === 'buyer';
                    const isSeller = senderType === 'VENDEDOR' || senderType === 'seller';
                    const isAdmin = senderType === 'ADMINISTRADOR' || senderType === 'admin';

                    let bgColor = 'bg-gray-50';
                    let borderColor = 'border-gray-300';
                    let labelText = 'Usuario';
                    let labelColorClass = 'text-gray-600';
                    let IconComponent = User;

                    if (isBuyer) {
                      bgColor = 'bg-blue-50';
                      borderColor = 'border-blue-400';
                      labelText = 'Comprador';
                      labelColorClass = 'text-blue-600';
                      IconComponent = User;
                    } else if (isSeller) {
                      bgColor = 'bg-purple-50';
                      borderColor = 'border-purple-400';
                      labelText = 'Vendedor';
                      labelColorClass = 'text-purple-600';
                      IconComponent = Store;
                    } else if (isAdmin) {
                      bgColor = 'bg-primary/5';
                      borderColor = 'border-primary';
                      labelText = 'Administrador';
                      labelColorClass = 'text-primary';
                      IconComponent = Shield;
                    }

                    const messageBody = msg.cuerpo || msg.message || msg.body || '';
                    const senderName = msg.remitente?.nombre || msg.senderName || msg.sender_name || '';
                    const messageDate = msg.creado_en || msg.createdAt || msg.created_at || '';

                    return (
                      <div
                        key={msg.id || idx}
                        className={`p-3 rounded-lg border-l-4 ${bgColor} ${borderColor}`}
                      >
                        <div className={`flex items-center gap-2 mb-1.5 ${labelColorClass}`}>
                          <IconComponent className="w-4 h-4" />
                          <span className="font-semibold text-sm">{labelText}</span>
                          {senderName && (
                            <span className="text-xs opacity-70">({senderName})</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {messageBody}
                        </p>
                        {messageDate && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            {formatDate(messageDate)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* Reply Modal */}
      <Dialog
        open={showReplyModal}
        onClose={() => {
          setShowReplyModal(false);
          setReplyText('');
        }}
        maxWidth="sm"
      >
        <Dialog.Header onClose={() => {
          setShowReplyModal(false);
          setReplyText('');
        }}>
          Responder y Cerrar Caso
        </Dialog.Header>
        <Dialog.Content>
          <p className="text-sm text-gray-500 mb-3">
            Escribe una respuesta para atender esta {selectedTicket?.type === 'complaint' ? 'queja' : 'sugerencia'}.
            Al enviar, el caso se cerrara automaticamente.
          </p>
          <textarea
            autoFocus
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe tu respuesta aqui..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </Dialog.Content>
        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={() => {
              setShowReplyModal(false);
              setReplyText('');
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReplyAndClose}
            disabled={!replyText.trim() || actionLoading}
            startIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            Enviar y Cerrar
          </Button>
        </Dialog.Footer>
      </Dialog>
    </div>
  );
}
