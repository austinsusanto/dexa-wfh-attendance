import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Check, RotateCcw, Upload } from 'lucide-react'

type CamState = 'idle' | 'live' | 'captured' | 'denied'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png']

interface PhotoCaptureProps {
	/** Receives the captured/uploaded file, or null when cleared. */
	onCapture: (file: File | null) => void
}

/**
 * Webcam capture (getUserMedia) with idle/live/captured/denied states and a
 * file-upload fallback. Produces a JPEG/PNG File for the attendance submit.
 */
export function PhotoCapture({ onCapture }: PhotoCaptureProps) {
	const [state, setState] = useState<CamState>('idle')
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const videoRef = useRef<HTMLVideoElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)

	const stopStream = useCallback(() => {
		streamRef.current?.getTracks().forEach((track) => track.stop())
		streamRef.current = null
	}, [])

	const activate = useCallback(async () => {
		setUploadError(null)
		if (!navigator.mediaDevices?.getUserMedia) {
			setState('denied')
			return
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user' },
				audio: false,
			})
			streamRef.current = stream
			setState('live')
		} catch {
			setState('denied')
		}
	}, [])

	// Attach the stream once the <video> is mounted in the live state.
	useEffect(() => {
		if (state === 'live' && videoRef.current && streamRef.current) {
			videoRef.current.srcObject = streamRef.current
			void videoRef.current.play()
		}
	}, [state])

	// Cleanup on unmount.
	useEffect(() => {
		return () => {
			stopStream()
			if (previewUrl) URL.revokeObjectURL(previewUrl)
		}
	}, [stopStream, previewUrl])

	function capture() {
		const video = videoRef.current
		if (!video) return
		const canvas = document.createElement('canvas')
		canvas.width = video.videoWidth || 640
		canvas.height = video.videoHeight || 480
		canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
		canvas.toBlob(
			(blob) => {
				if (!blob) return
				const file = new File([blob], `wfh-${Date.now()}.jpg`, {
					type: 'image/jpeg',
				})
				stopStream()
				setPreviewUrl(URL.createObjectURL(file))
				setState('captured')
				onCapture(file)
			},
			'image/jpeg',
			0.9,
		)
	}

	function retake() {
		if (previewUrl) URL.revokeObjectURL(previewUrl)
		setPreviewUrl(null)
		onCapture(null)
		void activate()
	}

	function onUpload(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		event.target.value = ''
		if (!file) return
		if (!ALLOWED.includes(file.type)) {
			setUploadError('Hanya file JPG/PNG yang diizinkan.')
			return
		}
		if (file.size > MAX_BYTES) {
			setUploadError('Ukuran foto maksimal 5MB.')
			return
		}
		setUploadError(null)
		setPreviewUrl(URL.createObjectURL(file))
		setState('captured')
		onCapture(file)
	}

	return (
		<div className="rounded-2xl border border-line bg-surface p-5">
			<div className="mb-1 text-[15px] font-semibold text-ink-strong">
				Foto bukti WFH
			</div>
			<div className="mb-4 text-[13px] text-ink-muted">
				Ambil foto melalui kamera sebagai bukti kehadiran.
			</div>

			{state === 'idle' && (
				<div className="rounded-xl border-2 border-dashed border-line bg-surface-2 px-5 py-10 text-center">
					<div className="mx-auto mb-3.5 flex size-14 items-center justify-center rounded-full bg-primary-50">
						<Camera className="size-6 text-primary" />
					</div>
					<div className="mb-4 text-sm text-ink">Kamera belum aktif</div>
					<button
						type="button"
						onClick={() => void activate()}
						className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
					>
						Aktifkan Kamera
					</button>
					<div className="mt-3">
						<button
							type="button"
							onClick={() => setState('denied')}
							className="text-[12.5px] text-ink-muted underline"
						>
							Kamera diblokir?
						</button>
					</div>
				</div>
			)}

			{state === 'live' && (
				<div>
					<div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
						<video
							ref={videoRef}
							muted
							playsInline
							className="size-full object-cover"
						/>
						<div className="pointer-events-none absolute inset-3.5 rounded-lg border-2 border-white/25" />
						<div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1">
							<span className="size-1.5 animate-pulse rounded-full bg-red-400" />
							<span className="text-[11px] font-semibold text-white">LIVE</span>
						</div>
					</div>
					<div className="mt-4 flex justify-center">
						<button
							type="button"
							onClick={capture}
							title="Ambil Foto"
							className="flex size-16 items-center justify-center rounded-full border-4 border-primary bg-white hover:bg-primary-50"
						>
							<span className="size-11 rounded-full bg-primary" />
						</button>
					</div>
					<div className="mt-2.5 text-center text-[12.5px] text-ink-muted">
						Tekan tombol untuk mengambil foto
					</div>
				</div>
			)}

			{state === 'captured' && previewUrl && (
				<div>
					<div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-canvas">
						<img
							src={previewUrl}
							alt="Pratinjau foto absensi"
							className="size-full object-cover"
						/>
						<div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11.5px] font-semibold text-success-text">
							<Check className="size-3" />
							Foto siap
						</div>
					</div>
					<div className="mt-3.5 flex justify-center">
						<button
							type="button"
							onClick={retake}
							className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13.5px] font-medium text-ink hover:border-line-strong"
						>
							<RotateCcw className="size-4" />
							Ulangi
						</button>
					</div>
				</div>
			)}

			{state === 'denied' && (
				<div className="rounded-xl border border-primary-200 bg-danger-bg p-5 text-center">
					<div className="mb-1 text-[13.5px] font-semibold text-danger-text">
						Akses kamera ditolak
					</div>
					<div className="mb-4 text-[12.5px] text-danger-text/85">
						Anda dapat mengunggah foto sebagai gantinya (JPG/PNG, maks 5MB).
					</div>
					<div className="flex justify-center gap-2.5">
						<label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-primary-700">
							<Upload className="size-4" />
							Unggah foto
							<input
								type="file"
								accept="image/jpeg,image/png"
								onChange={onUpload}
								className="hidden"
							/>
						</label>
						<button
							type="button"
							onClick={() => void activate()}
							className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13.5px] font-medium text-ink"
						>
							Coba kamera lagi
						</button>
					</div>
					{uploadError && (
						<div className="mt-3 text-[12px] font-medium text-danger-text">
							{uploadError}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
