import type { ComponentProps, ReactNode } from 'react';
import { inputClasses } from '../primitives';

export type TextFieldProps = ComponentProps<'input'> & {
    /**
     * A node shown inside the field on the left, usually an icon. It is
     * decorative (hidden from assistive tech) and does not take clicks.
     */
    leading?: ReactNode;
    /**
     * A node shown inside the field on the right, such as a clear button or a
     * key hint. It takes clicks, so a button works; mark a purely decorative
     * node `aria-hidden` and `pointer-events-none` yourself.
     */
    trailing?: ReactNode;
};

/**
 * The shared text input. It takes every normal `<input>` prop and the ref.
 * With `leading` or `trailing`, the text is padded so it never runs under the
 * node. `className` goes on the input itself.
 */
export default function TextField({
    leading,
    trailing,
    className,
    ...rest
}: TextFieldProps) {
    const classes = [
        inputClasses,
        leading ? 'pl-11' : '',
        trailing ? 'pr-14' : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');
    const input = <input className={classes} {...rest} />;
    if (!leading && !trailing) return input;
    return (
        <div className="relative">
            {leading ? (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-minimal"
                >
                    {leading}
                </span>
            ) : null}
            {input}
            {trailing ? (
                <span className="absolute inset-y-0 right-1 flex items-center">
                    {trailing}
                </span>
            ) : null}
        </div>
    );
}
