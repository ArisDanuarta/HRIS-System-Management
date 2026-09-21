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
          <h1 className="text-base font-semibold text-[#1B2430]">HRIS</h1>
        </div>

        <div className="flex items-center gap-3">
          <AppSwitcher
            currentApp="hris"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#102E50] mb-2">PSPK HRIS — Fase 1 Siap</h2>
          <p className="text-sm text-[#5B6675] max-w-md mx-auto mb-6">
            Fondasi monorepo, database PostgreSQL multi-schema, dan packages bersama telah berhasil
            dikonfigurasi. Siap untuk implementasi UI/UX dari Google Stitch.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="primary">Masuk ke Sistem</Button>
            <Button variant="secondary">Pelajari Alur</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
