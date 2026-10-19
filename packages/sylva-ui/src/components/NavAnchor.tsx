import Link from 'next/link';
import type { ComponentProps } from 'react';
import { linkKind, type NavItem } from '../navItems';

type NavAnchorProps = Omit<ComponentProps<'a'>, 'href'> &
    Pick<NavItem, 'href' | 'sameApp'>;

/** A nav link that is a <Link> inside the app and a plain <a> otherwise. */
export default function NavAnchor({ sameApp, href, ...rest }: NavAnchorProps) {
    return linkKind({ sameApp }) === 'link' ? (
        <Link href={href} {...rest} />
    ) : (
        <a href={href} {...rest} />
    );
}
