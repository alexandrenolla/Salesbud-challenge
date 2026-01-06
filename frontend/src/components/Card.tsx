import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  hover?: boolean;
  animate?: boolean;
}

export function Card({
  children,
  className = '',
  title,
  description,
  hover = false,
  animate = true,
}: CardProps) {
  const baseStyles = 'bg-white rounded-xl shadow-card border border-gray-100';
  const hoverStyles = hover
    ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
    : '';
  const animateStyles = animate ? 'animate-fade-in-up' : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${animateStyles} ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-100">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
