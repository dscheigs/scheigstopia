/**
 * Plain-text collection list, one "<quantity> <name>" line per card.
 * Moxfield and Archidekt both import this format.
 */
export function formatTextExport(
    items: ReadonlyArray<{ name: string; quantity: number }>
): string {
    if (items.length === 0) return '';
    return (
        items.map((item) => `${item.quantity} ${item.name}`).join('\n') + '\n'
    );
}
