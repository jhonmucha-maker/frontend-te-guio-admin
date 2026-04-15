import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const variants = {
  success: {
    container: 'bg-success-50 text-success-600 border-success-200',
    icon: CheckCircle,
  },
  error: {
    container: 'bg-error-50 text-error-600 border-error-200',
    icon: AlertCircle,
  },
  warning: {
    container: 'bg-warning-50 text-warning-600 border-warning-200',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-info-50 text-info-600 border-info-200',
    icon: Info,
  },
};

const Alert = ({
  children,
  variant = 'info',
  title,
  onClose,
  className = '',
  ...props
}) => {
  const { container, icon: Icon } = variants[variant];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border
        ${container}
        ${className}
      `}
      role="alert"
      {...props}
    >
      <Icon className="flex-shrink-0 mt-0.5" size={18} />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;
