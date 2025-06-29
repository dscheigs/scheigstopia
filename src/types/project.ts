// Base project interface with common fields
export interface BaseProject {
    image: string;
    projectName: string;
    briefDescription: string;
    detailedDescription: string;
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
}

// Union type for all projects
export type Project = ProfessionalProject | PersonalProject;
