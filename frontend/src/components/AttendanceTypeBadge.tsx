import { Badge } from './ui/Badge'
import type { AttendanceType } from '../types/attendance.types'

/** Clock In (success) / Clock Out (info) status pill. */
export function AttendanceTypeBadge({ type }: { type: AttendanceType }) {
	return type === 'CLOCK_IN' ? (
		<Badge variant="success" dot>
			Clock In
		</Badge>
	) : (
		<Badge variant="info" dot>
			Clock Out
		</Badge>
	)
}
