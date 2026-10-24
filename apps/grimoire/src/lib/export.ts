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

/** Quotes a CSV field when it holds a comma, quote or line break. */
function csvField(value: string): string {
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * The collection as CSV with a header row. Starts with a byte order mark so
 * Excel reads names like "Lim-Dûl" as UTF-8.
 */
export function formatCsvExport(
    items: ReadonlyArray<{ name: string; quantity: number; oracleId: string }>
): string {
    const rows = items.map((item) =>
        [csvField(item.name), String(item.quantity), item.oracleId].join(',')
    );
    return (
        '\uFEFF' + ['Name,Quantity,Oracle ID', ...rows].join('\r\n') + '\r\n'
    );
}
