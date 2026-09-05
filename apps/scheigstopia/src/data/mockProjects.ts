import { Project, ProfessionalProject, PersonalProject } from '@/types/project';

const professionalProjects: ProfessionalProject[] = [
    {
        type: 'professional',
        headerImage: {
            src: '/CVNA.png',
            alt: 'Carvana company logo',
        },
        projectName: 'Vehicle Inspection Platform',
        briefDescription:
            'Web application for vehicle inspection workflows, featuring real-time collaboration and third-party device integrations.',
        detailedDescription: [
            {
                type: 'paragraph',
                content:
                    'Developed a web application for vehicle inspection workflows as part of a small team. The platform evolved from a focused tool into a comprehensive solution used across multiple facilities.',
            },
            {
                type: 'paragraph',
                content:
                    'Contributed to building real-time collaboration features and integrating third-party scanning capabilities. Focused on creating intuitive user experiences that required minimal training. Promoted from Engineer II to Senior Engineer based on contributions to the project.',
            },
        ],
        technologies: ['React', 'TypeScript', 'SignalR'],
        contributions: [
            'Built real-time collaborative features for inspection workflows',
            'Integrated third-party device SDKs',
            'Designed intuitive user interfaces requiring minimal training',
            'Promoted from Engineer II to Senior Engineer',
        ],
    },
    {
        type: 'professional',
        headerImage: {
            src: '/CVNA.png',
            alt: 'Carvana company logo',
        },
        projectName: 'Vehicle Tracking Application',
        briefDescription:
            'Greenfield location tracking application with barcode scanning capabilities and real-time updates.',
        detailedDescription: [
            {
                type: 'paragraph',
                content:
                    'Led frontend development for a greenfield tracking application designed to improve operational efficiency. Built support for multiple scanning methods and real-time location updates.',
            },
        ],
        technologies: ['React', 'TypeScript'],
        contributions: [
            'Led frontend development as Senior Engineer I',
            'Built scanning integration supporting multiple input methods',
            'Implemented real-time tracking features',
            'Developed greenfield application from concept to production',
        ],
    },
    {
        type: 'professional',
        headerImage: {
            src: '/GM.png',
            alt: 'General Motors company logo',
        },
        projectName: 'Accessories eCommerce Platform',
        briefDescription:
            'Led frontend modernization of GM accessories eCommerce platform, migrating from legacy AngularJS to React while maintaining WebSphere Commerce backend.',
        detailedDescription: [
            {
                type: 'paragraph',
                content:
                    'Part of a large team responsible for creating and maintaining an accessories eCommerce platform for GM. Originally built on WebSphere Commerce (formerly IBM) with a Java backend and AngularJS frontend, a significant portion of my work involved leading the frontend migration to React while the Java backend remained largely unchanged.',
            },
            {
                type: 'paragraph',
                content:
                    'The complete UI rewrite significantly improved the user experience in both speed and flow. A key challenge was getting the entire team up to speed with React within an aggressive timeline, requiring rapid knowledge sharing and establishing new development patterns.',
            },
            {
                type: 'paragraph',
                content:
                    'Beyond the frontend work, I integrated various third-party services including payment gateways like Klarna, and connected inventory and content management systems. I also built and maintained the image server infrastructure, including writing scripts that processed and uploaded product images nightly, ensuring optimal performance and scalability.',
            },
        ],
        technologies: ['React', 'Java', 'WebSphere Commerce', 'AngularJS'],
        contributions: [
            'Led frontend migration from AngularJS to React for 40-person team',
            'Completed full UI rewrite improving user experience and performance',
            'Built automated nightly image processing and upload system',
            'Integrated payment gateways including Klarna',
            'Connected inventory and content management systems',
            'Maintained high-performance image server infrastructure',
        ],
    },
    {
        type: 'professional',
        headerImage: {
            src: '/GM.png',
            alt: 'General Motors company logo',
        },
        projectName: 'Shop Click Drive',
        briefDescription:
            'Digital showroom and lead generation platform for GM vehicles, transitioning from frontend development to Application Owner role leading DevOps initiatives.',
        detailedDescription: [
            {
                type: 'paragraph',
                content:
                    'Part of a team responsible for maintaining a digital showroom and lead generation application for GM vehicles. The platform allowed users to explore different vehicle models, view detailed specifications, and schedule test drives, serving as a critical tool for dealership lead generation.',
            },
            {
                type: 'paragraph',
                content:
                    'Initially focused on frontend development, ensuring the Angular application was responsive and user-friendly. As the project evolved, I transitioned into an Application Owner role, taking on broader responsibilities for the platform health and deployment infrastructure.',
            },
            {
                type: 'paragraph',
                content:
                    'In this expanded role, I led our team initial foray into DevOps practices. This included setting up CI/CD pipelines in Azure DevOps, automating deployments, and building a more maintainable build system. I was primarily responsible for ensuring our applications met security and failover compliance standards, working to establish reliability practices across the team.',
            },
        ],
        technologies: ['Angular', 'Azure DevOps', 'CI/CD'],
        contributions: [
            'Built responsive frontend for vehicle showroom application',
            'Transitioned to Application Owner role overseeing platform health',
            'Led team DevOps initiative and established CI/CD practices',
            'Set up automated deployment pipelines in Azure DevOps',
            'Ensured security and failover compliance standards',
            'Built maintainable build and deployment infrastructure',
        ],
    },
];

const personalProjects: PersonalProject[] = [
    {
        type: 'personal',
        projectName: 'Personal Blog & Portfolio',
        briefDescription:
            'A modern, responsive blog and portfolio site built with Next.js, featuring markdown support and dynamic content management.',
        detailedDescription:
            'Created a personal blog and portfolio website from scratch using Next.js and TypeScript. Features include markdown blog posts, dynamic routing, responsive design, dark mode support, and SEO optimization. The site showcases my projects and technical writing.',
        technologies: [
            'Next.js',
            'TypeScript',
            'Tailwind CSS',
            'MDX',
            'Vercel',
        ],
        status: 'completed',
    },
    {
        type: 'personal',
        projectName: 'Hot Sauce Project',
        briefDescription:
            'Growing jalapeño and cayenne peppers in the Phoenix desert to produce homemade hot sauce, experimenting with cultivation techniques and desert agriculture.',
        detailedDescription: [
            {
                type: 'paragraph',
                content:
                    'I grow jalapeño and cayenne peppers with the goal of producing my own hot sauce. What started as a few plants in pots has grown into a more deliberate setup. I recently moved everything into galvanized raised beds, dialing in soil composition, irrigation, and shade management for the desert heat.',
            },
            {
                type: 'paragraph',
                content:
                    "Along the way I've worked through the usual challenges: transplant shock, pest management, and figuring out what actually keeps plants healthy through a Phoenix summer. It's an ongoing experiment, and the hot sauce is the goal that keeps it interesting.",
            },
            {
                type: 'paragraph',
                content:
                    "I'm still working on nailing down a recipe I actually like. It's been a lot of trial and error, tweaking fermentation times, adjusting spice ratios, and figuring out what balance of heat and flavor works best. Each batch teaches me something new.",
            },
        ],
    },
];

export const mockProjects: Project[] = [
    ...professionalProjects,
    ...personalProjects,
];
