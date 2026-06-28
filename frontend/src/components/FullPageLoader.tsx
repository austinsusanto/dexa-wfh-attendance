import { Loader2 } from 'lucide-react'

/** Centered full-viewport loading spinner (session restore, route guards). */
export function FullPageLoader() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-canvas">
			<Loader2 className="size-8 animate-spin text-primary" />
		</div>
	)
}
