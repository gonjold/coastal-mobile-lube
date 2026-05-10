import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, ...rest }, ref) => {
    const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-colors';
    const styles =
      variant === 'primary'
        ? 'bg-primary text-primary-foreground hover:opacity-90'
        : variant === 'secondary'
        ? 'bg-secondary text-secondary-foreground hover:bg-muted'
        : 'bg-transparent text-foreground hover:bg-muted';
    return (
      <button ref={ref} className={`${base} ${styles} ${className}`} {...rest}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
