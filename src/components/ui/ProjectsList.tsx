'use client';

import { useState } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mockProjects } from '@/data/mockProjects';

export default function ProjectsList() {
    const [selectedSection, setSelectedSection] = useState('Professional');

    const filteredProjects = mockProjects.filter(
        (project) => project.type === selectedSection.toLowerCase()
    );

    return (
        <>
            <style>{`
                .scroll-fade-in {
                    animation: fade-in-out linear both;
                    animation-timeline: view();
                    animation-range: entry 0% exit 100%;
                }
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                    20% { opacity: 1; transform: translateY(0) scale(1); }
                    80% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-20px) scale(0.95); }
                }
            `}</style>
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
                    <div key={index} className="scroll-fade-in">
                        <ProjectCard project={project} />
                    </div>
                ))}
            </div>
        </>
    );
}
