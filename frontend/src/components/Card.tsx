import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Card({
  children,
  className,
  title,
  description,
}: CardProps) {
  return (
    <div className={cn("bg-white rounded-xl shadow-card border border-gray-100 animate-fade-in-up", className)}>
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
