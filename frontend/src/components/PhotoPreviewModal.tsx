import { Modal } from './ui/Modal'
import { AttendanceTypeBadge } from './AttendanceTypeBadge'
import { photoUrl } from '../config/env'
import { formatDateShort, formatTimeShort } from '../lib/datetime'
import type { Attendance } from '../types/attendance.types'

interface PhotoPreviewModalProps {
	attendance: Attendance | null
	onClose: () => void
}

/** Shared photo preview: image + attendance metadata (employee shown if joined). */
export function PhotoPreviewModal({
	attendance,
	onClose,
}: PhotoPreviewModalProps) {
	return (
		<Modal
			open={Boolean(attendance)}
			onClose={onClose}
			title="Foto bukti WFH"
		>
			{attendance && (
				<div className="flex flex-col gap-4">
					<img
						src={photoUrl(attendance.photoPath)}
						alt="Foto bukti WFH"
						className="w-full rounded-xl border border-line bg-canvas object-cover"
					/>
					<div className="flex flex-col gap-2 text-sm">
						{attendance.employee && (
							<div className="flex justify-between gap-4">
								<span className="text-ink-muted">Karyawan</span>
								<span className="font-medium text-ink-strong">
									{attendance.employee.fullName}
								</span>
							</div>
						)}
						<div className="flex justify-between gap-4">
							<span className="text-ink-muted">Tanggal</span>
							<span className="font-medium text-ink">
								{formatDateShort(attendance.attendanceDate)}
							</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-ink-muted">Waktu</span>
							<span className="font-medium tabular-nums text-ink">
								{formatTimeShort(attendance.checkedInAt)}
							</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-ink-muted">Tipe</span>
							<AttendanceTypeBadge type={attendance.type} />
						</div>
						{attendance.notes && (
							<div className="flex justify-between gap-4">
								<span className="text-ink-muted">Catatan</span>
								<span className="max-w-[60%] text-right text-ink">
									{attendance.notes}
								</span>
							</div>
						)}
					</div>
				</div>
			)}
		</Modal>
	)
}
