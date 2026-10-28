'use client';

import { useRef, useState, type KeyboardEvent, type FocusEvent } from 'react';
import { Command, SearchIcon, X } from '../icons';
import { isApplePlatform, useShortcutPlatform } from '../platform';
import Button from './Button';
import TextField, { type TextFieldProps } from './TextField';

export type SearchProps = Omit<TextFieldProps, 'leading' | 'trailing'> & {
    /**
     * Shows a clear button while the field has text. The field stays
     * controlled: this should empty the `value`. Escape in the field calls it too.
     */
    onClear?: () => void;
    /**
     * The shortcut that focuses this field, for example `mod+k`, shown as a key
     * hint while the field is empty and not focused. The page wires the key
     * itself (see `useHotkey`). The hint is hidden on touch-only devices.
     */
    shortcut?: string;
};

/** The hint's keys: `mod` is the Command icon on Apple platforms and "Ctrl" elsewhere. */
function KeyHint({ shortcut, apple }: { shortcut: string; apple: boolean }) {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none flex items-center gap-1 pr-3"
        >
            {shortcut.split('+').map((key) => (
                <kbd
                    key={key}
                    className="flex h-6 min-w-6 items-center justify-center rounded-thumb border border-border-minimal px-1.5 font-sans text-caption text-text-minimal"
                >
                    {key.toLowerCase() === 'mod' ? (
                        apple ? (
                            <Command size={12} />
                        ) : (
                            'Ctrl'
                        )
                    ) : (
                        key.toUpperCase()
                    )}
                </kbd>
            ))}
        </span>
    );
}

/** The shortcut as `aria-keyshortcuts` writes it, for example `Meta+K`. */
function keyShortcutsValue(shortcut: string, apple: boolean): string {
    return shortcut
        .split('+')
        .map((key) =>
            key.toLowerCase() === 'mod'
                ? apple
                    ? 'Meta'
                    : 'Control'
                : key.toUpperCase()
        )
        .join('+');
}

/**
 * A `TextField` with a magnifying glass, `type="search"` and autocomplete off.
 * With `onClear` it draws its own clear button (the browser's is hidden), and
 * with `shortcut` it shows a key hint while empty and unfocused.
 */
export default function Search({
    onClear,
    shortcut,
    ref,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest
}: SearchProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [focused, setFocused] = useState(false);
    const platform = useShortcutPlatform();
    const apple = platform === 'apple';
    const hasText = String(rest.value ?? '') !== '';

    const setRefs = (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'Escape' && onClear && hasText) {
            // The native search input would also clear itself; do it once.
            event.preventDefault();
            onClear();
        }
    };

    let trailing = null;
    if (onClear && hasText) {
        trailing = (
            <Button
                variant="tertiary"
                size="icon"
                aria-label="Clear search"
                disabled={rest.disabled}
                onClick={() => {
                    onClear();
                    inputRef.current?.focus();
                }}
            >
                <X size={18} aria-hidden="true" />
            </Button>
        );
    } else if (shortcut && !hasText && !focused && platform) {
        trailing = <KeyHint shortcut={shortcut} apple={apple} />;
    }

    return (
        <TextField
            type="search"
            autoComplete="off"
            leading={<SearchIcon size={18} />}
            trailing={trailing}
            aria-keyshortcuts={
                shortcut && platform
                    ? keyShortcutsValue(shortcut, isApplePlatform())
                    : undefined
            }
            {...rest}
            ref={setRefs}
            onFocus={(event: FocusEvent<HTMLInputElement>) => {
                setFocused(true);
                onFocus?.(event);
            }}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
                setFocused(false);
                onBlur?.(event);
            }}
            onKeyDown={handleKeyDown}
        />
    );
}
