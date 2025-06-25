import Link from 'next/link';

interface OutlineButtonProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export default function OutlineButton({
    href,
    children,
    className = '',
}: OutlineButtonProps) {
    return (
        <Link
            href={href}
            className={`border border-foreground text-foreground px-6 py-3 rounded-lg text-body font-medium hover:bg-foreground hover:text-background transition-colors ${className}`}
        >
            {children}
        </Link>
    );
}
