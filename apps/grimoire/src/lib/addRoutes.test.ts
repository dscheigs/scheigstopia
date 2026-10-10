import { describe, expect, it } from 'vitest';
import { isAddRoute, isQueueRoute, videoPlacement } from './addRoutes';

describe('videoPlacement', () => {
    it('shows the video inline when the camera is on and visible', () => {
        expect(videoPlacement(true, true)).toBe('inline');
    });
    it('moves it off-screen, still mounted, on the queue', () => {
        expect(videoPlacement(true, false)).toBe('offscreen');
    });
    it('hides it when the camera is not running', () => {
        expect(videoPlacement(false, true)).toBe('hidden');
        expect(videoPlacement(false, false)).toBe('hidden');
    });
});

describe('isQueueRoute', () => {
    it('matches the queue route with or without a trailing slash', () => {
        expect(isQueueRoute('/add/queue')).toBe(true);
        expect(isQueueRoute('/add/queue/')).toBe(true);
    });
    it('does not match the camera, collection or the old route', () => {
        expect(isQueueRoute('/add')).toBe(false);
        expect(isQueueRoute('/')).toBe(false);
        expect(isQueueRoute('/queue')).toBe(false);
        expect(isQueueRoute(null)).toBe(false);
    });
});

describe('isAddRoute', () => {
    it('matches Add Cards and its children', () => {
        expect(isAddRoute('/add')).toBe(true);
        expect(isAddRoute('/add/queue')).toBe(true);
    });
    it('does not match lookalikes or other screens', () => {
        expect(isAddRoute('/address')).toBe(false);
        expect(isAddRoute('/')).toBe(false);
        expect(isAddRoute(null)).toBe(false);
    });
});
