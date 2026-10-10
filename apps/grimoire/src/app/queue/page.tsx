import { redirect } from 'next/navigation';
import { ADD_QUEUE_PATH } from '@/lib/addRoutes';

/** The queue moved under Add Cards; keep old links working. */
export default function LegacyQueuePage() {
    redirect(ADD_QUEUE_PATH);
}
