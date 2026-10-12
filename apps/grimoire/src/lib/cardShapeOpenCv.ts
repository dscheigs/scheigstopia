// The real card finder, on OpenCV.js. Only ever loaded through a dynamic
// import (see useCardScanner), so the multi-megabyte wasm stays out of the main
// bundle and is not downloaded unless the rectangle check is switched on.

import type { CardShapeFinder, Point, ShapeFrame } from '@/lib/cardShape';

type OpenCv = typeof import('@techstark/opencv-js');

/** Wait for the wasm runtime; the package exports a module, a promise or a bare cv. */
async function loadOpenCv(): Promise<OpenCv> {
    const imported = (await import('@techstark/opencv-js')) as unknown as {
        default?: unknown;
    };
    let cv = (imported.default ?? imported) as OpenCv | Promise<OpenCv>;
    if (cv instanceof Promise) cv = await cv;
    if (!cv.Mat) {
        const pending = cv as OpenCv & { onRuntimeInitialized?: () => void };
        await new Promise<void>((resolve) => {
            pending.onRuntimeInitialized = resolve;
        });
    }
    return cv;
}

/** Corner polygons tighter than this (share of the perimeter) count as straight. */
const APPROX_EPSILON = 0.02;
const CANNY_LOW = 50;
const CANNY_HIGH = 150;

export async function loadCardShapeFinder(): Promise<CardShapeFinder> {
    const cv = await loadOpenCv();

    return {
        find(frame: ShapeFrame): Point[] | null {
            // Everything OpenCV allocates lives in wasm memory and must be freed.
            const owned: { delete(): void }[] = [];
            const keep = <T extends { delete(): void }>(mat: T): T => {
                owned.push(mat);
                return mat;
            };
            try {
                const rgba = keep(
                    cv.matFromArray(
                        frame.height,
                        frame.width,
                        cv.CV_8UC4,
                        Array.from(frame.data)
                    )
                );
                const gray = keep(new cv.Mat());
                cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
                const edges = keep(new cv.Mat());
                cv.Canny(gray, edges, CANNY_LOW, CANNY_HIGH);
                // Close small gaps so a card's outline is one contour.
                const kernel = keep(
                    cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
                );
                cv.dilate(edges, edges, kernel);

                const contours = keep(new cv.MatVector());
                const hierarchy = keep(new cv.Mat());
                cv.findContours(
                    edges,
                    contours,
                    hierarchy,
                    cv.RETR_LIST,
                    cv.CHAIN_APPROX_SIMPLE
                );

                let best: Point[] | null = null;
                let bestArea = 0;
                for (let i = 0; i < contours.size(); i++) {
                    const contour = contours.get(i);
                    const approx = new cv.Mat();
                    try {
                        const perimeter = cv.arcLength(contour, true);
                        cv.approxPolyDP(
                            contour,
                            approx,
                            APPROX_EPSILON * perimeter,
                            true
                        );
                        if (approx.rows !== 4 || !cv.isContourConvex(approx)) {
                            continue;
                        }
                        const area = cv.contourArea(approx);
                        if (area <= bestArea) continue;
                        bestArea = area;
                        best = [0, 1, 2, 3].map((n) => ({
                            x: approx.data32S[n * 2],
                            y: approx.data32S[n * 2 + 1],
                        }));
                    } finally {
                        contour.delete();
                        approx.delete();
                    }
                }
                return best;
            } finally {
                owned.forEach((mat) => mat.delete());
            }
        },
    };
}
