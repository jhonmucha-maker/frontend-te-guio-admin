const variants = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-50 text-success-600',
  error: 'bg-error-50 text-error-600',
  warning: 'bg-warning-50 text-warning-600',
  info: 'bg-info-50 text-info-600',
  neutral: 'bg-neutral-100 text-neutral-600',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/10 text-accent-dark',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-2xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-md font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
};

export default Badge;
