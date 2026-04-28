import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'panel' | 'card' | 'pill';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'card', children, ...props }, ref) => {
    const variants = {
      panel: 'glass-panel p-5',
      card: 'glass-card p-5',
      pill: 'glass-pill px-4 py-2',
    };

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
