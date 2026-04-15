import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-secondary text-white hover:bg-secondary-light',
  accent: 'bg-accent text-white hover:bg-accent-dark shadow-sm hover:shadow-md active:scale-[0.98]',
  outline: 'border-2 border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary bg-transparent',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
  danger: 'bg-error text-white hover:bg-error-dark',
  success: 'bg-success text-white hover:bg-success-dark',
  warning: 'bg-warning text-white hover:bg-warning-dark',
  info: 'bg-info text-white hover:bg-info-dark',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  startIcon,
  endIcon,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-button transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : startIcon}
      {children}
      {!loading && endIcon}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
