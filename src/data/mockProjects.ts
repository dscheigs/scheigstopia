import { Project } from '@/types/project';

export const mockProjects: Project[] = [
    {
        companyLogo: '/company-logo.png',
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
        companyLogo: '/startup-logo.png',
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
        companyLogo: '/enterprise-logo.png',
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
        companyLogo: '/fintech-logo.png',
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
