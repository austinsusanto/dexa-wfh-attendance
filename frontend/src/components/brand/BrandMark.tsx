import { cn } from '../../lib/cn'

interface BrandMarkProps {
	/** Subtitle after "Dexa" — defaults to "WFH". */
	subtitle?: string
	className?: string
}

/** Compact Dexa logo lockup for top bars (red "D" mark + wordmark). */
export function BrandMark({ subtitle = 'WFH', className }: BrandMarkProps) {
	return (
		<div className={cn('flex items-center gap-2.5', className)}>
			<div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-[15px] font-extrabold text-white">
				D
			</div>
			<span className="whitespace-nowrap text-[15px] font-bold">
				<span className="text-primary">Dexa</span>{' '}
				<span className="font-semibold text-ink">{subtitle}</span>
			</span>
		</div>
	)
}
