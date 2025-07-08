'use client';

import { useState } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import ProjectModal from '@/components/ui/ProjectModal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mockProjects } from '@/data/mockProjects';
import { Project } from '@/types/project';

export default function ProjectsList() {
    const [selectedSection, setSelectedSection] = useState('Professional');
    const [selectedProject, setSelectedProject] = useState<Project | null>(
        null
    );

    const filteredProjects = mockProjects.filter(
        (project) => project.type === selectedSection.toLowerCase()
    );

    const handleSelectSection = (section: string) => {
        if (!document.startViewTransition) {
            setSelectedSection(section);
            return;
        }

        // With a transition:
        document.startViewTransition(() => {
            setSelectedSection(section);
        });
    };

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
                
                /* View transition styles */
                .project-grid {
                    view-transition-name: project-grid;
                }
                
                ::view-transition-old(project-grid),
                ::view-transition-new(project-grid) {
                    animation-duration: 0.4s;
                }
                
                ::view-transition-old(project-grid) {
                    animation-name: slide-out-down;
                }
                
                ::view-transition-new(project-grid) {
                    animation-name: slide-in-up;
                }
                
                @keyframes slide-out-down {
                    to {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                }
                
                @keyframes slide-in-up {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                }
            `}</style>
            <div className="flex justify-center mb-8">
                <SegmentedControl
                    options={['Professional', 'Personal']}
                    value={selectedSection}
                    onChange={handleSelectSection}
                    className="w-full max-w-md mx-4 sm:w-[60vw] sm:max-w-2xl"
                />
            </div>

            {/* Project Cards Grid */}
            <div className="project-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                    <div key={index} className="scroll-fade-in">
                        <ProjectCard
                            project={project}
                            onReadMore={() => setSelectedProject(project)}
                        />
                    </div>
                ))}
            </div>

            {/* Modal rendered at list level */}
            {selectedProject && (
                <ProjectModal
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    project={selectedProject}
                />
            )}
        </>
    );
}
