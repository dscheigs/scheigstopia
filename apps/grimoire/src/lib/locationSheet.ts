/**
 * A printable contents sheet for one location: its label, the date, then one
 * "<quantity> <name>" line per card in the order given (the contents query
 * already sorts by name, so the sheet matches the page). Plain text, so it can be
 * printed, copied or saved.
 */
export function formatLocationSheet(
    location: { label: string },
    cards: ReadonlyArray<{ name: string; quantity: number }>,
    date: Date
): string {
    const lines = [location.label, date.toISOString().slice(0, 10), ''];
    for (const card of cards) lines.push(`${card.quantity} ${card.name}`);
    if (cards.length === 0) lines.push('No cards.');
    return lines.join('\n') + '\n';
}

/** A file name for the sheet, such as "grimoire-bulk-bag-1.txt". */
export function locationSheetFilename(label: string): string {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `grimoire-${slug || 'location'}.txt`;
}
