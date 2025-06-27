'use client';

import Image from 'next/image';
import { useState } from 'react';
import ProjectModal from './ProjectModal';
import { Project } from '@/types/project';

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const { image, projectName, briefDescription } = project;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleReadMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    return (
        <div className="relative w-full max-w-sm mx-auto group h-80">
            {/* Card Container */}
            <div className="relative w-full h-full hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-surface border border-border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="space-y-6 h-full flex flex-col">
                        {/* Project Name with Company Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center border border-border flex-shrink-0">
                                <span className="text-foreground font-medium text-sm">
                                    {image && (
                                        <Image
                                            width={10}
                                            height={10}
                                            src={image}
                                            alt={`${projectName} logo`}
                                            className="w-10 h-10 object-cover rounded-md"
                                        />
                                    )}
                                </span>
                            </div>
                            <h3 className="text-heading font-semibold text-foreground">
                                {projectName}
                            </h3>
                        </div>

                        {/* Brief Description */}
                        <div className="flex-1">
                            <p className="text-body text-muted leading-relaxed">
                                {briefDescription}
                            </p>
                        </div>

                        {/* Read More Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleReadMore}
                                className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
                            >
                                Read More
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={project}
            />
        </div>
    );
}
