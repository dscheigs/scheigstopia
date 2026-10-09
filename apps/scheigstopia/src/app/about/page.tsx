import type { Metadata } from 'next';
import HeroSection from '@/components/ui/HeroSection';
import { createPageMetadata } from '@/utils/metadata';

export const metadata: Metadata = createPageMetadata({
    title: 'About Me | Scheigstopia',
    description: 'Who is behind Scheigstopia.',
});

export default function About() {
    return (
        <div className="container mx-auto px-4 lg:py-36 py-8">
            <HeroSection />
        </div>
    );
}
