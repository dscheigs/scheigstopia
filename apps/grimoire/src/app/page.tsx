import { redirect } from 'next/navigation';
import CollectionView from '@/components/CollectionView';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
    if (!(await getUserId())) {
        redirect('/signin');
    }
    return <CollectionView />;
}
