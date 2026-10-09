import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export default function Card({
    children,
    className = '',
    hoverEffect = false,
}: CardProps) {
    const hoverClasses = hoverEffect
        ? 'hover:scale-102 hover:shadow-xl transition-all duration-300'
        : '';

    return (
        <div
            className={`w-full h-full bg-surface-minimal border border-border-minimal rounded-lg p-6 shadow-lg ${hoverClasses} ${className}`}
        >
            {children}
        </div>
    );
}
