import Link from 'next/link';
import GnomeIcon from '@/components/icons/GnomeIcon';

export default function HomeLink() {
    return (
        <Link
            title="(It's pronounced Shy-gert)"
            aria-label="Scheigstopia - Home"
            href="/"
            className="flex items-center"
        >
            <GnomeIcon size={26} className="flex-shrink-0" />
        </Link>
    );
}
