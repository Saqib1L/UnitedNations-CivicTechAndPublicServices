export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const form = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method,
    signal: AbortSignal.timeout(30000),
    credentials: "same-origin",
    headers: body && !form ? { "Content-Type": "application/json" } : undefined,
    body: body ? (form ? (body as FormData) : JSON.stringify(body)) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((x: any) => x.msg).join(". ")
          : "Something went wrong. Please try again.",
    );
  }
  return data;
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value || 0);
export const dateLabel = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not scheduled";
export const human = (value: string) =>
  (value || "").replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase());
export const stages = [
  "Prepare",
  "Legal review",
  "Submit",
  "Agency review",
  "Order issued",
  "Asset release",
];

export type User = {
  id: number;
  name: string;
  email: string;
  role: "family" | "lawyer" | "officer";
  organisation: string;
};
export type Estate = {
  id: number;
  reference: string;
  deceased: string;
  jurisdiction: string;
  religion: string;
  stage: number;
  lawyer: string;
  assets_count: number;
  released_count: number;
  value: number;
  tasks_count: number;
  details: Record<string, any>;
};
export type CaseRecord = {
  id: number;
  estate_id: number;
  kind: string;
  owner_id: number;
  data: Record<string, any>;
  created: string;
};
export type Document = {
  id: number;
  name: string;
  category: string;
  visibility: string;
  revision: number;
  status: string;
  comment: string;
  supersedes_id?: number;
  owner_id: number;
  created: string;
  media_type: string;
};
export type CaseDetail = {
  estate: Estate;
  lawyer: User;
  records: Record<string, CaseRecord[]>;
  documents: Document[];
  members: { user: User; coordinator: boolean }[];
  submissions: any[];
  invitations: any[];
  is_coordinator: boolean;
};

const malay: Record<string, string> = {
  Dashboard: "Papan pemuka",
  Overview: "Ringkasan",
  Enquiries: "Pertanyaan",
  Cases: "Kes",
  Notifications: "Pemberitahuan",
  Applications: "Permohonan",
  Hearings: "Pendengaran",
  "My tasks": "Tugasan saya",
  Documents: "Dokumen",
  Assets: "Aset",
  Updates: "Kemas kini",
  People: "Ahli keluarga",
  "Assets & liabilities": "Aset & liabiliti",
  Tasks: "Tugasan",
  Fees: "Fi",
  Activity: "Aktiviti",
  Summary: "Ringkasan",
  "Submitted documents": "Dokumen diserahkan",
  Queries: "Pertanyaan agensi",
  Hearing: "Pendengaran",
  Decision: "Keputusan",
  History: "Sejarah",
  "New estate case": "Kes pusaka baharu",
  "Sign out": "Log keluar",
  "Search cases": "Cari kes",
  "View case": "Lihat kes",
  "Next action": "Tindakan seterusnya",
  "Current stage": "Peringkat semasa",
  "Active cases": "Kes aktif",
  "Needs attention": "Perlu perhatian",
  "New enquiries": "Pertanyaan baharu",
  "Your estate workspace": "Ruang kerja pusaka anda",
  "Continue to case": "Teruskan ke kes",
  "Good morning": "Selamat pagi",
  "Your next steps, all in one place.":
    "Langkah seterusnya anda, di satu tempat.",
  "A clear path forward.": "Laluan yang jelas ke hadapan.",
  "Every family deserves clarity.":
    "Setiap keluarga berhak mendapat kejelasan.",
  "Case journey": "Perjalanan kes",
  "Asset progress": "Kemajuan aset",
  "Latest activity": "Aktiviti terkini",
  Prepare: "Persediaan",
  "Legal review": "Semakan undang-undang",
  Submit: "Penyerahan",
  "Agency review": "Semakan agensi",
  "Order issued": "Perintah dikeluarkan",
  "Asset release": "Pelepasan aset",
  "Download summary": "Muat turun ringkasan",
  "Invite family": "Jemput keluarga",
  Save: "Simpan",
  Cancel: "Batal",
  Close: "Tutup",
  "Add asset": "Tambah aset",
  "Add person": "Tambah ahli",
  "Upload document": "Muat naik dokumen",
  "Request correction": "Minta pembetulan",
  "Mark accepted": "Tandakan diterima",
  Respond: "Beri maklum balas",
  "Complete review": "Selesaikan semakan",
  "No items yet": "Belum ada item",
  Search: "Cari",
  "Welcome back": "Selamat kembali",
  "Sign in": "Log masuk",
  "Create account": "Cipta akaun",
  Password: "Kata laluan",
  "Full name": "Nama penuh",
  Family: "Keluarga",
  Lawyer: "Peguam",
  Officer: "Pegawai",
  "View all": "Lihat semua",
  "In progress": "Sedang diproses",
  Completed: "Selesai",
  "Start an enquiry": "Mulakan pertanyaan",
  "Proof of concept": "Bukti konsep",
  "Help & guidance": "Bantuan & panduan",
  "About this demo": "Tentang demo ini",
};
export const translate = (value: string, language: string) =>
  language === "bm" ? malay[value] || value : value;
