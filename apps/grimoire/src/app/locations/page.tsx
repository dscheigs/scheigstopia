import { redirect } from 'next/navigation';
import LocationsView from '@/components/LocationsView';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
    if (!(await getUserId())) {
        redirect('/signin');
    }
    return <LocationsView />;
}
