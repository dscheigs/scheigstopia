'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProjectCardProps {
    companyLogo: string;
    projectName: string;
    briefDescription: string;
    detailedDescription: string;
    technologies: string[];
    contributions: string[];
}

export default function ProjectCard({
    companyLogo,
    projectName,
    briefDescription,
    detailedDescription,
    technologies,
    contributions,
}: ProjectCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleReadMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className={`relative w-full max-w-sm mx-auto group transition-all duration-500 ease-in-out ${
                isExpanded ? 'h-auto' : 'h-80'
            }`}
        >
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

                                {/* Technologies */}
                                <div>
                                    <h4 className="text-subheading font-medium text-foreground mb-2">
                                        Technologies
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {technologies.map((tech, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-foreground/10 text-foreground text-xs rounded-md border border-border"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Bottom Section */}
                            <div className="pt-4 mt-auto flex justify-center">
                                <button
                                    onClick={handleReadMore}
                                    className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg transition-all duration-200 text-sm font-medium"
                                >
                                    {isExpanded ? 'Show Less' : 'Read More'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="bg-surface border border-t-0 border-border rounded-b-lg p-6 space-y-6">
                    {/* Project Overview */}
                    <div>
                        <h3 className="text-heading font-medium text-foreground mb-3">
                            Project Overview
                        </h3>
                        <p className="text-body text-muted leading-relaxed">
                            {detailedDescription}
                        </p>
                    </div>

                    {/* Technologies Used */}
                    <div>
                        <h3 className="text-heading font-medium text-foreground mb-3">
                            Technologies Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {technologies.map((tech, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-2 bg-foreground/10 text-foreground text-sm rounded-lg border border-border font-medium"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Key Contributions */}
                    <div>
                        <h3 className="text-heading font-medium text-foreground mb-3">
                            Key Contributions
                        </h3>
                        <ul className="space-y-2">
                            {contributions.map((contribution, index) => (
                                <li
                                    key={index}
                                    className="text-body text-muted flex items-start gap-3"
                                >
                                    <span className="text-foreground text-sm mt-1 flex-shrink-0">
                                        •
                                    </span>
                                    {contribution}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
