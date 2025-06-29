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
        <div
            className={`flex bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1 ${className}`}
        >
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`flex-1 px-4 py-2 text-lead font-medium rounded-md transition-all duration-200 cursor-pointer ${
                        value === option
                            ? 'bg-neutral-50 dark:bg-neutral-900 text-foreground shadow-sm'
                            : 'text-text-minimal hover:text-foreground'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
