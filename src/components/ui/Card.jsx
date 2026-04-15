const Card = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      className={`
        bg-surface rounded-card shadow-card border border-gray-200
        transition-all duration-200
        ${hover ? 'hover:shadow-card-hover cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-4 py-3 border-b border-gray-100 sm:px-6 sm:py-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-4 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-card sm:px-6 ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
