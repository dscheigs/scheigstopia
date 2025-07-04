import Link from 'next/link';
import GnomeIcon from '@/components/icons/GnomeIcon';

export default function HomeLink() {
    return (
        <>
            <style>{`
                .scroll-name-fade {
                    animation: simple-fade linear both;
                    animation-timeline: scroll();
                    animation-range: 0 150px;
                }
                .s-letter {
                    animation: s-slide linear both;
                    animation-timeline: scroll();
                    animation-range: 150px 200px;
                }
                @keyframes simple-fade {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes s-slide {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-70px); }
                }
            `}</style>
            <Link
                title="(It's pronounced Shy-gert)"
                aria-label="Daniel Scheigert - Home"
                href="/"
                className="flex items-center gap-3 text-section-title text-foreground"
            >
                <GnomeIcon size={32} className="flex-shrink-0" />
                <div
                    style={{ fontFamily: 'var(--font-sans)' }}
                    className="flex"
                >
                    <span className="font-bold">
                        D<span className="scroll-name-fade">aniel</span>
                    </span>
                    <span className="font-extralight s-letter">
                        &nbsp;S
                        <span className="scroll-name-fade">cheigert</span>
                    </span>
                </div>
            </Link>
        </>
    );
}
