import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    buttonClasses,
    inputClasses,
    navActionClasses,
    navLinkClasses,
    secondaryButtonClasses,
} from '../primitives';

const meta = {
    title: 'Foundations/Primitives',
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 border-b border-border-minimal py-4">
            <code className="w-48 text-caption text-text-minimal">{label}</code>
            {children}
        </div>
    );
}

/** The class strings the apps share, on real elements. */
export const ClassStrings: Story = {
    render: () => (
        <div>
            <Row label="buttonClasses">
                <button type="button" className={buttonClasses}>
                    Button
                </button>
                <button type="button" disabled className={buttonClasses}>
                    Disabled
                </button>
            </Row>
            <Row label="secondaryButtonClasses">
                <button type="button" className={secondaryButtonClasses}>
                    Secondary
                </button>
                <button
                    type="button"
                    disabled
                    className={secondaryButtonClasses}
                >
                    Disabled
                </button>
            </Row>
            <Row label="inputClasses">
                <input
                    aria-label="Example input"
                    placeholder="Type here"
                    className={inputClasses}
                />
            </Row>
            <Row label="navLinkClasses">
                <a href="#nav" className={navLinkClasses}>
                    Header link
                </a>
            </Row>
            <Row label="navActionClasses">
                <button type="button" className={navActionClasses}>
                    Header action
                </button>
            </Row>
        </div>
    ),
};
