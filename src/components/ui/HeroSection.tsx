import Image from 'next/image';
import SocialLinks from './SocialLinks';
import OutlineButton from './OutlineButton';

export default function HeroSection() {
    return (
        <div className="flex flex-col items-center max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <h1 className="text-page-title sm:text-hero opacity-0 animate-slide-in-left">
                    Hi,
                </h1>
                <h2
                    className="text-page-title sm:text-hero opacity-0 animate-slide-in-right"
                    style={{ animationDelay: '0.325s' }}
                >
                    I&apos;m Daniel
                </h2>
            </div>

            <div
                className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mb-6 opacity-0 animate-slide-in-up"
                style={{ animationDelay: '0.8s' }}
            >
                {/* Photo */}
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                        src="/headshot.jpg"
                        alt="me, daniel"
                        width={224}
                        height={224}
                        className="w-full h-full object-cover"
                        priority
                    />
                </div>

                {/* Info next to photo */}
                <div className="lg:text-left text-center lg:pt-8">
                    <p className="text-body mb-6 text-foreground max-w-md">
                        I like to build. Sometimes my chosen outlet is code.
                        This is where I share my projects, thoughts, and
                        experiments. Feel free to explore and get in touch if
                        you want to say hi!
                    </p>

                    {/* Social Links and Nav Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-12 justify-center lg:justify-start">
                        <div className="flex gap-4">
                            <OutlineButton href="/about">About</OutlineButton>
                            <OutlineButton href="/projects">
                                Projects
                            </OutlineButton>
                        </div>
                        <SocialLinks />
                    </div>
                </div>
            </div>
        </div>
    );
}
