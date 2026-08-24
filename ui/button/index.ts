// src/components/button.ts
import { cn } from '../../libs/libs';

interface ButtonProps {
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: string | HTMLElement;
  iconPosition?: 'left' | 'right';
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

// ✅ LOCAL HELPER - defined here, used here
function createIcon(icon: string | HTMLElement): HTMLElement {
  if (icon instanceof HTMLElement) {
    return icon;
  }
  
  const span = document.createElement('span');
  span.className = 'button-icon';
  span.innerHTML = icon;
  return span;
}

export default function Button(props: ButtonProps = {}): HTMLButtonElement {
  const {
    label = '',
    variant = 'default',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    loadingText,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    className,
    onClick,
  } = props;

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    link: 'bg-transparent text-blue-600 hover:underline',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2',
  };

  return r('button', {
    type,
    disabled: disabled || loading,
    className: cn(
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200',
      'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className,
    ),
    onClick,
  },
    icon && iconPosition === 'left' && createIcon(icon),
    r('span', null, loading ? (loadingText || 'Loading...') : label),
    loading && r('span', { className: 'animate-spin' }, '⟳'),
    icon && iconPosition === 'right' && createIcon(icon),
  ) as HTMLButtonElement;
}