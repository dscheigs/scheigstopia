import AppGrid from '@/components/AppGrid';
import { apps } from '@/data/apps';

export default function Home() {
    return (
        <div className="container mx-auto px-4 lg:py-24 py-8">
            <h1 className="sr-only">Scheigstopia</h1>
            <AppGrid apps={apps} />
        </div>
    );
}
