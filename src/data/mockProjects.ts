import { Project, ProfessionalProject, PersonalProject } from '@/types/project';

const professionalProjects: ProfessionalProject[] = [
    {
        type: 'professional',
        headerImage: {
            src: '/CVNA.png',
            alt: 'Carvana company logo',
        },
        projectName: 'E-commerce Platform',
        briefDescription:
            'A comprehensive e-commerce solution with modern UX and robust backend infrastructure supporting thousands of concurrent users.',
        detailedDescription:
            'Built a full-stack e-commerce platform from the ground up, featuring user authentication, product catalog management, shopping cart functionality, secure payment processing, and order tracking. The platform handles high traffic volumes with optimized database queries and caching strategies.',
        technologies: [
            'React',
            'TypeScript',
            'Node.js',
            'PostgreSQL',
            'Redis',
            'Stripe API',
        ],
        contributions: [
            'Led frontend development team of 4 developers',
            'Implemented secure authentication and authorization system',
            'Optimized database queries reducing load times by 60%',
            'Integrated payment processing with multiple providers',
            'Built responsive design supporting mobile and desktop',
        ],
    },
    {
        type: 'professional',
        headerImage: {
            src: '/GM.png',
            alt: 'General Motors company logo',
        },
        projectName: 'Mobile Analytics Dashboard',
        briefDescription:
            'Real-time analytics dashboard providing actionable insights for mobile app performance and user behavior analysis.',
        detailedDescription:
            'Developed a comprehensive analytics platform that processes millions of events daily, providing real-time insights into user behavior, app performance, and business metrics. The dashboard features customizable widgets, automated reporting, and advanced data visualization.',
        technologies: [
            'Vue.js',
            'Python',
            'Django',
            'MongoDB',
            'D3.js',
            'WebSocket',
        ],
        contributions: [
            'Built mobile-responsive interface with custom data visualizations',
            'Developed high-performance REST API handling 10K+ requests/minute',
            'Implemented real-time features using WebSocket connections',
            'Created automated reporting system with email notifications',
            'Optimized database aggregation queries for large datasets',
        ],
    },
    {
        type: 'professional',
        headerImage: {
            src: '/CVNA.png',
            alt: 'Carvana company logo',
        },
        projectName: 'Microservices Architecture',
        briefDescription:
            'Enterprise-grade microservices architecture enabling scalable, maintainable, and fault-tolerant distributed systems.',
        detailedDescription:
            'Architected and implemented a comprehensive microservices ecosystem for a large enterprise application, breaking down a monolithic system into 12 independent services. The architecture includes service discovery, load balancing, circuit breakers, and comprehensive monitoring.',
        technologies: [
            'Angular',
            'Java',
            'Spring Boot',
            'MySQL',
            'Docker',
            'Kubernetes',
            'Jenkins',
        ],
        contributions: [
            'Architected microservices breaking down monolithic application',
            'Mentored team of 8 junior developers on best practices',
            'Improved system performance by 40% and reduced deployment time by 70%',
            'Implemented comprehensive monitoring and alerting system',
            'Established CI/CD pipeline with automated testing and deployment',
        ],
    },
    {
        type: 'professional',
        headerImage: {
            src: '/GM.png',
            alt: 'General Motors company logo',
        },
        projectName: 'Financial Trading Platform',
        briefDescription:
            'High-frequency trading platform with real-time market data processing and algorithmic trading capabilities.',
        detailedDescription:
            'Built a sophisticated trading platform capable of processing thousands of trades per second with sub-millisecond latency. The system includes real-time market data feeds, risk management, portfolio tracking, and automated trading algorithms with comprehensive audit trails.',
        technologies: [
            'React',
            'C++',
            'Python',
            'Apache Kafka',
            'InfluxDB',
            'WebSocket',
        ],
        contributions: [
            'Developed ultra-low latency trading engine in C++',
            'Implemented real-time market data processing pipeline',
            'Built risk management system with automated position limits',
            'Created comprehensive audit and compliance reporting',
            'Optimized system achieving sub-millisecond trade execution',
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
