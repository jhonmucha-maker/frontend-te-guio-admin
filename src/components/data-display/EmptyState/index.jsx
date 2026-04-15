import { Inbox, SearchX, AlertCircle } from 'lucide-react';
import { Button } from '../../ui';

/**
 * EmptyState - Estado vacio para listas
 * @param {string} type - Tipo (empty, no-results, error)
 * @param {string} title - Titulo
 * @param {string} message - Mensaje descriptivo
 * @param {string} actionLabel - Texto del boton de accion
 * @param {function} onAction - Callback del boton de accion
 * @param {React.ReactNode} icon - Icono personalizado
 */
const EmptyState = ({
  type = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  const defaultConfig = {
    empty: {
      icon: <Inbox size={64} className="text-gray-300" />,
      title: 'No hay datos',
      message: 'No se encontraron registros para mostrar.',
    },
    'no-results': {
      icon: <SearchX size={64} className="text-gray-300" />,
      title: 'Sin resultados',
      message: 'No se encontraron resultados para tu busqueda.',
    },
    error: {
      icon: <AlertCircle size={64} className="text-red-400" />,
      title: 'Error',
      message: 'Ocurrio un error al cargar los datos.',
    },
  };

  const config = defaultConfig[type] || defaultConfig.empty;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon || config.icon}

      <h3 className="mt-4 text-lg font-semibold text-gray-500">
        {title || config.title}
      </h3>

      <p className="mt-2 text-sm text-gray-400 max-w-md">
        {message || config.message}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
