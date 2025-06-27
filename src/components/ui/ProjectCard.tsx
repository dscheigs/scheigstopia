'use client';

import Image from 'next/image';
import { useState } from 'react';
import ProjectModal from './ProjectModal';
import { Project } from '@/types/project';

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const {
        companyLogo,
        projectName,
        briefDescription,
        detailedDescription,
        technologies,
        contributions,
    } = project;
    const [isFlipped, setIsFlipped] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleReadMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    return (
        <div className="relative w-full max-w-sm mx-auto group h-80">
            {/* Card Container with 3D perspective */}
            <div
                className="relative w-full h-full cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ perspective: '1000px' }}
                onClick={handleFlip}
            >
                {/* Card Inner - this element will flip */}
                <div
                    className={`relative w-full h-full preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                    }`}
                    style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.5s ease-in-out',
                    }}
                >
                    {/* Front Side */}
                    <div
                        className="absolute inset-0 w-full h-full backface-hidden bg-surface border border-border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className="space-y-6 h-full flex flex-col">
                            {/* Project Name with Company Logo */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md flex items-center justify-center border border-border flex-shrink-0">
                                    <span className="text-foreground font-medium text-sm">
                                        {companyLogo && (
                                            <Image
                                                width={10}
                                                height={10}
                                                src={companyLogo}
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

                            {/* Flip Indicator */}
                            <div className="flex justify-end">
                                <svg
                                    className="w-5 h-5 text-muted hover:text-primary transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Back Side */}
                    <div
                        className="absolute inset-0 w-full h-full backface-hidden bg-surface border border-border rounded-lg p-6 shadow-lg"
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                        }}
                    >
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-heading font-semibold text-foreground">
                                    Project Details
                                </h3>
                                <svg
                                    className="w-5 h-5 text-muted hover:text-primary transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                                {/* Detailed Description */}
                                <div>
                                    <p className="text-body text-muted leading-relaxed text-sm">
                                        {detailedDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Fixed Bottom Section */}
                            <div className="pt-4 mt-auto flex justify-center">
                                <button
                                    onClick={handleReadMore}
                                    className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg transition-all duration-200 text-sm font-medium"
                                >
                                    Read More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={{
                    projectName,
                    detailedDescription,
                    technologies,
                    contributions,
                }}
            />
        </div>
    );
}
