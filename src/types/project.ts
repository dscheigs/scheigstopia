type Image = {
    src: string;
    alt: string;
    width?: number;
    height?: number;
};

// Content block types for structured descriptions
export type ContentBlock =
    | { type: 'paragraph'; content: string }
    | { type: 'list'; items: string[] };

// Base project interface with common fields
export interface BaseProject {
    headerImage?: Omit<Image, 'width' | 'height'>; // Optional header image
    projectName: string;
    briefDescription: string;
    detailedDescription: string | ContentBlock[];
    technologies?: string[];
}

// Professional project extends base with work-specific fields
export interface ProfessionalProject extends BaseProject {
    type: 'professional';
    contributions: string[];
}

// Personal project extends base with personal-specific fields
export interface PersonalProject extends BaseProject {
    type: 'personal';
    status?: 'completed' | 'in-progress' | 'planned';
    images?: Image[];
}

// Union type for all projects
export type Project = ProfessionalProject | PersonalProject;
