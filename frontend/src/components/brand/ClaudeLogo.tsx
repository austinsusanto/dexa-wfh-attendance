/** Anthropic Claude signature clay colour. */
export const CLAUDE_CLAY = "#D97757";

/**
 * Claude logomark — the radial "burst" of rounded blades, rendered in Claude's
 * signature clay colour. Used on the showcase to credit the Claude tools that
 * assisted this project. `color` defaults to the clay; pass `currentColor` to
 * inherit text colour.
 */
export function ClaudeLogo({
	size = 28,
	color = CLAUDE_CLAY,
	className,
}: {
	size?: number;
	color?: string;
	className?: string;
}) {
	const center = 16;
	// 12 blades radiating from just outside the centre → the burst silhouette.
	const blades = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			fill="none"
			className={className}
			role="img"
			aria-label="Claude"
		>
			{blades.map((deg) => (
				<rect
					key={deg}
					x={center - 1.55}
					y={2.4}
					width={3.1}
					height={11}
					rx={1.55}
					fill={color}
					transform={`rotate(${deg} ${center} ${center})`}
				/>
			))}
		</svg>
	);
}
