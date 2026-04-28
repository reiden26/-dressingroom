import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-slate-700 hover:bg-slate-800 text-white focus:ring-slate-500',
      secondary: 'bg-white/70 ring-1 ring-white/60 hover:bg-white/80 text-slate-700 focus:ring-sky-300',
      outline: 'border border-slate-300 hover:border-slate-400 text-slate-700 focus:ring-slate-400',
      ghost: 'bg-transparent hover:bg-white/40 text-slate-600 focus:ring-slate-400',
    };

    const sizes = {
      sm: 'px-4 py-2 text-[12.5px]',
      md: 'px-5 py-2.5 text-[13px]',
      lg: 'px-6 py-3 text-[14px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
