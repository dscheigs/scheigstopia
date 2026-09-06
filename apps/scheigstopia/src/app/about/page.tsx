import type { Metadata } from 'next';
import { createPageMetadata } from '@/utils/metadata';

export const metadata: Metadata = createPageMetadata({
    title: 'About | Daniel Scheigert',
    description: 'Learn more about me. Daniel Scheigert',
});

export default function About() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-hero font-bold text-foreground mb-6">
                        About Daniel
                    </h1>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                    <section className="mb-12">
                        <p className="text-lead text-text-minimal leading-relaxed mb-6">
                            I&apos;m Daniel Scheigert, a human located in
                            Phoenix, AZ. My journey in the world of code began
                            with editing the html on my Myspace page to be the
                            envy of all my friends. Since then it&apos;s grown
                            into a lifelong fascination.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-section-title font-semibold text-foreground mb-6">
                            Background
                        </h2>
                        <p className="text-body text-text-minimal leading-relaxed mb-6">
                            I was born and raised in Phoenix, where I continue
                            to live today. I graduated from Arizona State
                            University with a bachelor&apos;s degree in Computer
                            Science. I would describe my development experience
                            as full stack with an emphasis on the front end.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-section-title font-semibold text-foreground mb-6">
                            What Drives Me
                        </h2>
                        <p className="text-body text-text-minimal leading-relaxed mb-6">
                            I am mostly driven by the challenge of solving
                            complex problems and the satisfaction of creating
                            solutions that I know will make others happy to use.
                            The highlight of my job is finding creative and
                            interesting ways to generate positive user
                            experience.
                        </p>
                        <p className="text-body text-text-minimal leading-relaxed mb-6">
                            I&apos;ve also found that one of most enjoyable
                            aspects of life is learning new things. This just so
                            happens to work wonderfully with my career. This
                            curiosity also lends itself to other areas of my
                            life, such as snowboarding, woodworking, and playing
                            guitar.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
