'use client';

import Modal from './Modal';
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

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border-minimal flex-shrink-0">
                <h2 className="text-page-title font-semibold text-foreground pr-4 leading-tight">
                    {projectName}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-surface-minimal-hover rounded-lg transition-colors cursor-pointer flex-shrink-0"
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
            <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
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
                                    className="px-3 py-2 bg-surface-minimal text-foreground text-sm rounded-lg border border-border-minimal font-medium"
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
                                <span className="px-3 py-2 text-sm rounded-lg font-medium bg-surface-minimal text-foreground border border-border-minimal">
                                    {project.status === 'in-progress'
                                        ? 'In Progress'
                                        : project.status
                                              .charAt(0)
                                              .toUpperCase() +
                                          project.status.slice(1)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
