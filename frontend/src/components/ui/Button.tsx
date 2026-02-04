import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 focus:ring-offset-neutral-50',
  secondary:
    'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500 focus:ring-offset-neutral-50',
};

export function Button({
  variant = 'primary',
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClass = variantStyles[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
