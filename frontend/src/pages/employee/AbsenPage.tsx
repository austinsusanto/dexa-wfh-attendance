import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ChevronDown } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PhotoCapture } from '../../components/PhotoCapture'
import { cn } from '../../lib/cn'
import {
	formatClock,
	formatDateLong,
	formatTimeShort,
	todayString,
} from '../../lib/datetime'
import { firstNameFromEmail } from '../../lib/user'
import { useAuth } from '../../hooks/use-auth'
import { useToast } from '../../hooks/use-toast'
import {
	createAttendance,
	listMyAttendances,
} from '../../api/attendances.service'
import { getApiErrorMessage } from '../../api/client'
import type { AttendanceType } from '../../types/attendance.types'

type NextAction = AttendanceType | 'DONE'

/** The single valid action for today, derived from existing punches. */
function computeNextAction(
	clockInAt: string | null,
	clockOutAt: string | null,
): NextAction {
	if (clockOutAt) return 'DONE'
	if (clockInAt) return 'CLOCK_OUT'
	return 'CLOCK_IN'
}

export function AbsenPage() {
	const { user } = useAuth()
	const { push } = useToast()

	const [now, setNow] = useState(() => new Date())
	const [clockInAt, setClockInAt] = useState<string | null>(null)
	const [clockOutAt, setClockOutAt] = useState<string | null>(null)

	const [photo, setPhoto] = useState<File | null>(null)
	const [captureKey, setCaptureKey] = useState(0)
	const [detailOpen, setDetailOpen] = useState(false)
	const [notes, setNotes] = useState('')
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
	const [submitting, setSubmitting] = useState(false)

	const nextAction = computeNextAction(clockInAt, clockOutAt)

	// Tick the live clock every second.
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000)
		return () => window.clearInterval(id)
	}, [])

	// Load today's punches to show status + decide the next action.
	const loadToday = useCallback(async () => {
		const today = todayString()
		const { items } = await listMyAttendances({
			from: today,
			to: today,
			limit: 50,
		})
		const inItem = items.find((a) => a.type === 'CLOCK_IN')
		const outItem = items.find((a) => a.type === 'CLOCK_OUT')
		setClockInAt(inItem ? formatTimeShort(inItem.checkedInAt) : null)
		setClockOutAt(outItem ? formatTimeShort(outItem.checkedInAt) : null)
	}, [])

	useEffect(() => {
		void loadToday()
	}, [loadToday])

	// Best-effort: silently attach location as WFH proof. Non-blocking — if the
	// user denies permission or it's unavailable, attendance still proceeds.
	useEffect(() => {
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
			() => undefined,
			{ enableHighAccuracy: false, timeout: 10000 },
		)
	}, [])

	async function handleSubmit() {
		if (!photo || nextAction === 'DONE') return
		setSubmitting(true)
		try {
			await createAttendance({
				photo,
				type: nextAction,
				latitude: coords?.lat,
				longitude: coords?.lng,
				notes: notes.trim() || undefined,
			})
			push('success', 'Absensi berhasil dikirim')
			setPhoto(null)
			setCaptureKey((k) => k + 1)
			setNotes('')
			setCoords(null)
			setDetailOpen(false)
			await loadToday()
		} catch (err) {
			push('error', getApiErrorMessage(err, 'Gagal mengirim absensi'))
		} finally {
			setSubmitting(false)
		}
	}

	const actionLabel = nextAction === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'

	return (
		<div className="w-full max-w-[560px]">
			<div className="mb-5">
				<h1 className="text-[23px] font-bold text-ink-strong">
					Halo, {user ? firstNameFromEmail(user.email) : ''} 👋
				</h1>
				<p className="text-sm text-ink-muted">{formatDateLong(now)}</p>
			</div>

			{/* Live clock */}
			<div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-7 text-white">
				<div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full border border-white/12" />
				<div className="mb-1.5 flex items-center gap-2 text-[12.5px] uppercase tracking-wide text-white/75">
					<span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
					Waktu server · real-time
				</div>
				<div className="text-[52px] font-bold leading-none tabular-nums">
					{formatClock(now)}
				</div>
				<div className="mt-2 text-sm text-white/85">{formatDateLong(now)}</div>
			</div>

			{/* Today status */}
			<div className="mb-4 grid grid-cols-2 gap-3">
				<div className="rounded-xl border border-line bg-surface p-4">
					<div className="mb-2 text-xs text-ink-muted">Clock In hari ini</div>
					{clockInAt ? (
						<Badge variant="success" dot>
							Sudah · {clockInAt}
						</Badge>
					) : (
						<Badge variant="neutral">Belum Absen</Badge>
					)}
				</div>
				<div className="rounded-xl border border-line bg-surface p-4">
					<div className="mb-2 text-xs text-ink-muted">Clock Out hari ini</div>
					{clockOutAt ? (
						<Badge variant="info" dot>
							Sudah · {clockOutAt}
						</Badge>
					) : (
						<Badge variant="neutral">Belum Absen</Badge>
					)}
				</div>
			</div>

			{nextAction === 'DONE' ? (
				/* Completed for today */
				<div className="rounded-2xl border border-success/30 bg-success-bg px-6 py-7 text-center">
					<CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
					<div className="text-base font-bold text-success-text">
						Absensi hari ini selesai
					</div>
					<div className="mt-1.5 text-[13.5px] text-success-text/85">
						Clock In {clockInAt} · Clock Out {clockOutAt}. Sampai jumpa besok!
					</div>
				</div>
			) : (
				<>
					{/* What you're about to submit */}
					<div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
						<span className="text-[13.5px] text-ink-muted">Aksi berikutnya</span>
						<Badge variant={nextAction === 'CLOCK_IN' ? 'success' : 'info'} dot>
							{actionLabel}
						</Badge>
					</div>

					{/* Photo capture */}
					<div className="mb-4">
						<PhotoCapture key={captureKey} onCapture={setPhoto} />
					</div>

					{/* Catatan (only user-facing optional field) */}
					<div className="mb-4 overflow-hidden rounded-2xl border border-line bg-surface">
						<button
							type="button"
							onClick={() => setDetailOpen((v) => !v)}
							className="flex w-full items-center justify-between px-4.5 py-4"
						>
							<span className="text-sm font-semibold text-ink">
								Tambah catatan{' '}
								<span className="font-normal text-ink-muted">(opsional)</span>
							</span>
							<ChevronDown
								className={cn(
									'size-4.5 text-ink-muted transition-transform',
									detailOpen && 'rotate-180',
								)}
							/>
						</button>

						{detailOpen && (
							<div className="border-t border-line/70 px-4.5 pb-5 pt-3">
								<textarea
									id="notes"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									maxLength={255}
									placeholder="mis. WFH dari Bandung"
									className="min-h-16 w-full resize-y rounded-lg border border-line px-3 py-2.5 text-[13.5px] text-ink-strong outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
								/>
							</div>
						)}
					</div>

					{/* Submit */}
					<Button
						onClick={handleSubmit}
						fullWidth
						loading={submitting}
						disabled={!photo}
						className="h-12"
					>
						{submitting ? 'Mengirim…' : `Absen Sekarang — ${actionLabel}`}
					</Button>
					<div className="mt-2.5 text-center text-[12.5px] text-ink-muted">
						{!photo
							? 'Ambil foto dulu untuk absen'
							: 'Waktu & lokasi dilampirkan otomatis sebagai bukti WFH'}
					</div>
				</>
			)}
		</div>
	)
}
