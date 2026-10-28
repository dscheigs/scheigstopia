import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Search from './Search';

function mockPlatform(platform: string, touchOnly = false) {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: touchOnly && query === '(hover: none)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error jsdom has no matchMedia; remove the mock again
    delete window.matchMedia;
});

function Controlled({
    initial = '',
    onClear,
    shortcut,
}: {
    initial?: string;
    onClear?: () => void;
    shortcut?: string;
}) {
    const [value, setValue] = useState(initial);
    return (
        <Search
            aria-label="Find"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onClear={
                onClear
                    ? () => {
                          onClear();
                          setValue('');
                      }
                    : undefined
            }
            shortcut={shortcut}
        />
    );
}

describe('Search clear button', () => {
    it('is hidden while the field is empty, and without onClear', () => {
        const { rerender } = render(<Controlled onClear={() => {}} />);
        expect(
            screen.queryByRole('button', { name: 'Clear search' })
        ).toBeNull();
        rerender(<Controlled initial="bolt" />);
        expect(
            screen.queryByRole('button', { name: 'Clear search' })
        ).toBeNull();
    });

    it('clears the field on click and puts focus back in it', async () => {
        const onClear = vi.fn();
        render(<Controlled initial="bolt" onClear={onClear} />);
        const button = screen.getByRole('button', { name: 'Clear search' });
        await userEvent.click(button);
        const input = screen.getByRole('searchbox', { name: 'Find' });
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('');
        expect(input).toHaveFocus();
        expect(
            screen.queryByRole('button', { name: 'Clear search' })
        ).toBeNull();
    });

    it('draws the clear button without a border', () => {
        render(<Controlled initial="bolt" onClear={() => {}} />);
        const button = screen.getByRole('button', { name: 'Clear search' });
        expect(button.className).not.toContain('border');
    });

    it('clears on Escape when there is text, and not when empty', async () => {
        const onClear = vi.fn();
        render(<Controlled initial="bolt" onClear={onClear} />);
        const input = screen.getByRole('searchbox', { name: 'Find' });
        input.focus();
        await userEvent.keyboard('{Escape}');
        expect(onClear).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('still forwards the ref, key and focus handlers', async () => {
        const onKeyDown = vi.fn();
        const onFocus = vi.fn();
        const ref = { current: null as HTMLInputElement | null };
        render(
            <Search
                aria-label="Find"
                ref={ref}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
            />
        );
        await userEvent.click(screen.getByRole('searchbox'));
        await userEvent.keyboard('a');
        expect(ref.current).toBe(screen.getByRole('searchbox'));
        expect(onFocus).toHaveBeenCalled();
        expect(onKeyDown).toHaveBeenCalled();
    });
});

describe('Search shortcut hint', () => {
    it('shows Ctrl and K on a non-Apple platform', () => {
        mockPlatform('Win32');
        render(<Controlled shortcut="mod+k" />);
        const input = screen.getByRole('searchbox', { name: 'Find' });
        expect(screen.getByText('Ctrl')).toBeInTheDocument();
        expect(screen.getByText('K')).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-keyshortcuts', 'Control+K');
    });

    it('shows the Command icon and K on Apple platforms', () => {
        mockPlatform('MacIntel');
        const { container } = render(<Controlled shortcut="mod+k" />);
        expect(screen.queryByText('Ctrl')).toBeNull();
        expect(screen.getByText('K')).toBeInTheDocument();
        // The search icon plus the Command icon.
        expect(container.querySelectorAll('svg')).toHaveLength(2);
        expect(screen.getByRole('searchbox')).toHaveAttribute(
            'aria-keyshortcuts',
            'Meta+K'
        );
    });

    it('gives every key the same height and minimum width', () => {
        mockPlatform('MacIntel');
        const { container } = render(<Controlled shortcut="mod+k" />);
        const keys = [...container.querySelectorAll('kbd')];
        expect(keys).toHaveLength(2);
        for (const key of keys) {
            const classes = key.className.split(' ');
            expect(classes).toContain('h-6');
            expect(classes).toContain('min-w-6');
        }
    });

    it('is decorative to assistive tech', () => {
        mockPlatform('Win32');
        render(<Controlled shortcut="mod+k" />);
        expect(screen.getByText('K').closest('[aria-hidden]')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('hides while focused and shows again on blur', async () => {
        mockPlatform('Win32');
        render(<Controlled shortcut="mod+k" />);
        await userEvent.click(screen.getByRole('searchbox'));
        expect(screen.queryByText('Ctrl')).toBeNull();
        await userEvent.tab();
        expect(screen.getByText('Ctrl')).toBeInTheDocument();
    });

    it('hides when the field has text', () => {
        mockPlatform('Win32');
        render(<Controlled initial="bolt" shortcut="mod+k" />);
        expect(screen.queryByText('Ctrl')).toBeNull();
    });

    it('is not shown on touch-only devices', () => {
        mockPlatform('iPhone', true);
        render(<Controlled shortcut="mod+k" />);
        expect(screen.queryByText('K')).toBeNull();
        expect(screen.getByRole('searchbox')).not.toHaveAttribute(
            'aria-keyshortcuts'
        );
    });

    it('is not shown without a shortcut', () => {
        mockPlatform('Win32');
        render(<Controlled />);
        expect(screen.queryByText('Ctrl')).toBeNull();
    });
});
