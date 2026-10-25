import type { ComponentProps } from 'react';
import {
    buttonBaseClasses,
    buttonSizeClasses,
    buttonVariantClasses,
} from '../primitives';

export type ButtonVariant = keyof typeof buttonVariantClasses;
export type ButtonSize = keyof typeof buttonSizeClasses;

export type ButtonProps = ComponentProps<'button'> & {
    /**
     * `primary` is the filled button; `secondary` is the outlined one; `brand`
     * is the green call to action.
     */
    variant?: ButtonVariant;
    /** `icon` makes a square (a circle, with the button radius) for one icon. */
    size?: ButtonSize;
};

/**
 * The shared button. Every button is a pill (a circle when `size="icon"`), and
 * its cursor is the same everywhere: a pointer when it can be pressed, and
 * nothing special when it is disabled.
 *
 * `type` defaults to `button`, so a button inside a form does not submit it by
 * accident; pass `type="submit"` where it should. For an icon-only button use
 * `size="icon"` and an `aria-label`. Extra classes go in `className`, for
 * example to position it. For a link that should look like a button, use
 * `buttonClasses`, `secondaryButtonClasses` or `brandButtonClasses` on the anchor.
 */
export default function Button({
    variant = 'primary',
    size = 'default',
    type = 'button',
    className,
    ...rest
}: ButtonProps) {
    const classes = `${buttonBaseClasses} ${buttonSizeClasses[size]} ${buttonVariantClasses[variant]}`;
    return (
        <button
            type={type}
            className={className ? `${classes} ${className}` : classes}
            {...rest}
        />
    );
}
