import { GnomeIcon } from '@scheigs/sylva-ui';
import Card from '@/components/ui/Card';
import type { HubApp } from '@/data/apps';

/** One app on the home page. The gnome is decorative and sits left of the text. */
export default function AppCard({ app }: { app: HubApp }) {
    return (
        <a href={app.href} className="block h-full">
            <Card hoverEffect>
                <div className={app.gnome ? 'flex items-center gap-4' : ''}>
                    {app.gnome ? (
                        <span aria-hidden="true" className="shrink-0">
                            <GnomeIcon size={32} variant={app.gnome} />
                        </span>
                    ) : null}
                    <div>
                        <h2 className="text-subheading font-semibold text-foreground leading-tight mb-4">
                            {app.name}
                        </h2>
                        <p className="text-body text-text-minimal leading-relaxed">
                            {app.description}
                        </p>
                    </div>
                </div>
            </Card>
        </a>
    );
}
