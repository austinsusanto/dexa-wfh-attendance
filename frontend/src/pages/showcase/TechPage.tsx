import {
	ArrowDown,
	Check,
	FileText,
	LayoutDashboard,
	Server,
	ShieldCheck,
	Wrench,
} from "lucide-react";
import type { IconType } from "react-icons";
import {
	SiDocker,
	SiEslint,
	SiJest,
	SiJsonwebtokens,
	SiMysql,
	SiNestjs,
	SiReact,
	SiSwagger,
	SiTypeorm,
	SiTypescript,
	SiVite,
} from "react-icons/si";
import { cn } from "../../lib/cn";
import { env } from "../../config/env";

const TECH: Record<string, { Icon: IconType; color: string }> = {
	nestjs: { Icon: SiNestjs, color: "#E0234E" },
	typescript: { Icon: SiTypescript, color: "#3178C6" },
	typeorm: { Icon: SiTypeorm, color: "#FE0803" },
	jwt: { Icon: SiJsonwebtokens, color: "#1A1A1C" },
	swagger: { Icon: SiSwagger, color: "#85EA2D" },
	react: { Icon: SiReact, color: "#61DAFB" },
	vite: { Icon: SiVite, color: "#646CFF" },
	mysql: { Icon: SiMysql, color: "#4479A1" },
	docker: { Icon: SiDocker, color: "#2496ED" },
	jest: { Icon: SiJest, color: "#C21325" },
	eslint: { Icon: SiEslint, color: "#4B32C3" },
};

const container = "mx-auto max-w-[1080px] px-7";

const STACK = [
	{
		label: "Backend",
		icon: Server,
		items: [
			{
				key: "nestjs",
				name: "NestJS",
				desc: "Framework backend modular.",
			},
			{
				key: "typescript",
				name: "TypeScript",
				desc: "Type-safe di seluruh kode.",
			},
			{
				key: "typeorm",
				name: "TypeORM",
				desc: "ORM + migrations ke MySQL.",
			},
			{
				key: "jwt",
				name: "JWT",
				desc: "Auth token + role-based access.",
			},
			{
				key: "swagger",
				name: "Swagger",
				desc: "Dokumentasi API interaktif.",
			},
		],
		extra: "Passport · bcrypt (hash password) · class-validator · Multer (upload foto)",
	},
	{
		label: "Frontend",
		icon: LayoutDashboard,
		items: [
			{ key: "react", name: "React", desc: "UI berbasis komponen." },
			{ key: "vite", name: "Vite", desc: "Build tool super cepat." },
		],
		extra: "React Router (protected routes) · Axios (JWT interceptor) · getUserMedia (kamera)",
	},
	{
		label: "Infra & Tooling",
		icon: Wrench,
		items: [
			{ key: "mysql", name: "MySQL 8", desc: "Database relasional." },
			{ key: "docker", name: "Docker", desc: "Compose untuk MySQL." },
			{ key: "typeorm", name: "TypeORM", desc: "Migrations & skema DB." },
			{ key: "jest", name: "Jest", desc: "Unit + e2e testing." },
			{ key: "eslint", name: "ESLint", desc: "Linting & gaya kode." },
		],
		extra: "Database seeder (data demo) · Prettier (format kode)",
	},
];

const MODULES = ["Auth", "Users", "Employees", "Attendances"];

const SECURITY = [
	"Password di-hash bcrypt; JWT dengan masa berlaku.",
	"Validasi semua input (class-validator) + sanitasi whitelist.",
	"CORS dibatasi ke origin frontend.",
	"Waktu absensi diisi server, bukan client — anti-manipulasi.",
	"View-only HRD ditegakkan di guard; karyawan nonaktif diblokir akses.",
	"Soft delete karyawan → riwayat tetap utuh. Upload JPG/PNG ≤5MB.",
];

const ROLE_MATRIX = [
	{ endpoint: "POST /attendances", employee: true, hrd: false },
	{ endpoint: "GET /attendances/me", employee: true, hrd: false },
	{ endpoint: "GET /attendances", employee: false, hrd: true },
	{ endpoint: "CRUD /employees", employee: false, hrd: true },
];

