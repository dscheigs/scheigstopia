import Image from 'next/image';

export default function Home() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                {/* Profile Image */}
                <div className="w-60 h-60 rounded-full overflow-hidden mb-8">
                    <Image
                        src="/headshot.jpg"
                        alt="me, daniel"
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                        priority
                    />
                </div>

                {/* Brief Summary */}
                <h1 className="text-hero mb-6">Hi, I&apos;m Daniel</h1>
                <p className="text-lead max-w-2xl">
                    Building modern web applications with clean code and
                    thoughtful design. Passionate about creating digital
                    experiences that make a difference.
                </p>
            </div>
        </div>
    );
}
