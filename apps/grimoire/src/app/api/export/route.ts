import { listCollection } from '@/lib/collection';
import { getSql } from '@/lib/db';
import { formatTextExport } from '@/lib/export';
import { unauthorized } from '@/lib/http';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** The collection as a plain-text deck-style list (Moxfield / Archidekt import). */
export async function GET() {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const items = await listCollection(getSql(), userId);
    return new Response(formatTextExport(items), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition':
                'attachment; filename="grimoire-collection.txt"',
            'Cache-Control': 'no-store',
        },
    });
}
