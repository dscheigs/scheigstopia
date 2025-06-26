import ProjectCard from '@/components/ui/ProjectCard';

export default function Skills() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-page-title mb-6">Skills</h1>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                <ProjectCard
                    companyLogo="/company-logo.png"
                    projectName="E-commerce Platform"
                    briefDescription="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    detailedDescription="Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
                    technologies={[
                        'React',
                        'TypeScript',
                        'Node.js',
                        'PostgreSQL',
                    ]}
                    contributions={[
                        'Led frontend development',
                        'Implemented authentication system',
                        'Optimized database queries',
                    ]}
                />

                <ProjectCard
                    companyLogo="/startup-logo.png"
                    projectName="Mobile Analytics Dashboard"
                    briefDescription="Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."
                    detailedDescription="Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit."
                    technologies={['Vue.js', 'Python', 'Django', 'MongoDB']}
                    contributions={[
                        'Built mobile-responsive interface',
                        'Developed REST API',
                        'Implemented real-time features',
                    ]}
                />

                <ProjectCard
                    companyLogo="/enterprise-logo.png"
                    projectName="Microservices Architecture"
                    briefDescription="At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum."
                    detailedDescription="Deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi."
                    technologies={['Angular', 'Java', 'Spring Boot', 'MySQL']}
                    contributions={[
                        'Architected microservices',
                        'Mentored junior developers',
                        'Improved system performance by 40%',
                    ]}
                />
            </div>
        </div>
    );
}
