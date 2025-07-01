interface SegmentedControlProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export default function SegmentedControl({
    options,
    value,
    onChange,
    className = '',
}: SegmentedControlProps) {
    return (
        <div className={`flex rounded-2xl p-1 bg-surface-minimal ${className}`}>
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`flex-1 px-4 py-2 text-lead font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                        value === option
                            ? 'bg-accent-muted text-neutral-50 shadow-sm'
                            : 'text-text-minimal hover:text-foreground'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
