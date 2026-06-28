/** Temporary placeholder until each page is implemented. */
export function PagePlaceholder({ title }: { title: string }) {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
			<h1 className="text-2xl font-bold text-ink-strong">{title}</h1>
			<p className="text-ink-muted">
				Halaman ini akan diimplementasikan berikutnya.
			</p>
		</div>
	)
}