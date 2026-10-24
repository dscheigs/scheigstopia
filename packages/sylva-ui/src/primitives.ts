// Class strings shared by more than one component.

export const buttonClasses =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-neutral-800 px-3 text-body font-medium text-neutral-100 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300';

export const secondaryButtonClasses =
    'inline-flex min-h-11 items-center justify-center rounded-lg border border-border-minimal px-3 text-body transition-colors hover:bg-surface-minimal-hover disabled:cursor-not-allowed disabled:opacity-50';

export const inputClasses =
    'w-full rounded-lg border border-border-minimal bg-surface-minimal px-4 py-3 text-body placeholder:text-text-minimal';

/** A header link. Shared by the desktop nav links and any button that sits among them. */
export const navLinkClasses =
    'block px-4 py-4 text-body font-medium transition-colors';

/**
 * A button among the header links, such as sign-out. One element serves both
 * menus: a mobile menu entry, and from md up a header link like the others.
 */
export const navActionClasses =
    'block w-full cursor-pointer px-3 py-2 text-left text-body transition-colors hover:text-foreground md:w-auto md:px-4 md:py-4 md:font-medium';
