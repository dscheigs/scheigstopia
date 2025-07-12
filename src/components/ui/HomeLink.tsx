'use client';

import Link from 'next/link';
import GnomeIcon from '@/components/icons/GnomeIcon';
import { useEffect, useRef, useState } from 'react';

export default function HomeLink() {
    const [isAnimated, setIsAnimated] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && window.scrollY > 175) {
                    setIsAnimated(true);
                } else if (!entry.isIntersecting && window.scrollY <= 175) {
                    setIsAnimated(false);
                }
            },
            { threshold: 0.1 }
        );

        if (triggerRef.current) {
            observer.observe(triggerRef.current);
        }

        const handleScroll = () => {
            if (window.scrollY > 175) {
                setIsAnimated(true);
            } else {
                setIsAnimated(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            <style>{
                /*css*/ `
                .name-fade {
                    opacity: 1;
                    transform: scaleX(1) rotateY(0deg);
                    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                    transform-origin: center;
                }
                .name-fade.animated {
                    opacity: 0;
                    transform: scaleX(0) rotateY(90deg);
                }
                .s-letter {
                    transform: translateX(0);
                    transition: transform 0.3s ease-in-out;
                }
                .s-letter.animated {
                    transform: translateX(-58%);
                }
            `
            }</style>
            <div ref={triggerRef}>
                <Link
                    title="(It's pronounced Shy-gert)"
                    aria-label="Daniel Scheigert - Home"
                    href="/"
                    className="flex items-center gap-4 text-section-title text-foreground"
                >
                    <GnomeIcon size={32} className="flex-shrink-0" />
                    <div
                        style={{ fontFamily: 'var(--font-sans)' }}
                        className="flex"
                    >
                        <span className="font-bold">
                            D
                            <span
                                className={`name-fade ${isAnimated ? 'animated' : ''}`}
                            >
                                aniel
                            </span>
                        </span>
                        <span
                            className={`font-extralight s-letter ${isAnimated ? 'animated' : ''}`}
                        >
                            &nbsp;S
                            <span
                                className={`name-fade ${isAnimated ? 'animated' : ''}`}
                            >
                                cheigert
                            </span>
                        </span>
                    </div>
                </Link>
            </div>
        </>
    );
}
