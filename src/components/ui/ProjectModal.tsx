'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/types/project';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

export default function ProjectModal({
    isOpen,
    onClose,
    project,
}: ProjectModalProps) {
    const { projectName, detailedDescription, technologies } = project;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Trigger animation after component mounts
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div
                className={`relative bg-surface-minimal border border-border-minimal rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-minimal">
                    <h2 className="text-page-title font-semibold text-foreground">
                        {projectName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                        <svg
                            className="w-5 h-5 text-text-minimal hover:text-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)] space-y-6">
                    {/* Project Overview */}
                    <div>
                        <h3 className="text-section-title font-semibold text-foreground mb-3">
                            Project Overview
                        </h3>
                        <p className="text-body text-text-minimal leading-relaxed">
                            {detailedDescription}
                        </p>
                    </div>

                    {/* Technologies Used */}
                    {technologies && technologies.length > 0 && (
                        <div>
                            <h3 className="text-section-title font-semibold text-foreground mb-3">
                                Technologies Used
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {technologies.map((tech, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-2 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 text-sm rounded-lg border border-border-minimal font-medium"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Contributions (Professional projects only) */}
                    {project.type === 'professional' && (
                        <div>
                            <h3 className="text-section-title font-semibold text-foreground mb-3">
                                Key Contributions
                            </h3>
                            <ul className="space-y-3">
                                {project.contributions.map(
                                    (contribution, index) => (
                                        <li
                                            key={index}
                                            className="text-body text-text-minimal flex items-start gap-3"
                                        >
                                            <span className="text-foreground text-sm mt-1 flex-shrink-0">
                                                •
                                            </span>
                                            {contribution}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Personal Project Details */}
                    {project.type === 'personal' && (
                        <div className="space-y-4">
                            {project.status && (
                                <div>
                                    <h3 className="text-section-title font-semibold text-foreground mb-3">
                                        Status
                                    </h3>
                                    <span
                                        className={`px-3 py-2 text-sm rounded-lg font-medium ${
                                            project.status === 'completed'
                                                ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-border-minimal'
                                                : project.status ===
                                                    'in-progress'
                                                  ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-border-minimal'
                                                  : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-border-minimal'
                                        }`}
                                    >
                                        {project.status === 'in-progress'
                                            ? 'In Progress'
                                            : project.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              project.status.slice(1)}
                                    </span>
                                </div>
                            )}

                            {(project.githubUrl || project.liveUrl) && (
                                <div>
                                    <h3 className="text-section-title font-semibold text-foreground mb-3">
                                        Links
                                    </h3>
                                    <div className="flex gap-3">
                                        {project.githubUrl && (
                                            <a
                                                href={project.githubUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                GitHub
                                            </a>
                                        )}
                                        {project.liveUrl && (
                                            <a
                                                href={project.liveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 border border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 dark:border-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-200 dark:hover:text-neutral-900 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                Live Demo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
