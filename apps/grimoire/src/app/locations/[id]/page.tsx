import { redirect } from 'next/navigation';
import LocationDetail from '@/components/LocationDetail';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function LocationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    if (!(await getUserId())) {
        redirect('/signin');
    }
    const { id } = await params;
    return <LocationDetail id={id} />;
}
