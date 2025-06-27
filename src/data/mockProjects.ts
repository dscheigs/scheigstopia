import { Project, ProfessionalProject, PersonalProject } from '@/types/project';

const professionalProjects: ProfessionalProject[] = [
    {
        type: 'professional',
        image: '/company-logo.png',
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
        image: '/startup-logo.png',
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
        image: '/enterprise-logo.png',
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
        image: '/fintech-logo.png',
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
        image: '/personal-blog.png',
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
        githubUrl: 'https://github.com/username/personal-blog',
        liveUrl: 'https://myblog.dev',
        status: 'completed',
    },
    {
        type: 'personal',
        image: '/task-manager.png',
        projectName: 'Task Management App',
        briefDescription:
            'A full-stack task management application with real-time collaboration, drag-and-drop functionality, and team workspaces.',
        detailedDescription:
            'Built a comprehensive task management application inspired by modern productivity tools. Features include real-time collaboration, drag-and-drop task organization, team workspaces, file attachments, and notification system. Uses WebSocket for real-time updates.',
        technologies: [
            'React',
            'TypeScript',
            'Node.js',
            'Socket.io',
            'MongoDB',
            'Express',
        ],
        githubUrl: 'https://github.com/username/task-manager',
        liveUrl: 'https://taskmanager.dev',
        status: 'completed',
    },
    {
        type: 'personal',
        image: '/weather-app.png',
        projectName: 'Weather Forecast App',
        briefDescription:
            'A beautiful weather application with location-based forecasts, interactive maps, and severe weather alerts.',
        detailedDescription:
            'Developed a modern weather application that provides detailed forecasts, interactive weather maps, and push notifications for severe weather alerts. Features location-based forecasts, historical weather data, and beautiful data visualizations.',
        technologies: [
            'React Native',
            'TypeScript',
            'OpenWeather API',
            'Mapbox',
            'Redux Toolkit',
        ],
        githubUrl: 'https://github.com/username/weather-app',
        status: 'completed',
    },
    {
        type: 'personal',
        image: '/crypto-tracker.png',
        projectName: 'Cryptocurrency Tracker',
        briefDescription:
            'Real-time cryptocurrency portfolio tracker with price alerts, news integration, and advanced analytics.',
        detailedDescription:
            'Currently building a comprehensive cryptocurrency portfolio tracker that provides real-time price updates, portfolio analytics, price alerts, and integrated news feed. Features include portfolio diversification analysis and automated trading strategies.',
        technologies: [
            'Vue.js',
            'TypeScript',
            'Firebase',
            'CoinGecko API',
            'Chart.js',
        ],
        githubUrl: 'https://github.com/username/crypto-tracker',
        status: 'in-progress',
    },
    {
        type: 'personal',
        image: '/recipe-app.png',
        projectName: 'Recipe Sharing Platform',
        briefDescription:
            'A social platform for sharing and discovering recipes with meal planning, shopping lists, and nutrition tracking.',
        detailedDescription:
            'Planning to create a social recipe sharing platform where users can discover, save, and share recipes. Will include features like meal planning, automatic shopping list generation, nutrition tracking, and recipe rating system.',
        technologies: [
            'Next.js',
            'TypeScript',
            'Prisma',
            'PostgreSQL',
            'NextAuth.js',
        ],
        status: 'planned',
    },
];

export const mockProjects: Project[] = [
    ...professionalProjects,
    ...personalProjects,
];
