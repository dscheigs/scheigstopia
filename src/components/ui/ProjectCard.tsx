'use client';

import Image from 'next/image';
import Button from './Button';
import { Project } from '@/types/project';

interface ProjectCardProps {
    project: Project;
    onReadMore: () => void;
}

export default function ProjectCard({ project, onReadMore }: ProjectCardProps) {
    const { image, projectName, briefDescription } = project;

    const handleReadMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        onReadMore();
    };

    return (
        <div className="relative w-full max-w-sm mx-auto group h-75">
            {/* Card Container */}
            <div className="relative w-full h-full hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-surface-minimal border border-border-minimal rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="space-y-4 h-full flex flex-col">
                        {/* Project Name with Company Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center border border-border-minimal flex-shrink-0">
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
                            <h3 className="text-subheading font-semibold text-foreground leading-tight">
                                {projectName}
                            </h3>
                        </div>

                        {/* Brief Description */}
                        <div className="flex-1">
                            <p className="text-body text-text-minimal leading-relaxed">
                                {briefDescription}
                            </p>
                        </div>

                        {/* Read More Button */}
                        <div className="flex justify-center">
                            <Button
                                onClick={handleReadMore}
                                variant="accent"
                                className="text-sm"
                            >
                                Read More
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
