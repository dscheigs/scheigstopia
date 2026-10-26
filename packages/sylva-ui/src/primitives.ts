// Class strings shared by more than one component.

/**
 * Every button shares this cursor: a pointer while it can be pressed. A disabled
 * button gets no cursor of its own (the browser's default arrow). Tailwind v4 no
 * longer gives buttons a pointer cursor, so it has to be said here. `Button` and
 * the class strings below both include it.
 */
export const buttonCursorClasses = 'enabled:cursor-pointer';

/** What every button shares: shape, size floor, text, disabled look and cursor. */
export const buttonBaseClasses = `inline-flex min-h-11 items-center justify-center rounded-button text-body transition-colors disabled:opacity-50 ${buttonCursorClasses}`;

/** Horizontal size: text buttons get padding, icon-only ones are a square (a circle, with the radius). */
export const buttonSizeClasses = {
    default: 'min-w-11 px-3',
    icon: 'size-11 p-0',
};

/** The color part of each variant. `Button` and the anchor class strings below share it. */
export const buttonVariantClasses = {
    primary:
        'bg-neutral-800 font-medium text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300',
    secondary: 'border border-border-minimal hover:bg-surface-minimal-hover',
    /** The green call to action: sign-in and the like. Use sparingly, one per screen. */
    brand: 'bg-accent-muted font-medium text-neutral-50 hover:bg-accent-muted-hover',
    /** The red button for actions that delete or lose data, such as Remove. */
    destructive:
        'bg-destructive font-medium text-neutral-50 hover:bg-destructive-hover',
};

// For anchors that look like buttons; use `Button` for real buttons.
export const buttonClasses = `${buttonBaseClasses} ${buttonSizeClasses.default} ${buttonVariantClasses.primary}`;

export const secondaryButtonClasses = `${buttonBaseClasses} ${buttonSizeClasses.default} ${buttonVariantClasses.secondary}`;

export const brandButtonClasses = `${buttonBaseClasses} ${buttonSizeClasses.default} ${buttonVariantClasses.brand}`;

export const inputClasses =
    'w-full rounded-control border border-border-minimal bg-surface-minimal px-4 py-3 text-input placeholder:text-text-minimal';

/** A header link. Shared by the desktop nav links and any button that sits among them. */
export const navLinkClasses =
    'block px-4 py-4 text-body font-medium transition-colors';

/**
 * A button among the header links, such as sign-out. One element serves both
 * menus: a mobile menu entry, and from md up a header link like the others.
 */
export const navActionClasses =
    'block w-full cursor-pointer px-3 py-2 text-left text-body transition-colors hover:text-foreground md:w-auto md:px-4 md:py-4 md:font-medium';
