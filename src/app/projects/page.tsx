import type { Metadata } from 'next';
import ProjectsList from '@/components/ui/ProjectsList';
import { createPageMetadata } from '@/utils/metadata';

export const metadata: Metadata = createPageMetadata({
    title: 'Projects | Daniel Scheigert',
    description:
        'I like to build things. Here are some things I have done and am currently doing.',
});

export default function Projects() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-page-title">Projects</h1>
            </div>
            <p className="text-lead text-foreground font-medium text-center mb-10 max-w-4xl mx-auto">
                I find one of the most enjoyable aspects of life is learning new
                things. Here are some of my various projects that showcase my
                journey and the skills I&apos;ve acquired along the way.
            </p>

            <ProjectsList />
        </div>
    );
}
