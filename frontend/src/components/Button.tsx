import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
  `.replace(/\s+/g, ' ').trim();

  const variants = {
    primary: `
      bg-gradient-to-b from-primary-500 to-primary-600 text-white
      hover:from-primary-600 hover:to-primary-700 hover:shadow-md
      focus:ring-primary-500
      shadow-sm
    `.replace(/\s+/g, ' ').trim(),
    secondary: `
      bg-white text-gray-700 border border-gray-300
      hover:bg-gray-50 hover:border-gray-400
      focus:ring-gray-500
    `.replace(/\s+/g, ' ').trim(),
    danger: `
      bg-gradient-to-b from-red-500 to-red-600 text-white
      hover:from-red-600 hover:to-red-700 hover:shadow-md
      focus:ring-red-500
      shadow-sm
    `.replace(/\s+/g, ' ').trim(),
    ghost: `
      bg-transparent text-gray-600
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500
    `.replace(/\s+/g, ' ').trim(),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
