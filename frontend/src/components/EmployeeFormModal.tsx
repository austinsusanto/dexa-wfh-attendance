import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'
import { useToast } from '../hooks/use-toast'
import {
	createEmployee,
	updateEmployee,
} from '../api/employees.service'
import { getApiErrorMessage } from '../api/client'
import type { Employee } from '../types/employee.types'

interface EmployeeFormModalProps {
	open: boolean
	mode: 'create' | 'edit'
	employee: Employee | null
	onClose: () => void
	onSaved: () => void
}

interface FormState {
	employeeNumber: string
	fullName: string
	position: string
	department: string
	email: string
	phone: string
	initialPassword: string
}

const BLANK: FormState = {
	employeeNumber: '',
	fullName: '',
	position: '',
	department: '',
	email: '',
	phone: '',
	initialPassword: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmployeeFormModal({
	open,
	mode,
	employee,
	onClose,
	onSaved,
}: EmployeeFormModalProps) {
	const { push } = useToast()
	const [form, setForm] = useState<FormState>(BLANK)
	const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
		{},
	)
	const [saving, setSaving] = useState(false)
	const isEdit = mode === 'edit'

	// Reset/prefill whenever the modal opens.
	useEffect(() => {
		if (!open) return
		setErrors({})
		setForm(
			employee
				? { ...BLANK, ...employee, initialPassword: '' }
				: BLANK,
		)
	}, [open, employee])

	function set<K extends keyof FormState>(key: K, value: string) {
		setForm((f) => ({ ...f, [key]: value }))
	}

	function validate(): boolean {
		const next: Partial<Record<keyof FormState, string>> = {}
		if (!form.employeeNumber.trim()) {
			next.employeeNumber = 'ID Karyawan wajib diisi'
		}
		if (!form.fullName.trim()) next.fullName = 'Nama wajib diisi'
		if (!form.position.trim()) next.position = 'Jabatan wajib diisi'
		if (!form.department.trim()) next.department = 'Departemen wajib diisi'
		if (!form.phone.trim() || form.phone.trim().length < 6) {
			next.phone = 'Telepon tidak valid'
		}
		if (!isEdit) {
			if (!EMAIL_RE.test(form.email)) next.email = 'Email tidak valid'
			if (form.initialPassword.length < 6) {
				next.initialPassword = 'Minimal 6 karakter'
			}
		}
		setErrors(next)
		return Object.keys(next).length === 0
	}

	async function save() {
		if (!validate()) return
		setSaving(true)
		try {
			if (isEdit && employee) {
				await updateEmployee(employee.id, {
					employeeNumber: form.employeeNumber.trim(),
					fullName: form.fullName.trim(),
					position: form.position.trim(),
					department: form.department.trim(),
					phone: form.phone.trim(),
				})
			} else {
				await createEmployee({
					employeeNumber: form.employeeNumber.trim(),
					fullName: form.fullName.trim(),
					position: form.position.trim(),
					department: form.department.trim(),
					email: form.email.trim(),
					phone: form.phone.trim(),
					initialPassword: form.initialPassword,
				})
			}
			push('success', 'Karyawan berhasil disimpan')
			onSaved()
			onClose()
		} catch (err) {
			push('error', getApiErrorMessage(err, 'Gagal menyimpan karyawan'))
		} finally {
			setSaving(false)
		}
	}

	return (
		<Modal
			open={open}
			onClose={() => !saving && onClose()}
			title={isEdit ? 'Edit Karyawan' : 'Tambah Karyawan'}
			widthClass="max-w-[540px]"
			footer={
				<>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						Batal
					</Button>
					<Button onClick={save} loading={saving}>
						Simpan
					</Button>
				</>
			}
		>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<TextField
					label="ID Karyawan"
					placeholder="EMP007"
					value={form.employeeNumber}
					onChange={(e) => set('employeeNumber', e.target.value)}
					error={errors.employeeNumber}
				/>
				<TextField
					label="Nama lengkap"
					placeholder="Nama karyawan"
					value={form.fullName}
					onChange={(e) => set('fullName', e.target.value)}
					error={errors.fullName}
				/>
				<TextField
					label="Jabatan"
					placeholder="mis. Software Engineer"
					value={form.position}
					onChange={(e) => set('position', e.target.value)}
					error={errors.position}
				/>
				<TextField
					label="Departemen"
					placeholder="mis. Engineering"
					value={form.department}
					onChange={(e) => set('department', e.target.value)}
					error={errors.department}
				/>
				<div className="sm:col-span-2">
					<TextField
						label={isEdit ? 'Email · tidak bisa diubah' : 'Email'}
						type="email"
						placeholder="nama@dexa.com"
						value={form.email}
						onChange={(e) => set('email', e.target.value)}
						error={errors.email}
						readOnly={isEdit}
						className={isEdit ? 'bg-canvas text-ink-muted' : undefined}
					/>
				</div>
				<TextField
					label="Telepon"
					placeholder="081200000000"
					value={form.phone}
					onChange={(e) => set('phone', e.target.value)}
					error={errors.phone}
				/>
				{!isEdit && (
					<TextField
						label="Password awal"
						placeholder="min. 6 karakter"
						value={form.initialPassword}
						onChange={(e) => set('initialPassword', e.target.value)}
						error={errors.initialPassword}
					/>
				)}
			</div>

			{!isEdit && (
				<div className="mt-4 flex items-center gap-2.5 rounded-lg border border-dashed border-line bg-surface-2 px-3.5 py-3">
					<Info className="size-[15px] shrink-0 text-ink-muted" />
					<span className="text-xs text-ink-muted">
						Akun login karyawan otomatis dibuat dari email + password awal ini.
					</span>
				</div>
			)}
		</Modal>
	)
}