const STATS = [
	{
		big: "Unit + E2E",
		desc: "Jest, terstruktur per-domain mengikuti batas modul.",
	},
	{ big: "Migrations", desc: "+ seeder untuk data demo yang reproducible." },
	{ big: "Modular", desc: "Siap pindah saat menjadi microservice." },
];

interface ErdRow {
	name: string;
	note?: string;
	badge?: "PK" | "FK";
}

const ERD: { title: string; highlight?: boolean; rows: ErdRow[] }[] = [
	{
		title: "users",
		rows: [
			{ name: "id", badge: "PK" },
			{ name: "email", note: "unique" },
			{ name: "password", note: "bcrypt" },
			{ name: "role", note: "enum" },
			{ name: "employee_id", badge: "FK" },
			{ name: "timestamps" },
		],
	},
	{
		title: "employees",
		highlight: true,
		rows: [
			{ name: "id", badge: "PK" },
			{ name: "employee_number", note: "unique" },
			{ name: "full_name · position" },
			{ name: "department · phone" },
			{ name: "email", note: "unique" },
			{ name: "is_active", note: "soft delete" },
			{ name: "timestamps" },
		],
	},
	{
		title: "attendances",
		rows: [
			{ name: "id", badge: "PK" },
			{ name: "employee_id", badge: "FK" },
			{ name: "attendance_date" },
			{ name: "checked_in_at", note: "server" },
			{ name: "photo_path · type", note: "enum" },
			{ name: "latitude · longitude · notes" },
			{ name: "created_at" },
		],
	},
];

