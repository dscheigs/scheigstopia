import { auth, signOut } from '@/auth';
import { SIGN_IN_PATH } from '@/lib/sessionNotice';
import GrimoireHeader from '@/components/GrimoireHeader';
import SignOutForm from '@/components/SignOutForm';

export default async function AppHeader() {
    const session = await auth();
    const userId = session?.user?.id;

    return (
        <GrimoireHeader
            signedIn={Boolean(userId)}
            signOut={
                userId ? (
                    <SignOutForm
                        userId={userId}
                        signOutAction={async () => {
                            'use server';
                            await signOut({
                                redirectTo: SIGN_IN_PATH,
                            });
                        }}
                    />
                ) : null
            }
        />
    );
}
