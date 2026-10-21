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
  "Your estates": "Pusaka anda",
  "View estate": "Lihat pusaka",
  "What happens next": "Langkah seterusnya",
  "Next to act": "Pihak yang bertindak seterusnya",
  You: "Anda",
  "No further action": "Tiada tindakan lanjut",
  "Processing office (demo)": "Pejabat pemprosesan (demo)",
  "Your lawyer is reviewing your response":
    "Peguam sedang menyemak maklum balas anda",
  "No action needed from you right now":
    "Tiada tindakan diperlukan daripada anda buat masa ini",
  "This estate is complete": "Urusan pusaka ini selesai",
  "View request": "Lihat permintaan",
  "Estate progress": "Kemajuan urusan pusaka",
  "View assets": "Lihat aset",
  "See all process stages": "Lihat semua peringkat proses",
  "Latest update": "Kemas kini terkini",
  "View all updates": "Lihat semua kemas kini",
  "Estate and family details": "Maklumat pusaka dan keluarga",
  "Update family information": "Kemas kini maklumat keluarga",
  "Your next appointment": "Janji temu seterusnya",
  "Your enquiries": "Pertanyaan anda",
  "Draft estate enquiry": "Draf pertanyaan pusaka",
  "Continue enquiry": "Sambung pertanyaan",
  "Get help with an estate": "Dapatkan bantuan urusan pusaka",
  "Get help with another estate": "Dapatkan bantuan bagi pusaka lain",
  "task in progress.": "tugasan sedang diproses.",
  "tasks in progress.": "tugasan sedang diproses.",
  "assets released or registered": "aset dilepaskan atau didaftarkan",
  of: "daripada",
  Jurisdiction: "Bidang kuasa",
  Circumstances: "Keadaan",
  "Not recorded yet": "Belum direkodkan",
  "All assets have been released or registered.":
    "Semua aset telah dilepaskan atau didaftarkan.",
  "No action needed from you right now. Your lawyer will update you here.":
    "Tiada tindakan diperlukan buat masa ini. Peguam akan memberi kemas kini di sini.",
  "Your lawyer is handling the next step. Any requests will appear here.":
    "Peguam mengurus langkah seterusnya. Sebarang permintaan akan dipaparkan di sini.",
  "The application is with the processing office. Any requests will appear here.":
    "Permohonan berada di pejabat pemprosesan. Sebarang permintaan akan dipaparkan di sini.",
  "The order is issued. Asset claims still need to be completed.":
    "Perintah telah dikeluarkan. Tuntutan aset masih perlu diselesaikan.",
  "Updates from your lawyer will appear here.":
    "Kemas kini daripada peguam akan dipaparkan di sini.",
  "See what needs your attention and follow your estate’s progress.":
    "Lihat perkara yang memerlukan perhatian dan ikuti kemajuan urusan pusaka anda.",
  "Tell us what you know. A lawyer will review your enquiry and explain the next steps.":
    "Kongsikan maklumat yang anda tahu. Peguam akan menyemak pertanyaan dan menerangkan langkah seterusnya.",
  "Saved. You can finish this later.":
    "Disimpan. Anda boleh menyelesaikannya kemudian.",
  "Your lawyer has opened the estate case.":
    "Peguam telah membuka kes pusaka anda.",
  "Waiting for the law firm to respond.": "Menunggu maklum balas firma guaman.",
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
