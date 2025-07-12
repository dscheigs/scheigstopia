'use client';

import { useState } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import ProjectModal from '@/components/ui/ProjectModal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mockProjects } from '@/data/mockProjects';
import { Project } from '@/types/project';

/**
 * NOTE: This component uses the experimental View Transitions API for animations.
 * This is intentionally more complex than using simple CSS transitions. For learning purposes.
 */
export default function ProjectsList() {
    const [selectedSection, setSelectedSection] = useState('Professional');
    const [selectedProject, setSelectedProject] = useState<Project | null>(
        null
    );

    const professionalProjects = mockProjects.filter(
        (project) => project.type === 'professional'
    );

    const personalProjects = mockProjects.filter(
        (project) => project.type === 'personal'
    );

    const handleSelectSection = (section: string) => {
        // Don't animate if selecting the same section
        if (section === selectedSection) {
            return;
        }

        if (!document.startViewTransition) {
            setSelectedSection(section);
            return;
        }

        // Set transition direction BEFORE starting transition
        const isGoingBackward =
            selectedSection === 'Personal' && section === 'Professional';

        console.log(
            'Setting direction:',
            isGoingBackward ? 'backward' : 'forward'
        );

        if (isGoingBackward) {
            document.documentElement.setAttribute(
                'data-transition-direction',
                'backward'
            );
        } else {
            document.documentElement.removeAttribute(
                'data-transition-direction'
            );
        }

        // Force a reflow to ensure attribute is set
        void document.documentElement.offsetHeight;

        console.log(
            'Attribute set:',
            document.documentElement.getAttribute('data-transition-direction')
        );

        // With a transition:
        const transition = document.startViewTransition(() => {
            setSelectedSection(section);
        });

        transition.finished.finally(() => {
            // Clean up after transition
            document.documentElement.removeAttribute(
                'data-transition-direction'
            );
        });
    };

    return (
        <>
            <style>{
                /*css*/ `
            /* Scroll fade-in styles */
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
                
                /* Base animations with CSS variables */
                ::view-transition-old(project-grid),
                ::view-transition-new(project-grid) {
                    animation-duration: 0.2s;
                }
                
                ::view-transition-old(project-grid) {
                    animation-name: var(--slide-out-animation, slide-out-left);
                }
                
                ::view-transition-new(project-grid) {
                    animation-name: var(--slide-in-animation, slide-in-right);
                }
                
                /* Set animations based on direction */
                html[data-transition-direction="backward"] {
                    --slide-out-animation: slide-out-right;
                    --slide-in-animation: slide-in-left;
                }
                
                @keyframes slide-out-left {
                    to {
                        transform: translateX(-30px);
                        opacity: 0;
                    }
                }
                
                @keyframes slide-in-left {
                    from {
                        transform: translateX(-30px);
                        opacity: 0;
                    }
                }
                
                @keyframes slide-out-right {
                    to {
                        transform: translateX(30px);
                        opacity: 0;
                    }
                }
                
                @keyframes slide-in-right {
                    from {
                        transform: translateX(30px);
                        opacity: 0;
                    }
                }
            `
            }</style>
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
                {selectedSection === 'Professional'
                    ? professionalProjects.map((project, index) => (
                          <div
                              key={`professional-${index}`}
                              className="scroll-fade-in"
                          >
                              <ProjectCard
                                  project={project}
                                  onReadMore={() => setSelectedProject(project)}
                              />
                          </div>
                      ))
                    : personalProjects.map((project, index) => (
                          <div
                              key={`personal-${index}`}
                              className="scroll-fade-in"
                          >
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
