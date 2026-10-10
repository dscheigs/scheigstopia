import { redirect } from 'next/navigation';
import QueueView from '@/components/QueueView';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
    const userId = await getUserId();
    if (!userId) {
        redirect('/signin');
    }
    return <QueueView userId={userId} />;
}
