import HeroSection from '@/components/ui/HeroSection';

export default function Home() {
    return (
        <div className="container mx-auto px-4 py-16">
            <HeroSection
                topText="Hi,"
                bottomText="I'm Daniel"
                imageSrc="/headshot.jpg"
                imageAlt="me, daniel"
            />
        </div>
    );
}
