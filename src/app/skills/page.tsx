import ProjectCard from '@/components/ui/ProjectCard';
import { mockProjects } from '@/data/mockProjects';

export default function Skills() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-page-title mb-6">Skills</h1>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {mockProjects.map((project, index) => (
                    <ProjectCard key={index} project={project} />
                ))}
            </div>
        </div>
    );
}
