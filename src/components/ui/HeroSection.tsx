import Image from 'next/image';

interface HeroSectionProps {
    imageSrc: string;
    imageAlt: string;
    topText?: string;
    bottomText?: string;
}

export default function HeroSection({
    imageSrc,
    imageAlt,
    topText,
    bottomText,
}: HeroSectionProps) {
    return (
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-hero mb-6 opacity-0 translate-x-0 animate-slide-in-left">
                {topText}
            </h1>
            <div className="w-60 h-60 rounded-full overflow-hidden mb-8">
                <Image
                    src={imageSrc}
                    alt={imageAlt}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    priority
                />
            </div>
            <h2
                className="text-hero mb-6 opacity-0 translate-x-0 animate-slide-in-right"
                style={{ animationDelay: '0.525s' }}
            >
                {bottomText}
            </h2>
        </div>
    );
}
