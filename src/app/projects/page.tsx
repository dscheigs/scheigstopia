'use client';

import { useState } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Download from '@/components/ui/Download';
import { mockProjects } from '@/data/mockProjects';

export default function Projects() {
    const [selectedSection, setSelectedSection] = useState('Professional');

    const filteredProjects = mockProjects.filter(
        (project) => project.type === selectedSection.toLowerCase()
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-page-title">Projects</h1>
                <Download
                    title="Resume"
                    content={'TODO: resume download'}
                    filename={`${selectedSection.toLowerCase()}-projects.txt`}
                />
            </div>
            <p className="text-lead text-foreground font-medium text-center mb-10 max-w-4xl mx-auto">
                I believe one of the most enjoyable aspects of life is learning
                new things. Here are some of my various projects that showcase
                my journey and the skills I&apos;ve acquired along the way.
            </p>
            <div className="flex justify-center mb-8">
                <SegmentedControl
                    options={['Professional', 'Personal']}
                    value={selectedSection}
                    onChange={setSelectedSection}
                    className="w-full max-w-md mx-4 sm:w-[60vw] sm:max-w-2xl"
                />
            </div>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                    <ProjectCard key={index} project={project} />
                ))}
            </div>
        </div>
    );
}
