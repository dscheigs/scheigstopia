import { redirect } from 'next/navigation';
import { ADD_QUEUE_URL } from '@/lib/addRoutes';

/** The queue lives inside Add Cards; keep old links working. */
export default function LegacyQueuePage() {
    redirect(ADD_QUEUE_URL);
}
