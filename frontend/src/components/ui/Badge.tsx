import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant =
	| 'success'
	| 'info'
	| 'danger'
	| 'warning'
	| 'neutral'
	| 'primary'

interface BadgeProps {
	variant?: BadgeVariant
	dot?: boolean
	children: ReactNode
	className?: string
}

const variantClasses: Record<BadgeVariant, { box: string; dot: string }> = {
	success: { box: 'bg-success-bg text-success-text', dot: 'bg-success' },
	info: { box: 'bg-info-bg text-info-text', dot: 'bg-info' },
	danger: { box: 'bg-danger-bg text-danger-text', dot: 'bg-danger' },
	warning: { box: 'bg-warning-bg text-warning-text', dot: 'bg-warning' },
	neutral: { box: 'bg-[#F1F2F4] text-ink-muted', dot: 'bg-ink-muted' },
	primary: { box: 'bg-primary-50 text-primary-700', dot: 'bg-primary' },
}

/** Status pill. Always pairs color with text (and optional dot). */
export function Badge({
	variant = 'neutral',
	dot = false,
	children,
	className,
}: BadgeProps) {
	const styles = variantClasses[variant]
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
				styles.box,
				className,
			)}
		>
			{dot && <span className={cn('size-1.5 rounded-full', styles.dot)} />}
			{children}
		</span>
	)
}
