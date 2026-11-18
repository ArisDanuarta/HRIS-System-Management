"use client";

import React from "react";
import { formatDate } from "@pspk/shared";
import {
  User,
  Phone,
  Mail,
  Home,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  AlertCircle,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import {
  getGenderLabel,
  getMaritalStatusLabel,
  getReligionLabel,
  getBloodTypeLabel,
  getCitizenshipLabel,
  getFamilyRelationLabel,
  getEducationLevelLabel,
} from "@/lib/enum-labels";

export interface EmployeeBiodataTabProps {
  employee: {
    id: string;
    fullName: string;
    nickname?: string | null;
    gender?: string | null;
    maritalStatus?: string | null;
    birthPlace?: string | null;
    birthDate?: Date | string | null;
    religion?: string | null;
    citizenship?: string | null;
    bloodType?: string | null;
    motherName?: string | null;
    landlinePhone?: string | null;
    workEmail: string;
    personalEmail?: string | null;
    phone?: string | null;
    address?: string | null; // legacy fallback
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContactRelation?: string | null;
    addresses?: Array<{
      id: string;
      type: string; // KTP | DOMICILE
      street: string;
      kelurahan?: string | null;
      kecamatan?: string | null;
      city?: string | null;
      province?: string | null;
      postalCode?: string | null;
    }>;
    familyMembers?: Array<{
      id: string;
      name: string;
      relation: string;
      birthDate?: Date | string | null;
      phone?: string | null;
      isDependent: boolean;
      notes?: string | null;
    }>;
    educations?: Array<{
      id: string;
      level: string;
      institution: string;
      major?: string | null;
      graduationYear?: number | null;
      gpa?: number | string | null;
    }>;
    trainings?: Array<{
      id: string;
      name: string;
      participationType?: string | null;
      startDate?: Date | string | null;
      endDate?: Date | string | null;
      duration?: string | null;
      location?: string | null;
      organizer?: string | null;
    }>;
    workExperiences?: Array<{
      id: string;
      companyName: string;
      jobTitle: string;
      startDate: Date | string;
      endDate?: Date | string | null;
      reasonForLeaving?: string | null;
      description?: string | null;
    }>;
  };
}

function calculateAge(birthDate?: Date | string | null): string {
  if (!birthDate) return "";
  const d = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  ) {
    age--;
  }
  return age > 0 ? `(${age} tahun)` : "";
}

