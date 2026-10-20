import { listCollection } from '@/lib/collection';
import { getSql } from '@/lib/db';
import { formatCsvExport, formatTextExport } from '@/lib/export';
import { unauthorized } from '@/lib/http';
import { getUserId } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The collection as a plain-text deck-style list (Moxfield / Archidekt import),
 * or as CSV with `?format=csv`.
 */
export async function GET(request: Request) {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const items = await listCollection(getSql(), userId);
    if (new URL(request.url).searchParams.get('format') === 'csv') {
        return new Response(formatCsvExport(items), {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition':
                    'attachment; filename="grimoire-collection.csv"',
                'Cache-Control': 'no-store',
            },
        });
    }
    return new Response(formatTextExport(items), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition':
                'attachment; filename="grimoire-collection.txt"',
            'Cache-Control': 'no-store',
        },
    });
}
