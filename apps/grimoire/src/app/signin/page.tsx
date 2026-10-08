import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

function describeError(error: string | undefined): string | null {
    if (!error) return null;
    if (error === 'AccessDenied') {
        return "That GitHub account isn't allowed to use Grimoire.";
    }
    return 'Sign-in failed. Please try again.';
}

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    if (await getUserId()) {
        redirect('/');
    }
    const { error } = await searchParams;
    const message = describeError(error);

    return (
        <div className="mx-auto max-w-md space-y-6 px-4 py-16">
            <h1 className="text-page-title">Grimoire</h1>
            <p className="text-lead text-text-minimal">
                Sign in to see your collection.
            </p>
            {message && (
                <p role="alert" className="text-body text-error">
                    {message}
                </p>
            )}
            <form
                action={async () => {
                    'use server';
                    await signIn('github', { redirectTo: '/' });
                }}
            >
                <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-muted px-5 text-body font-medium text-neutral-50 transition-colors hover:bg-accent-muted-hover"
                >
                    Sign in with GitHub
                </button>
            </form>
        </div>
    );
}