export function EmployeeBiodataTab({ employee }: EmployeeBiodataTabProps) {
  const addresses = employee.addresses || [];
  const ktpAddress = addresses.find((a) => a.type === "KTP");
  const domicileAddress = addresses.find((a) => a.type === "DOMICILE");

  const familyMembers = employee.familyMembers || [];
  const educations = [...(employee.educations || [])].sort((a, b) => {
    return (b.graduationYear || 0) - (a.graduationYear || 0);
  });
  const trainings = [...(employee.trainings || [])].sort((a, b) => {
    const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return timeB - timeA;
  });
  const workExperiences = [...(employee.workExperiences || [])].sort((a, b) => {
    // Pengalaman aktif (endDate null) selalu paling atas
    if (!a.endDate && b.endDate) return -1;
    if (a.endDate && !b.endDate) return 1;
    const timeA = new Date(a.startDate).getTime();
    const timeB = new Date(b.startDate).getTime();
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      {/* 1. Baris Identitas Pribadi & Kontak Darurat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Card 1: Identitas Pribadi Lengkap */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Identitas Diri Pegawai
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-4 text-xs w-full min-w-0">
            <div>
              <span className="text-slate-400 block mb-0.5">Nama Lengkap</span>
              <span className="font-semibold text-slate-800 break-words">
                {employee.fullName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Nama Panggilan</span>
              <span className="font-semibold text-slate-800 break-words">
                {employee.nickname || "-"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Jenis Kelamin</span>
              <span className="font-semibold text-slate-800">
                {getGenderLabel(employee.gender)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Status Pernikahan</span>
              <span className="font-semibold text-slate-800">
                {getMaritalStatusLabel(employee.maritalStatus)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Tempat & Tanggal Lahir</span>
              <span className="font-semibold text-slate-800 break-words">
                {employee.birthPlace || "-"}
                {employee.birthDate ? `, ${formatDate(employee.birthDate)}` : ""}{" "}
                <span className="text-slate-500 font-normal">
                  {calculateAge(employee.birthDate)}
                </span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Agama</span>
              <span className="font-semibold text-slate-800">
                {getReligionLabel(employee.religion)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Golongan Darah</span>
              <span className="font-semibold text-slate-800">
                {getBloodTypeLabel(employee.bloodType)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Kewarganegaraan</span>
              <span className="font-semibold text-slate-800">
                {getCitizenshipLabel(employee.citizenship)}
              </span>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Nama Ibu Kandung</span>
              <span className="font-semibold text-slate-800 break-words">
                {employee.motherName || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Kontak Resmi, Pribadi & Darurat */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0 justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Phone className="w-4 h-4 text-[#102E50]" />
              <h3 className="font-bold text-sm text-[#102E50] font-heading">
                Informasi Kontak & Darurat
              </h3>
            </div>

            <div className="flex flex-col gap-3 text-xs w-full min-w-0 mt-1">
              <div className="p-3 bg-slate-50/80 rounded-xl flex items-center gap-3 w-full min-w-0 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400">Email Kantor Resmi</span>
                  <a
                    href={`mailto:${employee.workEmail}`}
                    className="font-semibold text-slate-800 truncate hover:text-[#102E50] hover:underline"
                  >
                    {employee.workEmail}
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl flex items-center gap-3 w-full min-w-0 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400">Email Pribadi Pegawai</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {employee.personalEmail || "-"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                <div className="p-3 bg-slate-50/80 rounded-xl flex items-center gap-3 w-full min-w-0 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-slate-400">No. HP / WhatsApp</span>
                    <span className="font-semibold text-slate-800 truncate font-mono">
                      {employee.phone || "-"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl flex items-center gap-3 w-full min-w-0 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-slate-400">Telepon Rumah (Landline)</span>
                    <span className="font-semibold text-slate-800 truncate font-mono">
                      {employee.landlinePhone || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kotak Kontak Darurat */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex flex-col gap-2 w-full min-w-0 mt-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kontak Darurat (Emergency Contact)</span>
              </div>
              {employee.emergencyContactRelation && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Hubungan: {employee.emergencyContactRelation}
                </span>
              )}
            </div>

            {employee.emergencyContactName || employee.emergencyContactPhone ? (
              <div className="flex justify-between items-center text-xs mt-0.5 flex-wrap gap-2 min-w-0">
                <span className="text-slate-800 font-semibold truncate">
                  {employee.emergencyContactName || "Nama tidak dicatat"}
                </span>
                <span className="font-mono font-bold text-slate-900 shrink-0">
                  {employee.emergencyContactPhone || "-"}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic text-xs mt-0.5">
                Belum ada kontak darurat yang dicantumkan.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Kartu Alamat Lengkap (KTP & Domisili) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Home className="w-4 h-4 text-[#102E50]" />
          <h3 className="font-bold text-sm text-[#102E50] font-heading">
            Alamat Kependudukan & Domisili
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          {/* Alamat KTP */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#102E50]">
              <MapPin className="w-3.5 h-3.5 text-[#F2AF3E]" />
              <span>Alamat Sesuai KTP</span>
            </div>
            {ktpAddress ? (
              <div className="text-xs text-slate-700 leading-relaxed flex flex-col gap-1">
                <span className="font-semibold text-slate-800 break-words">
                  {ktpAddress.street}
                </span>
                <span className="text-slate-500">
                  {[
                    ktpAddress.kelurahan ? `Kel. ${ktpAddress.kelurahan}` : "",
                    ktpAddress.kecamatan ? `Kec. ${ktpAddress.kecamatan}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span className="text-slate-500">
                  {[
                    ktpAddress.city,
                    ktpAddress.province,
                    ktpAddress.postalCode ? `Kode Pos ${ktpAddress.postalCode}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            ) : employee.address ? (
              <div className="text-xs text-slate-700 leading-relaxed break-words">
                {employee.address}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Alamat KTP belum dicantumkan.
              </span>
            )}
          </div>

          {/* Alamat Domisili */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#102E50]">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Alamat Domisili Sekarang</span>
            </div>
            {domicileAddress ? (
              <div className="text-xs text-slate-700 leading-relaxed flex flex-col gap-1">
                <span className="font-semibold text-slate-800 break-words">
                  {domicileAddress.street}
                </span>
                <span className="text-slate-500">
                  {[
                    domicileAddress.kelurahan ? `Kel. ${domicileAddress.kelurahan}` : "",
                    domicileAddress.kecamatan ? `Kec. ${domicileAddress.kecamatan}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span className="text-slate-500">
                  {[
                    domicileAddress.city,
                    domicileAddress.province,
                    domicileAddress.postalCode ? `Kode Pos ${domicileAddress.postalCode}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            ) : employee.address ? (
              <div className="text-xs text-slate-700 leading-relaxed break-words">
                {employee.address}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Alamat domisili belum dicantumkan.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tabel Susunan Anggota Keluarga */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Susunan Anggota Keluarga & Tanggungan
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {familyMembers.length} Orang
          </span>
        </div>

        {familyMembers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            Belum ada data anggota keluarga yang dicatat.
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-none [overscroll-behavior-x:contain]">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Nama Anggota</th>
                  <th className="py-2.5 px-3">Hubungan</th>
                  <th className="py-2.5 px-3">Tanggal Lahir (Usia)</th>
                  <th className="py-2.5 px-3">No. HP</th>
                  <th className="py-2.5 px-3">Status Tanggungan</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {familyMembers.map((fam) => (
                  <tr key={fam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{fam.name}</td>
                    <td className="py-2.5 px-3">{getFamilyRelationLabel(fam.relation)}</td>
                    <td className="py-2.5 px-3">
                      {fam.birthDate ? (
                        <span>
                          {formatDate(fam.birthDate)}{" "}
                          <span className="text-slate-400 text-[11px]">
                            {calculateAge(fam.birthDate)}
                          </span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{fam.phone || "-"}</td>
                    <td className="py-2.5 px-3">
                      {fam.isDependent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tanggungan</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Bukan Tanggungan</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                      {fam.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Tabel Riwayat Pendidikan Formal */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Riwayat Pendidikan Formal
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {educations.length} Jenjang
          </span>
        </div>

        {educations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            Belum ada catatan pendidikan formal yang dicantumkan.
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-none [overscroll-behavior-x:contain]">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Jenjang</th>
                  <th className="py-2.5 px-3">Institusi / Universitas</th>
                  <th className="py-2.5 px-3">Jurusan / Program Studi</th>
                  <th className="py-2.5 px-3 text-center">Tahun Lulus</th>
                  <th className="py-2.5 px-3 text-center">Nilai / IPK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {educations.map((edu) => (
                  <tr key={edu.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {getEducationLevelLabel(edu.level)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {edu.institution}
                    </td>
                    <td className="py-2.5 px-3">{edu.major || "-"}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {edu.graduationYear || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {edu.gpa ? Number(edu.gpa).toFixed(2) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Tabel Riwayat Pelatihan & Sertifikasi */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Pelatihan & Sertifikasi Profesional
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {trainings.length} Pelatihan
          </span>
        </div>

        {trainings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            Belum ada catatan pelatihan atau sertifikasi profesional.
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-none [overscroll-behavior-x:contain]">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Nama Pelatihan</th>
                  <th className="py-2.5 px-3">Penyelenggara</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Durasi</th>
                  <th className="py-2.5 px-3">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {trainings.map((trn) => (
                  <tr key={trn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{trn.name}</td>
                    <td className="py-2.5 px-3">{trn.organizer || "-"}</td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {trn.startDate ? formatDate(trn.startDate) : "-"}
                      {trn.endDate ? ` s.d. ${formatDate(trn.endDate)}` : ""}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{trn.duration || "-"}</td>
                    <td className="py-2.5 px-3 text-slate-500">{trn.location || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Tabel Riwayat Pengalaman Kerja Terdahulu */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4 w-full min-w-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Pengalaman Kerja Terdahulu
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {workExperiences.length} Pengalaman
          </span>
        </div>

        {workExperiences.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            Belum ada riwayat pengalaman kerja sebelum bergabung di PSPK.
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-none [overscroll-behavior-x:contain]">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Instansi / Perusahaan</th>
                  <th className="py-2.5 px-3">Posisi / Jabatan</th>
                  <th className="py-2.5 px-3">Periode Kerja</th>
                  <th className="py-2.5 px-3">Alasan Berhenti</th>
                  <th className="py-2.5 px-3">Keterangan / Uraian Tugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {workExperiences.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {exp.companyName}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{exp.jobTitle}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span>{formatDate(exp.startDate)}</span>
                      <span className="text-slate-400 mx-1">s/d</span>
                      {exp.endDate ? (
                        <span>{formatDate(exp.endDate)}</span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sekarang / Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">
                      {exp.reasonForLeaving || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate">
                      {exp.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
