import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
	leftIcon?: ReactNode
	/** Rendered at the right edge inside the field (e.g. password toggle). */
	rightSlot?: ReactNode
}

/** Labeled input with optional left icon, right slot, and error text. */
export function TextField({
	label,
	error,
	leftIcon,
	rightSlot,
	className,
	id,
	...rest
}: TextFieldProps) {
	return (
		<div>
			{label && (
				<label
					htmlFor={id}
					className="mb-1.5 block text-[13px] font-semibold text-ink"
				>
					{label}
				</label>
			)}
			<div className="relative">
				{leftIcon && (
					<span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
						{leftIcon}
					</span>
				)}
				<input
					id={id}
					className={cn(
						'h-11 w-full rounded-lg border border-line bg-white text-sm text-ink-strong outline-none transition placeholder:text-ink-muted',
						'focus:border-primary focus:ring-[3px] focus:ring-primary/15',
						leftIcon ? 'pl-10' : 'pl-3.5',
						rightSlot ? 'pr-11' : 'pr-3.5',
						error &&
							'border-danger focus:border-danger focus:ring-danger/15',
						className,
					)}
					{...rest}
				/>
				{rightSlot && (
					<span className="absolute right-2 top-1/2 -translate-y-1/2">
						{rightSlot}
					</span>
				)}
			</div>
			{error && <p className="mt-1.5 text-[11.5px] text-danger">{error}</p>}
		</div>
	)
}
