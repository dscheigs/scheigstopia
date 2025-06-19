interface GnomeIconProps {
    size?: number;
    className?: string;
}

export default function GnomeIcon({
    size = 24,
    className = '',
}: GnomeIconProps) {
    return (
        <svg
            width={size}
            height={size * (23 / 14)} // Maintain aspect ratio
            viewBox="0 0 14 23"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ imageRendering: 'pixelated', display: 'block' }}
            shapeRendering="crispEdges"
        >
            {/* Hat area (red/orange) */}
            <rect x="6" y="1" width="2" height="1" fill="#463b32" />
            <rect x="6" y="2" width="1" height="1" fill="#932911" />
            <rect x="7" y="2" width="1" height="1" fill="#463b32" />
            <rect x="5" y="3" width="1" height="1" fill="#463b32" />
            <rect x="6" y="3" width="2" height="1" fill="#b13c1c" />
            <rect x="8" y="3" width="1" height="1" fill="#463b32" />
            <rect x="5" y="4" width="1" height="1" fill="#463b32" />
            <rect x="6" y="4" width="2" height="1" fill="#b13c1c" />
            <rect x="8" y="4" width="1" height="1" fill="#463b32" />
            <rect x="4" y="5" width="1" height="1" fill="#463b32" />
            <rect x="5" y="5" width="1" height="1" fill="#932911" />
            <rect x="6" y="5" width="3" height="1" fill="#b13c1c" />
            <rect x="9" y="5" width="1" height="1" fill="#463b32" />
            <rect x="4" y="6" width="1" height="1" fill="#463b32" />
            <rect x="5" y="6" width="4" height="1" fill="#b13c1c" />
            <rect x="9" y="6" width="1" height="1" fill="#463b32" />
            <rect x="4" y="7" width="1" height="1" fill="#463b32" />
            <rect x="5" y="7" width="4" height="1" fill="#b13c1c" />
            <rect x="9" y="7" width="1" height="1" fill="#463b32" />
            <rect x="3" y="8" width="1" height="1" fill="#463b32" />
            <rect x="4" y="8" width="1" height="1" fill="#932911" />
            <rect x="5" y="8" width="4" height="1" fill="#b13c1c" />
            <rect x="9" y="8" width="1" height="1" fill="#932911" />
            <rect x="10" y="8" width="1" height="1" fill="#463b32" />
            <rect x="3" y="9" width="1" height="1" fill="#463b32" />
            <rect x="4" y="9" width="6" height="1" fill="#b13c1c" />
            <rect x="10" y="9" width="1" height="1" fill="#463b32" />
            <rect x="3" y="10" width="1" height="1" fill="#463b32" />
            <rect x="4" y="10" width="6" height="1" fill="#b13c1c" />
            <rect x="10" y="10" width="1" height="1" fill="#463b32" />
            {/* Face area */}
            <rect x="2" y="11" width="1" height="1" fill="#463b32" />
            <rect x="3" y="11" width="1" height="1" fill="#cfbb95" />
            <rect x="4" y="11" width="6" height="1" fill="#eba966" />
            <rect x="10" y="11" width="1" height="1" fill="#cfbb95" />
            <rect x="11" y="11" width="1" height="1" fill="#463b32" />
            <rect x="2" y="12" width="1" height="1" fill="#463b32" />
            <rect x="3" y="12" width="1" height="1" fill="#e6d4b0" />
            <rect x="4" y="12" width="1" height="1" fill=" #f6e9d3" />
            <rect x="5" y="12" width="1" height="1" fill="#f2e3c9" />
            <rect x="6" y="12" width="2" height="1" fill=" #e6944f" />
            <rect x="8" y="12" width="1" height="1" fill="#f2e3c9" />
            <rect x="9" y="12" width="1" height="1" fill=" #f6e9d3" />
            <rect x="10" y="12" width="1" height="1" fill="#e6d4b0" />
            <rect x="11" y="12" width="1" height="1" fill="#463b32" />
            <rect x="1" y="13" width="1" height="1" fill="#463b32" />
            <rect x="2" y="13" width="1" height="1" fill="#e6d4b0" />
            <rect x="3" y="13" width="2" height="1" fill=" #f6e9d3" />
            <rect x="5" y="13" width="1" height="1" fill="#f2e3c9" />
            <rect x="6" y="13" width="5" height="1" fill=" #f6e9d3" />
            <rect x="11" y="13" width="1" height="1" fill="#e6d4b0" />
            <rect x="12" y="13" width="1" height="1" fill="#463b32" />
            <rect x="1" y="14" width="1" height="1" fill="#463b32" />
            <rect x="2" y="14" width="1" height="1" fill="#e6d4b0" />
            <rect x="3" y="14" width="8" height="1" fill=" #f6e9d3" />
            <rect x="11" y="14" width="1" height="1" fill="#e6d4b0" />
            <rect x="12" y="14" width="1" height="1" fill="#463b32" />
            <rect x="0" y="15" width="1" height="1" fill="#463b32" />
            <rect x="1" y="15" width="1" height="1" fill="#586b6f" />
            <rect x="2" y="15" width="1" height="1" fill="#e6d4b0" />
            <rect x="3" y="15" width="8" height="1" fill=" #f6e9d3" />
            <rect x="11" y="15" width="1" height="1" fill="#eedfc5" />
            <rect x="12" y="15" width="1" height="1" fill="#586b6f" />
            <rect x="13" y="15" width="1" height="1" fill="#463b32" />
            <rect x="0" y="16" width="1" height="1" fill="#463b32" />
            <rect x="1" y="16" width="2" height="1" fill="#586b6f" />
            <rect x="3" y="16" width="1" height="1" fill="#e6d4b0" />
            <rect x="4" y="16" width="6" height="1" fill=" #f6e9d3" />
            <rect x="10" y="16" width="1" height="1" fill="#eedfc5" />
            <rect x="11" y="16" width="2" height="1" fill="#586b6f" />
            <rect x="13" y="16" width="1" height="1" fill="#463b32" />
            <rect x="0" y="17" width="1" height="1" fill="#463b32" />
            <rect x="1" y="17" width="1" height="1" fill="  #647376" />
            <rect x="2" y="17" width="1" height="1" fill="#586b6f" />
            <rect x="3" y="17" width="2" height="1" fill="  #647376" />
            <rect x="5" y="17" width="1" height="1" fill="#e6d4b0" />
            <rect x="6" y="17" width="2" height="1" fill=" #f6e9d3" />
            <rect x="8" y="17" width="1" height="1" fill="#e6d4b0" />
            <rect x="9" y="17" width="2" height="1" fill="  #647376" />
            <rect x="11" y="17" width="1" height="1" fill="#586b6f" />
            <rect x="12" y="17" width="1" height="1" fill="  #647376" />
            <rect x="13" y="17" width="1" height="1" fill="#463b32" />
            <rect x="0" y="18" width="1" height="1" fill="#463b32" />
            <rect x="1" y="18" width="1" height="1" fill="#eba966" />
            <rect x="2" y="18" width="1" height="1" fill="#586b6f" />
            <rect x="3" y="18" width="8" height="1" fill="  #647376" />
            <rect x="11" y="18" width="1" height="1" fill="#586b6f" />
            <rect x="12" y="18" width="1" height="1" fill="#eba966" />
            <rect x="13" y="18" width="1" height="1" fill="#463b32" />
            <rect x="1" y="19" width="1" height="1" fill="#463b32" />
            <rect x="2" y="19" width="1" height="1" fill="#586b6f" />
            <rect x="3" y="19" width="8" height="1" fill="  #647376" />
            <rect x="11" y="19" width="1" height="1" fill="#586b6f" />
            <rect x="12" y="19" width="1" height="1" fill="#463b32" />
            <rect x="2" y="20" width="1" height="1" fill="#463b32" />
            <rect x="3" y="20" width="8" height="1" fill="#4b5b23" />
            <rect x="11" y="20" width="1" height="1" fill="#463b32" />
            <rect x="3" y="21" width="2" height="1" fill="#54473d" />
            <rect x="5" y="21" width="1" height="1" fill="#463b32" />
            <rect x="8" y="21" width="1" height="1" fill="#463b32" />
            <rect x="9" y="21" width="2" height="1" fill="#54473d" />
            <rect x="2" y="22" width="4" height="1" fill="#463b32" />
            <rect x="8" y="22" width="4" height="1" fill="#463b32" />
        </svg>
    );
}
