'use client';

import { useState } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mockProjects } from '@/data/mockProjects';

export default function Projects() {
    const [selectedSection, setSelectedSection] = useState('Professional');

    const filteredProjects = mockProjects.filter(
        (project) => project.type === selectedSection.toLowerCase()
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-page-title mb-16">Projects</h1>
            <div className="flex justify-center mb-8">
                <SegmentedControl
                    options={['Professional', 'Personal']}
                    value={selectedSection}
                    onChange={setSelectedSection}
                    className="w-[60vw] max-w-2xl"
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
