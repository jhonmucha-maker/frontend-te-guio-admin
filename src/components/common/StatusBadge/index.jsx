import {
  CheckCircle,
  XCircle,
  Clock,
  CheckCircle2,
  X,
  Star,
  AlertTriangle,
} from 'lucide-react';

/**
 * StatusBadge - Badge de estado reutilizable
 * @param {string} status - Estado (active, inactive, pending, approved, rejected, premium, expiring)
 * @param {string} label - Texto personalizado (opcional)
 * @param {string} size - Tamano (small, medium)
 */
const StatusBadge = ({ status, label, size = 'small' }) => {
  const statusConfig = {
    active: {
      label: 'Activo',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: CheckCircle,
    },
    inactive: {
      label: 'Inactivo',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      icon: XCircle,
    },
    pending: {
      label: 'Pendiente',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      icon: Clock,
    },
    approved: {
      label: 'Aprobado',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Rechazado',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: X,
    },
    premium: {
      label: 'Premium',
      bgColor: 'bg-amber-400',
      textColor: 'text-amber-900',
      icon: Star,
    },
    expiring: {
      label: 'Por vencer',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: AlertTriangle,
    },
    in_review: {
      label: 'En Revision',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: Clock,
    },
    resolved: {
      label: 'Resuelto',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: CheckCircle2,
    },
    attended: {
      label: 'Atendido',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: CheckCircle2,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-3 py-1',
  };

  const iconSize = size === 'small' ? 14 : 16;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${config.bgColor} ${config.textColor}
        ${sizeClasses[size]}
      `}
    >
      <Icon size={iconSize} />
      {label || config.label}
    </span>
  );
};

export default StatusBadge;
