import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchInput - Input de busqueda con debounce
 * @param {string} value - Valor controlado
 * @param {function} onChange - Callback cuando cambia el valor (con debounce)
 * @param {string} placeholder - Placeholder del input
 * @param {number} debounceMs - Tiempo de debounce en ms (default: 300)
 * @param {boolean} fullWidth - Si ocupa el ancho completo
 */
const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar con valor externo
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce del onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange && localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
  }, [onChange]);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-10 pr-10 py-2
          bg-surface border border-gray-300 rounded-lg
          text-sm text-gray-900 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-colors
        "
        {...props}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Limpiar busqueda"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
