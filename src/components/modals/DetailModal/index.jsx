import { X } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useMediaQuery';

/**
 * DetailModal - Modal de detalle reutilizable
 * @param {boolean} open - Si esta abierto
 * @param {function} onClose - Callback al cerrar
 * @param {string} title - Titulo del modal
 * @param {React.ReactNode} children - Contenido del modal
 * @param {React.ReactNode} actions - Botones de accion
 * @param {string} maxWidth - Ancho maximo (sm, md, lg, xl)
 * @param {boolean} fullScreen - Si es pantalla completa en mobile
 */
const DetailModal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm',
  fullScreen = true,
  headerIcon,
}) => {
  const isMobile = useIsMobile();

  if (!open) return null;

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className={`
        ${fullScreen && isMobile
          ? 'fixed inset-0'
          : 'flex min-h-full items-center justify-center p-4'
        }
      `}>
        {/* Dialog */}
        <div
          className={`
            relative bg-surface shadow-xl transform transition-all
            ${fullScreen && isMobile
              ? 'w-full h-full'
              : `w-full ${maxWidthClasses[maxWidth]} rounded-xl max-h-[90vh] flex flex-col`
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {headerIcon && (
                <span className="text-primary">{headerIcon}</span>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * DetailRow - Fila de detalle para usar dentro de DetailModal
 */
export const DetailRow = ({ label, value, icon, fullWidth = false }) => (
  <div
    className={`
      flex py-2 border-b border-gray-100 last:border-b-0
      ${fullWidth ? 'flex-col items-start' : 'flex-row items-center'}
    `}
  >
    <div className={`flex items-center gap-2 ${fullWidth ? '' : 'min-w-[140px]'} ${fullWidth ? 'mb-1' : ''}`}>
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-sm text-gray-500 font-medium">
        {label}:
      </span>
    </div>
    <span className="text-sm text-gray-900 break-words">
      {value || '-'}
    </span>
  </div>
);

/**
 * DetailSection - Seccion dentro de DetailModal
 */
export const DetailSection = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
      {title}
    </h3>
    <div className="pl-1">
      {children}
    </div>
  </div>
);

export default DetailModal;
