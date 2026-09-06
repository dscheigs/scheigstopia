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
        <div className="container mx-auto px-4 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between mb-6 pt-8">
                <h1 className="text-page-title">Projects</h1>
            </div>

            <ProjectsList />
        </div>
    );
}
