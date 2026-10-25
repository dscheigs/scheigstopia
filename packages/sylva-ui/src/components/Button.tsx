import type { ComponentProps } from 'react';
import {
    brandButtonClasses,
    buttonClasses,
    secondaryButtonClasses,
} from '../primitives';

export type ButtonVariant = 'primary' | 'secondary' | 'brand';

export type ButtonProps = ComponentProps<'button'> & {
    /** `primary` is the filled button; `secondary` is the outlined one;
     * `brand` is the green call to action. */
    variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
    primary: buttonClasses,
    secondary: secondaryButtonClasses,
    brand: brandButtonClasses,
};

/**
 * The shared button. Its cursor is the same everywhere: a pointer when it can
 * be pressed, and nothing special when it is disabled.
 *
 * `type` defaults to `button`, so a button inside a form does not submit it by
 * accident; pass `type="submit"` where it should. Extra classes go in
 * `className`, for example `min-w-11 px-0` for an icon-only button. For a link
 * that should look like a button, use `buttonClasses`,
 * `secondaryButtonClasses` or `brandButtonClasses` on the anchor.
 */
export default function Button({
    variant = 'primary',
    type = 'button',
    className,
    ...rest
}: ButtonProps) {
    const classes = variantClasses[variant];
    return (
        <button
            type={type}
            className={className ? `${classes} ${className}` : classes}
            {...rest}
        />
    );
}
