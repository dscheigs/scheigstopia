import type { ComponentProps } from 'react';

/** Stands in for next/link in Storybook, which has no Next router. */
export default function Link({
    href,
    ...rest
}: Omit<ComponentProps<'a'>, 'href'> & { href: string }) {
    return <a href={href} {...rest} />;
}
