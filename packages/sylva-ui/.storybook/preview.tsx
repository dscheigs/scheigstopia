import { useEffect, type ReactNode } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import './storybook.css';

type Theme = 'light' | 'dark';

/** Sets data-theme on <html>; storybook.css turns it into the color scheme. */
function ThemeFrame({
    theme,
    children,
}: {
    theme: Theme;
    children: ReactNode;
}) {
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);
    return <>{children}</>;
}

const withTheme: Decorator = (Story, context) => (
    <ThemeFrame theme={(context.globals.theme as Theme) ?? 'light'}>
        <Story />
    </ThemeFrame>
);

const preview: Preview = {
    decorators: [withTheme],
    globalTypes: {
        theme: {
            description: 'Color scheme',
            toolbar: {
                title: 'Theme',
                icon: 'circlehollow',
                items: [
                    { value: 'light', title: 'Light' },
                    { value: 'dark', title: 'Dark' },
                ],
                dynamicTitle: true,
            },
        },
    },
    initialGlobals: { theme: 'light' },
    parameters: {
        layout: 'padded',
        controls: { expanded: true },
    },
};

export default preview;
