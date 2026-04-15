import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Seleccionar...',
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 pr-10 rounded-input border appearance-none bg-surface
            text-gray-900 cursor-pointer
            transition-colors duration-150
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${hasError
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-gray-300 focus:border-primary focus:ring-primary/20'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronDown size={18} />
        </div>
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${hasError ? 'text-error' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
