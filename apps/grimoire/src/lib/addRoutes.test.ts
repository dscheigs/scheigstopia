import { describe, expect, it } from 'vitest';
import { initialAddView, isAddRoute, videoPlacement } from './addRoutes';

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

describe('initialAddView', () => {
    it('opens the queue only when asked to', () => {
        expect(initialAddView('queue')).toBe('queue');
        expect(initialAddView(null)).toBe('camera');
        expect(initialAddView('camera')).toBe('camera');
        expect(initialAddView('other')).toBe('camera');
    });
});

describe('isAddRoute', () => {
    it('matches Add Cards and its children', () => {
        expect(isAddRoute('/add')).toBe(true);
    });
    it('does not match lookalikes or other screens', () => {
        expect(isAddRoute('/address')).toBe(false);
        expect(isAddRoute('/')).toBe(false);
        expect(isAddRoute(null)).toBe(false);
    });
});
