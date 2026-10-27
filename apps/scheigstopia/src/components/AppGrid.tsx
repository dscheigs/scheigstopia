import AppCard from '@/components/AppCard';
import type { HubApp } from '@/data/apps';

export default function AppGrid({ apps }: { apps: HubApp[] }) {
    return (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {apps.map((app) => (
                <li key={app.name}>
                    <AppCard app={app} />
                </li>
            ))}
        </ul>
    );
}
