import Link from 'next/link';
import { auth, signOut } from '@/auth';
import NavLinks from '@/components/NavLinks';
import SignOutForm from '@/components/SignOutForm';

export default async function AppHeader() {
    const session = await auth();
    const userId = session?.user?.id;

    return (
        <header className="sticky top-0 z-50 bg-surface">
            <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
                <Link href="/" className="text-subheading">
                    Grimoire
                </Link>
                {userId ? (
                    <div className="flex items-center gap-1">
                        <NavLinks />
                        <SignOutForm
                            userId={userId}
                            signOutAction={async () => {
                                'use server';
                                await signOut({ redirectTo: '/signin' });
                            }}
                        />
                    </div>
                ) : null}
            </div>
        </header>
    );
}
