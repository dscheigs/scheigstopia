import Card from '@/components/ui/Card';
import GnomeIcon from '@/components/icons/GnomeIcon';
import { apps } from '@/data/apps';

export default function Home() {
    return (
        <div className="container mx-auto px-4 lg:py-24 py-8">
            <div className="flex flex-col items-center gap-4 mb-12 text-center">
                <GnomeIcon size={48} />
                <h1 className="text-page-title">Welcome</h1>
            </div>

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {apps.map((app) => (
                    <li key={app.name}>
                        <a href={app.href} className="block h-full">
                            <Card hoverEffect>
                                <h2 className="text-subheading font-semibold text-foreground leading-tight mb-4">
                                    {app.name}
                                </h2>
                                <p className="text-body text-text-minimal leading-relaxed">
                                    {app.description}
                                </p>
                            </Card>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
