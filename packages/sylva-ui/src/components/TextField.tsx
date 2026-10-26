import type { ComponentProps, ReactNode } from 'react';
import { inputClasses } from '../primitives';

export type TextFieldProps = ComponentProps<'input'> & {
    /**
     * A node shown inside the field on the left, usually an icon. It is
     * decorative (hidden from assistive tech) and does not take clicks.
     */
    leading?: ReactNode;
};

/**
 * The shared text input. It takes every normal `<input>` prop and the ref.
 * With `leading`, the text is padded so it never runs under the icon.
 * `className` goes on the input itself.
 */
export default function TextField({
    leading,
    className,
    ...rest
}: TextFieldProps) {
    const classes = leading ? `${inputClasses} pl-11` : inputClasses;
    const input = (
        <input
            className={className ? `${classes} ${className}` : classes}
            {...rest}
        />
    );
    if (!leading) return input;
    return (
        <div className="relative">
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-minimal"
            >
                {leading}
            </span>
            {input}
        </div>
    );
}