function ErdCard({
	title,
	highlight,
	rows,
}: {
	title: string;
	highlight?: boolean;
	rows: ErdRow[];
}) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border",
				highlight ? "border-[1.5px] border-primary" : "border-line",
			)}
		>
			<div
				className={cn(
					"px-4 py-2.5 text-[13.5px] font-bold text-white",
					highlight ? "bg-primary" : "bg-ink-strong",
				)}
			>
				{title}
			</div>
			<div className="py-1.5">
				{rows.map((row) => (
					<div
						key={row.name}
						className={cn(
							"flex items-center justify-between px-4 py-1.5 text-[12.5px]",
							row.badge === "FK" && "bg-[#FDF6F5]",
						)}
					>
						<span
							className={cn(
								row.badge === "PK" &&
									"font-semibold text-ink-strong",
								row.badge === "FK" &&
									"font-semibold text-primary-700",
								!row.badge && "text-ink",
							)}
						>
							{row.name}{" "}
							{row.note && (
								<span className="text-ink-muted">
									{row.note}
								</span>
							)}
						</span>
						{row.badge && (
							<span
								className={cn(
									"text-[11px] font-semibold",
									row.badge === "FK"
										? "text-primary"
										: "text-ink-muted",
								)}
							>
								{row.badge}
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export function TechPage() {
	return (
		<div>
			{/* Hero */}
			<section className={`${container} pb-9 pt-14`}>
				<span className="mb-5 inline-block rounded-full bg-ink-strong px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
					TECHNICAL OVERVIEW
				</span>
				<h1 className="mb-4 max-w-[760px] text-4xl font-extrabold leading-tight tracking-tight text-ink-strong sm:text-[40px]">
					Di Balik Layar — Arsitektur &amp; Teknologi
				</h1>
				<p className="max-w-[680px] text-base leading-relaxed text-ink-muted">
					Frontend React, backend NestJS, database MySQL — dipecah
					menjadi microservices.
				</p>
			</section>

			{/* Tech stack */}
			<section className={`${container} py-6`}>
				<h2 className="mb-5 text-[22px] font-bold text-ink-strong">
					Tech Stack
				</h2>
				<div className="flex flex-col gap-4">
					{STACK.map((col) => (
						<div
							key={col.label}
							className="overflow-hidden rounded-2xl border border-line"
						>
							<div className="flex items-center gap-3 border-b border-primary-100 bg-primary-50 px-5 py-3.5">
								<div className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-white">
									<col.icon className="size-5" />
								</div>
								<span className="text-base font-bold text-primary-800">
									{col.label}
								</span>
							</div>
							<div className="bg-surface-2 p-5">
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{col.items.map((item) => {
										const { Icon, color } = TECH[item.key];
										return (
											<div
												key={item.key}
												className="flex items-center gap-3 rounded-xl border border-line p-3.5"
											>
												<div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white">
													<Icon
														size={22}
														color={color}
													/>
												</div>
												<div className="min-w-0">
													<div className="text-[13.5px] font-bold text-ink-strong">
														{item.name}
													</div>
													<div className="text-[12px] leading-snug text-ink-muted">
														{item.desc}
													</div>
												</div>
											</div>
										);
									})}
								</div>
								<div className="mt-4 text-[12px] text-ink-muted">
									+ {col.extra}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Architecture */}
			<section className={`${container} py-8`}>
				<h2 className="mb-1.5 text-[22px] font-bold text-ink-strong">
					Arsitektur Sistem
				</h2>
				<p className="mb-6 text-sm text-ink-muted">
					Monolith modular sekarang → siap diekstrak menjadi
					microservices.
				</p>
				<div className="rounded-2xl border border-line bg-surface-2 p-7">
					<div className="mb-3 text-center text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
						Clients · 1 React SPA, routing by role
					</div>
					<div className="mb-2.5 flex flex-col justify-center gap-4 sm:flex-row">
						{[
							{ t: "Karyawan App", s: "/absen · /riwayat" },
							{
								t: "HRD Admin App",
								s: "/admin/karyawan · /monitoring",
							},
						].map((c) => (
							<div
								key={c.t}
								className="flex-1 rounded-xl border border-line bg-surface p-4 text-center sm:max-w-[300px]"
							>
								<div className="text-sm font-bold text-ink-strong">
									{c.t}
								</div>
								<div className="mt-0.5 text-xs text-ink-muted">
									{c.s}
								</div>
							</div>
						))}
					</div>
					<div className="flex justify-center text-line-strong">
						<ArrowDown className="size-5" />
					</div>

					{/* API */}
					<div className="my-2 rounded-2xl border-[1.5px] border-primary bg-surface p-4.5">
						<div className="text-center text-xs font-bold text-primary">
							API — NestJS · /api/v1
						</div>
						<div className="mb-3.5 mt-1 text-center text-[11.5px] text-ink-muted">
							JWT auth guard · role guard · response envelope
							interceptor · validation pipe · exception filter
						</div>
						<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
							{MODULES.map((m) => (
								<div
									key={m}
									className="rounded-[9px] border border-dashed border-primary-200 bg-[#FDF6F5] px-2 py-3 text-center"
								>
									<div className="text-[13px] font-bold text-primary-700">
										{m}
									</div>
									<div className="mt-0.5 text-[10.5px] text-primary-400">
										calon service
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="flex justify-center text-line-strong">
						<ArrowDown className="size-5" />
					</div>

					{/* Data */}
					<div className="mt-2 flex flex-col justify-center gap-4 sm:flex-row">
						{[
							{
								t: "MySQL 8",
								s: "users · employees · attendances",
							},
							{
								t: "File Storage",
								s: "foto disimpan di disk · /uploads",
							},
						].map((c) => (
							<div
								key={c.t}
								className="flex-1 rounded-xl border border-line bg-surface p-4 text-center sm:max-w-[300px]"
							>
								<div className="text-sm font-bold text-ink-strong">
									{c.t}
								</div>
								<div className="mt-0.5 text-xs text-ink-muted">
									{c.s}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ERD */}
			<section className={`${container} py-8`}>
				<h2 className="mb-1.5 text-[22px] font-bold text-ink-strong">
					Desain Database (ERD)
				</h2>
				<p className="mb-6 text-sm text-ink-muted">
					Tiga tabel inti dengan relasi terdefinisi jelas.
				</p>
				<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
					{ERD.map((table) => (
						<ErdCard key={table.title} {...table} />
					))}
				</div>
				<div className="mt-4.5 flex flex-wrap gap-3 text-[12.5px]">
					<span className="rounded-lg bg-[#F1F2F4] px-3.5 py-2 text-ink">
						<b className="text-ink-strong">users</b> 1 — 1{" "}
						<b className="text-primary">employees</b>{" "}
						<span className="text-ink-muted">
							akun login ↔ karyawan
						</span>
					</span>
					<span className="rounded-lg bg-[#F1F2F4] px-3.5 py-2 text-ink">
						<b className="text-primary">employees</b> 1 — N{" "}
						<b className="text-ink-strong">attendances</b>
					</span>
				</div>
				<div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-[#BFE3CE] bg-success-bg px-4 py-3.5">
					<ShieldCheck className="size-[18px] shrink-0 text-success-text" />
					<span className="text-[13px] text-success-text">
						<b>Unique index</b>{" "}
						<span className="font-mono">
							(employee_id, attendance_date, type)
						</span>{" "}
						→ mencegah absen ganda di hari yang sama.
					</span>
				</div>
			</section>

			{/* API design */}
			<section className={`${container} py-8`}>
				<h2 className="mb-5 text-[22px] font-bold text-ink-strong">
					Desain API
				</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-line p-5">
						<h4 className="mb-2.5 text-sm font-bold text-ink-strong">
							REST · base /api/v1
						</h4>
						<p className="mb-3 text-[13px] leading-relaxed text-ink-muted">
							Response envelope konsisten di setiap endpoint:
						</p>
						<div className="rounded-lg border border-line bg-canvas px-3.5 py-3 font-mono text-[12.5px] text-ink">
							{"{ success, message, data }"}
							<br />
							<span className="text-ink-muted">
								{"// list: data = { items, meta }"}
							</span>
						</div>
						<a
							href={`${env.apiOrigin}/api/docs`}
							target="_blank"
							rel="noreferrer"
							className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-ink-strong px-4.5 text-[13.5px] font-semibold text-white hover:opacity-90"
						>
							<FileText className="size-4" />
							Buka Swagger · /api/docs
						</a>
					</div>

					<div className="rounded-2xl border border-line p-5">
						<h4 className="mb-3.5 text-sm font-bold text-ink-strong">
							Role-based access matrix
						</h4>
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b border-line text-[11.5px] font-semibold text-ink-muted">
									<th className="py-2 text-left">Endpoint</th>
									<th className="py-2">Employee</th>
									<th className="py-2">HRD</th>
								</tr>
							</thead>
							<tbody className="text-[12.5px]">
								{ROLE_MATRIX.map((r) => (
									<tr
										key={r.endpoint}
										className="border-b border-line/60"
									>
										<td className="py-2 font-mono text-ink">
											{r.endpoint}
										</td>
										<td
											className={cn(
												"text-center font-semibold",
												r.employee
													? "text-success"
													: "text-danger",
											)}
										>
											{r.employee ? "✓" : "✕"}
										</td>
										<td
											className={cn(
												"text-center font-semibold",
												r.hrd
													? "text-success"
													: "text-danger",
											)}
										>
											{r.hrd ? "✓" : "✕"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* Security */}
			<section className={`${container} py-8`}>
				<h2 className="mb-5 text-[22px] font-bold text-ink-strong">
					Keamanan &amp; Integritas Data
				</h2>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{SECURITY.map((item) => (
						<div
							key={item}
							className="flex items-start gap-3 rounded-xl border border-line p-4"
						>
							<Check className="mt-0.5 size-[18px] shrink-0 text-success" />
							<span className="text-[13.5px] leading-relaxed text-ink">
								{item}
							</span>
						</div>
					))}
				</div>
			</section>

			{/* Testing */}
			<section className={`${container} py-8`}>
				<h2 className="mb-5 text-[22px] font-bold text-ink-strong">
					Kualitas &amp; Pengujian
				</h2>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{STATS.map((s) => (
						<div
							key={s.big}
							className="rounded-2xl border border-line bg-surface-2 p-5"
						>
							<div className="mb-1.5 text-[28px] font-extrabold text-primary">
								{s.big}
							</div>
							<div className="text-[13px] text-ink-muted">
								{s.desc}
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
