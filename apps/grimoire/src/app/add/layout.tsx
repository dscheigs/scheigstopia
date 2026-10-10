import { redirect } from 'next/navigation';
import AddCardsShell from '@/components/AddCardsShell';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Owns the camera, audio/wake-lock session and background worker, so they
 * stay alive while moving between the camera and the queue.
 */
export default async function AddLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const userId = await getUserId();
    if (!userId) {
        redirect('/signin');
    }
    return <AddCardsShell userId={userId}>{children}</AddCardsShell>;
}
