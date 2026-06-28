import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant
	loading?: boolean
	fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
	primary:
		'bg-primary text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300',
	secondary:
		'border border-primary bg-white text-primary hover:bg-primary-50 disabled:opacity-60',
	danger: 'bg-danger text-white hover:opacity-90 disabled:opacity-60',
	ghost: 'bg-transparent text-ink-muted hover:text-primary disabled:opacity-60',
}

/** Brand button with variants and a built-in loading spinner. */
export function Button({
	variant = 'primary',
	loading = false,
	fullWidth = false,
	className,
	children,
	disabled,
	...rest
}: ButtonProps) {
	return (
		<button
			disabled={disabled || loading}
			className={cn(
				'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
				variantClasses[variant],
				fullWidth && 'w-full',
				className,
			)}
			{...rest}
		>
			{loading && <Loader2 className="size-4 animate-spin" />}
			{children}
		</button>
	)
}
