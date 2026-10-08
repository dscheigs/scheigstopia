import Link from 'next/link';
import { auth, signOut } from '@/auth';

export default async function AppHeader() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 bg-surface">
            <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
                <Link href="/" className="text-subheading">
                    Grimoire
                </Link>
                {session?.user ? (
                    <form
                        action={async () => {
                            'use server';
                            await signOut({ redirectTo: '/signin' });
                        }}
                    >
                        <button
                            type="submit"
                            className="min-h-11 rounded-md px-3 text-body font-medium transition-colors hover:bg-surface-hover"
                        >
                            Sign out
                        </button>
                    </form>
                ) : null}
            </div>
        </header>
    );
}
