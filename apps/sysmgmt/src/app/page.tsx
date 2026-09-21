import { AppSwitcher, Button } from "@pspk/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Top navigation */}
      <header className="bg-white border-b border-[#E1E6ED] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#102E50]"></span>
            <span className="font-bold text-[#102E50] text-lg tracking-tight">PSPK</span>
          </div>
          <span className="text-[#E1E6ED]">|</span>
          <h1 className="text-base font-semibold text-[#1B2430]">System Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <AppSwitcher
            currentApp="sysmgmt"
            hrisUrl="http://localhost:3001"
            sysmgmtUrl="http://localhost:3002"
          />
        </div>
      </header>

      {/* Main content placeholder */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-8 flex flex-col justify-center">
        <div className="bg-white rounded-xl border border-[#E1E6ED] p-8 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F0F4F8] text-[#102E50] mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#102E50] mb-2">PSPK System Management — Fase 1 Siap</h2>
          <p className="text-sm text-[#5B6675] max-w-md mx-auto mb-6">
            Pengelolaan Pengguna, RBAC, Inventaris Aset, Dokumen & SOP, serta Audit Log. Siap untuk
            implementasi UI/UX dari Google Stitch.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="primary">Masuk ke Sistem</Button>
            <Button variant="outline">Lihat Repositori Dokumen</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
