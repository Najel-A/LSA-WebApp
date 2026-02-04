import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
