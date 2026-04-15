import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {startIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-input border text-neutral-900 placeholder-neutral-400
            transition-colors duration-150
            focus:outline-none focus:ring-2
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${startIcon ? 'pl-10' : ''}
            ${endIcon ? 'pr-10' : ''}
            ${hasError
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-neutral-300 focus:border-primary focus:ring-primary/20'
            }
            ${className}
          `}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {endIcon}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${hasError ? 'text-error' : 'text-neutral-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
