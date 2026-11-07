import { redirect } from 'next/navigation';
import NeedsAttention from '@/components/NeedsAttention';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AttentionPage() {
    if (!(await getUserId())) {
        redirect('/signin');
    }
    return <NeedsAttention />;
}
