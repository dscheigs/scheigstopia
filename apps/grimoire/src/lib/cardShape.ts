// What "looks like a card" means, as geometry. No OpenCV in here: the finder in
// cardShapeOpenCv.ts turns a frame into candidate quadrilaterals, and this file
// judges one, so the rules can be tested without loading a multi-megabyte wasm.

export interface Point {
    x: number;
    y: number;
}

/** A downscaled RGBA frame, as read from a canvas. */
export interface ShapeFrame {
    data: ArrayLike<number>;
    width: number;
    height: number;
}

export interface ShapeResult {
    /** True when a convex quadrilateral of card size and proportions is there. */
    found: boolean;
    /** The four corners of the best quadrilateral, if any was seen. */
    corners: Point[] | null;
    /** Long side over short side of that quadrilateral (a card is about 1.40). */
    aspect: number | null;
}

export interface ShapeRules {
    /** How far the aspect ratio may be from a card's, as a share of it. */
    aspectTolerance: number;
    /** The quadrilateral must cover at least this share of the frame. */
    minAreaShare: number;
    /** ...and at most this share (more is the frame edge, not a card). */
    maxAreaShare: number;
}

/** What a finder offers. Tests inject a fake; the real one wraps OpenCV. */
export interface CardShapeFinder {
    /** Every convex quadrilateral in the frame, largest first. */
    find(frame: ShapeFrame): Point[][];
}

/** A trading card is 63 mm by 88 mm. */
export const CARD_ASPECT = 88 / 63;

export const NO_SHAPE: ShapeResult = {
    found: false,
    corners: null,
    aspect: null,
};

function distance(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Polygon area by the shoelace formula (always positive). */
export function polygonArea(corners: Point[]): number {
    let sum = 0;
    for (let i = 0; i < corners.length; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % corners.length];
        sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum) / 2;
}

/** True when every turn goes the same way (no dent, no bow-tie). */
export function isConvex(corners: Point[]): boolean {
    let sign = 0;
    for (let i = 0; i < corners.length; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % corners.length];
        const c = corners[(i + 2) % corners.length];
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (cross === 0) continue;
        const turn = cross > 0 ? 1 : -1;
        if (sign !== 0 && turn !== sign) return false;
        sign = turn;
    }
    return sign !== 0;
}

/**
 * Long side over short side, from the mean of each pair of opposite sides, so
 * a card held at a slight angle still reads close to 1.40 in either orientation.
 */
export function quadAspect(corners: Point[]): number {
    const [a, b, c, d] = corners;
    const one = (distance(a, b) + distance(c, d)) / 2;
    const other = (distance(b, c) + distance(d, a)) / 2;
    const short = Math.min(one, other);
    return short === 0 ? 0 : Math.max(one, other) / short;
}

/** Judge one quadrilateral: convex, enough of the frame, card proportions. */
export function judgeQuad(
    corners: Point[] | null,
    frame: { width: number; height: number },
    rules: ShapeRules
): ShapeResult {
    if (!corners || corners.length !== 4) return NO_SHAPE;
    const aspect = quadAspect(corners);
    const share = polygonArea(corners) / (frame.width * frame.height);
    const found =
        isConvex(corners) &&
        share >= rules.minAreaShare &&
        share <= rules.maxAreaShare &&
        Math.abs(aspect - CARD_ASPECT) <= CARD_ASPECT * rules.aspectTolerance;
    return { found, corners, aspect };
}

/**
 * Judge every candidate and report the first that passes. The largest quad is
 * often the frame edge or the table, so the card must not have to be it. With
 * no winner, report the near miss: of the quads of plausible size, the one
 * closest to a card's proportions (edge loops give plenty of thin slivers).
 */
export function judgeQuads(
    candidates: Point[][],
    frame: { width: number; height: number },
    rules: ShapeRules
): ShapeResult {
    const results = candidates.map((quad) => judgeQuad(quad, frame, rules));
    const winner = results.find((result) => result.found);
    if (winner) return winner;
    const area = frame.width * frame.height;
    const plausible = results.filter((result) => {
        const share = polygonArea(result.corners ?? []) / area;
        return share >= rules.minAreaShare && share <= rules.maxAreaShare;
    });
    plausible.sort(
        (a, b) =>
            Math.abs((a.aspect ?? Infinity) - CARD_ASPECT) -
            Math.abs((b.aspect ?? Infinity) - CARD_ASPECT)
    );
    return plausible[0] ?? NO_SHAPE;
}
