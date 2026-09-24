import React from "react";

export default function ProfilLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Banner Skeleton */}
      <div className="bg-white rounded-3xl border border-[#dee9fc] overflow-hidden">
        <div className="h-36 md:h-44 bg-slate-200" />
        <div className="px-6 md:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 md:-mt-20">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-slate-300 border-4 border-white" />
            <div className="space-y-2 pb-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-200 rounded-md" />
              <div className="h-5 w-32 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
        <div className="h-12 border-t border-[#dee9fc] bg-[#f8fafd] flex items-center px-8 gap-4">
          <div className="h-6 w-36 bg-slate-200 rounded-md" />
          <div className="h-6 w-36 bg-slate-200 rounded-md" />
          <div className="h-6 w-32 bg-slate-200 rounded-md" />
        </div>
      </div>

      {/* Content Skeleton Card */}
      <div className="bg-white rounded-2xl border border-[#dee9fc] p-6 space-y-6">
        <div className="h-6 w-56 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
