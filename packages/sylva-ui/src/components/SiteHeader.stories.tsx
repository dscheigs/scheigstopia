import type { Meta, StoryObj } from '@storybook/react-vite';
import { LogOut } from '../icons';
import { navActionClasses } from '../primitives';
import SiteHeader from './SiteHeader';

const meta = {
    title: 'Components/SiteHeader',
    component: SiteHeader,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The site itself: no app name after the gnome. */
export const Site: Story = {
    args: {
        nav: [
            { name: 'Home', href: '/', sameApp: true, current: true },
            { name: 'Projects', href: '/projects', sameApp: true },
            { name: 'Contact', href: '/contact', sameApp: true },
        ],
    },
};

/** Inside an app: the gnome, the app name, then the app's own links. */
export const AppWithNav: Story = {
    args: {
        app: { name: 'Grimoire', href: '/' },
        nav: [
            { name: 'Collection', href: '/', sameApp: true, current: true },
            { name: 'Add Cards', href: '/add', sameApp: true },
            { name: 'Queue', href: '/queue', sameApp: true },
        ],
    },
};

/** Grimoire's header: the gnome holding a book. */
export const GrimoireGnome: Story = {
    args: { ...AppWithNav.args, gnome: 'grimoire' },
};

/** An extra control after the links, such as sign-out. */
export const WithAction: Story = {
    args: {
        ...AppWithNav.args,
        nav: AppWithNav.args?.nav ?? [],
        actions: (
            <button type="button" className={navActionClasses}>
                <LogOut aria-hidden="true" className="mr-2 inline" />
                Sign out
            </button>
        ),
    },
};

/** Links to another origin are plain anchors, never client-side links. */
export const CrossAppLink: Story = {
    args: {
        app: { name: 'Grimoire', href: '/' },
        nav: [
            { name: 'Collection', href: '/', sameApp: true, current: true },
            { name: 'Site', href: 'https://scheigs.com/projects' },
        ],
    },
};
