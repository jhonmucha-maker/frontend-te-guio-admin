import { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Button, Spinner } from '../../ui';

/**
 * ConfirmDialog - Dialogo de confirmacion reutilizable
 * @param {boolean} open - Si esta abierto
 * @param {function} onClose - Callback al cerrar
 * @param {function} onConfirm - Callback al confirmar
 * @param {string} title - Titulo del dialogo
 * @param {string} message - Mensaje de confirmacion
 * @param {string} confirmText - Texto del boton confirmar
 * @param {string} cancelText - Texto del boton cancelar
 * @param {string} type - Tipo (warning, success, error, info)
 * @param {boolean} requireReason - Si requiere motivo
 * @param {string} reasonLabel - Label del campo de motivo
 * @param {boolean} loading - Si esta cargando
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = '¿Estas seguro?',
  message = 'Esta accion no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  requireReason = false,
  reasonLabel = 'Motivo',
  reasonPlaceholder = 'Escribe el motivo...',
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const iconMap = {
    warning: <AlertTriangle size={48} className="text-amber-500" />,
    success: <CheckCircle size={48} className="text-green-500" />,
    error: <AlertCircle size={48} className="text-red-500" />,
    info: <Info size={48} className="text-blue-500" />,
  };

  const buttonColorMap = {
    warning: 'primary',
    success: 'success',
    error: 'danger',
    info: 'primary',
  };

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('El motivo es requerido');
      return;
    }
    onConfirm(requireReason ? reason : undefined);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Dialog */}
        <div
          className="bg-surface rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con icono */}
          <div className="pt-6 pb-4 text-center">
            <div className="mb-4">
              {iconMap[type]}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {title}
            </h3>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-center text-gray-600 mb-4">
              {message}
            </p>

            {requireReason && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {reasonLabel}
                </label>
                <textarea
                  rows={3}
                  placeholder={reasonPlaceholder}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError('');
                  }}
                  className={`
                    w-full px-3 py-2 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/20
                    ${error ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                {error && (
                  <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              fullWidth
            >
              {cancelText}
            </Button>
            <Button
              variant={buttonColorMap[type]}
              onClick={handleConfirm}
              disabled={loading}
              fullWidth
              startIcon={loading && <Spinner size="sm" />}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
