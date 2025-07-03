import Link from 'next/link';
import { ReactNode } from 'react';

export type ButtonVariant = 'outline' | 'solid' | 'accent';

interface BaseButtonProps {
    children: ReactNode;
    className?: string;
    variant?: ButtonVariant;
    disabled?: boolean;
}

interface ButtonAsButton extends BaseButtonProps {
    as?: 'button';
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
}

interface ButtonAsLink extends BaseButtonProps {
    as: 'link';
    href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles = {
    outline:
        'border text-foreground hover:bg-accent-muted-hover hover:border-accent-muted',
    solid: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300',
    accent: 'bg-accent-muted text-neutral-50 hover:bg-accent-muted-hover',
};

export default function Button(props: ButtonProps) {
    const {
        children,
        className = '',
        variant = 'solid',
        disabled = false,
    } = props;

    const baseClasses = `px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`;

    if (props.as === 'link') {
        return (
            <Link href={props.href} className={baseClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button
            onClick={props.onClick}
            type={props.type || 'button'}
            disabled={disabled}
            className={baseClasses}
        >
            {children}
        </button>
    );
}
