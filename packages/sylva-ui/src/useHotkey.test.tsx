import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHotkey } from './useHotkey';

function Probe({ onKey }: { onKey: (event: KeyboardEvent) => void }) {
    useHotkey('mod+k', onKey);
    return <input aria-label="field" />;
}

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('useHotkey', () => {
    it('fires on Ctrl+K off Apple platforms, with the default prevented', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const onKey = vi.fn();
        render(<Probe onKey={onKey} />);
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            cancelable: true,
        });
        window.dispatchEvent(event);
        expect(onKey).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });

    it('fires on Cmd+K on Apple platforms, and ignores Ctrl+K there', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
        const onKey = vi.fn();
        render(<Probe onKey={onKey} />);
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(onKey).not.toHaveBeenCalled();
        fireEvent.keyDown(window, { key: 'k', metaKey: true });
        expect(onKey).toHaveBeenCalledTimes(1);
    });

    it('ignores a bare K, other keys and extra modifiers', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const onKey = vi.fn();
        render(<Probe onKey={onKey} />);
        fireEvent.keyDown(window, { key: 'k' });
        fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true, shiftKey: true });
        expect(onKey).not.toHaveBeenCalled();
    });

    it('works while a field has focus', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const onKey = vi.fn();
        const { getByLabelText } = render(<Probe onKey={onKey} />);
        const field = getByLabelText('field');
        field.focus();
        fireEvent.keyDown(field, { key: 'k', ctrlKey: true });
        expect(onKey).toHaveBeenCalledTimes(1);
    });

    it('does nothing and leaves the browser alone while a modal dialog is open', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const onKey = vi.fn();
        render(<Probe onKey={onKey} />);
        const dialog = document.createElement('dialog');
        dialog.setAttribute('open', '');
        // jsdom has no top layer, so say the dialog is modal ourselves.
        vi.spyOn(dialog, 'matches').mockImplementation(
            (selector) => selector === ':modal'
        );
        document.body.append(dialog);
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            cancelable: true,
        });
        window.dispatchEvent(event);
        expect(onKey).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    it('still fires when the open dialog is not modal', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const onKey = vi.fn();
        render(<Probe onKey={onKey} />);
        const dialog = document.createElement('dialog');
        dialog.setAttribute('open', '');
        document.body.append(dialog);
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(onKey).toHaveBeenCalledTimes(1);
    });

    it('removes its listener on unmount', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const onKey = vi.fn();
        const { unmount } = render(<Probe onKey={onKey} />);
        unmount();
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(onKey).not.toHaveBeenCalled();
    });

    it('uses the latest handler without re-subscribing', () => {
        vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(<Probe onKey={first} />);
        rerender(<Probe onKey={second} />);
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});
