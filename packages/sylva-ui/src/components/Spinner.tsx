import type { ComponentProps } from 'react';

const spinnerSizeClasses = {
    sm: 'size-4 border-2',
    md: 'size-6 border-2',
    lg: 'size-10 border-4',
} as const;

export type SpinnerSize = keyof typeof spinnerSizeClasses;

export type SpinnerProps = Omit<ComponentProps<'span'>, 'children'> & {
    /** `sm` fits inside a button or a line of text; `lg` fills an empty panel. */
    size?: SpinnerSize;
    /** The text a screen reader announces. */
    label?: string;
};

/**
 * A neutral loading ring. It takes its color from the surrounding text
 * (`currentColor`, with a faded track), so it reads in light and dark mode and
 * inside a `Button` without a theme-specific class. Users who prefer reduced
 * motion get a slow pulse instead of a spin.
 *
 * It is `role="status"` with a visually hidden label (default "Loading").
 * It is an `inline-block`, so `mx-auto` does not center it: put it in a
 * `flex justify-center` parent instead.
 */
export default function Spinner({
    size = 'md',
    label = 'Loading',
    className,
    ...rest
}: SpinnerProps) {
    return (
        <span
            role="status"
            className={`inline-block shrink-0 ${className ?? ''}`.trim()}
            {...rest}
        >
            <span
                aria-hidden="true"
                className={`block rounded-full border-current/25 border-t-current motion-safe:animate-spin motion-reduce:animate-pulse ${spinnerSizeClasses[size]}`}
            />
            <span className="sr-only">{label}</span>
        </span>
    );
}
