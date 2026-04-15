import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { Button, Spinner } from '../../ui';

/**
 * RejectModal - Modal de rechazo con motivo
 * @param {boolean} open - Si esta abierto
 * @param {function} onClose - Callback al cerrar
 * @param {function} onConfirm - Callback al confirmar (recibe el motivo)
 * @param {string} title - Titulo del modal
 * @param {string} subtitle - Subtitulo descriptivo
 * @param {string} itemName - Nombre del item a rechazar
 * @param {boolean} loading - Si esta procesando
 */
const RejectModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Rechazar solicitud',
  subtitle = '¿Estas seguro de que deseas rechazar esta solicitud?',
  itemName = '',
  loading = false,
  reasonLabel = 'Motivo del rechazo',
  reasonPlaceholder = 'Escribe el motivo del rechazo...',
  confirmText = 'Rechazar',
  cancelText = 'Cancelar',
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('El motivo es obligatorio');
      return;
    }
    if (reason.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con icono */}
        <div className="pt-6 pb-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={36} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {title}
          </h3>
          {itemName && (
            <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              {itemName}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-center text-gray-600 text-sm mb-4">
            {subtitle}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {reasonLabel}
            </label>
            <textarea
              rows={4}
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              maxLength={200}
              className={`
                w-full px-3 py-2 border rounded-lg text-sm bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface
                ${error ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            <p className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-gray-400'}`}>
              {error || `${reason.length}/200 caracteres`}
            </p>
          </div>
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
            variant="danger"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            fullWidth
            startIcon={loading ? <Spinner size="sm" /> : <XCircle size={18} />}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
