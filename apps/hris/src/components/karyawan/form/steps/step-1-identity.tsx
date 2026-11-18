"use client";

import React from "react";
import { User, Phone, Home, HeartHandshake, Camera, Upload, Trash2 } from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { FormSection } from "../../components/FormSection";
import { AddressFields } from "../../components/AddressFields";
import { Gender, MaritalStatus, Religion, BloodType } from "@pspk/db";

export function Step1Identity() {
  const {
    formData,
    updateField,
    addressKtp,
    setAddressKtp,
    addressDomicile,
    setAddressDomicile,
    isDomicileSameAsKtp,
    handleToggleSameAddress,
    profilePhotoPreview,
    handleProfilePhotoChange,
    clearProfilePhoto,
    profilePhoto,
  } = useEmployeeForm();

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1.1 Data Diri Pegawai */}
      <FormSection
        id="seksi-data-diri"
        title="1.1 Data Diri & Identitas Pokok"
        subtitle="Foto profil, nama lengkap, tempat tanggal lahir, agama, dan status personal"
        icon={User}
        defaultOpen={true}
      >
        <div className="flex flex-col gap-5">
          {/* Photo Uploader Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs">
                {profilePhotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoPreview}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Foto</span>
                  </div>
                )}
              </div>

              {profilePhotoPreview && (
                <button
                  type="button"
                  onClick={clearProfilePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                  title="Hapus foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0 text-center sm:text-left flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                  Unggah Pasfoto Resmi
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Format JPG, PNG, atau WEBP. Ukuran maksimal 2 MB dengan rasio persegi (1:1).
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#102E50] transition-colors cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pilih Berkas Foto</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleProfilePhotoChange}
                  />
                </label>
              </div>

              {profilePhoto.error && (
                <span className="text-[11px] text-rose-600 font-medium">
                  {profilePhoto.error}
                </span>
              )}
            </div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="fullName" className="font-bold text-slate-700">
                Nama Lengkap (Sesuai KTP) <span className="text-[#A8281C]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Contoh: Raden Ayu Kartini"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>

            {/* Nama Panggilan */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nickname" className="font-bold text-slate-700">
                Nama Panggilan
              </label>
              <input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => updateField("nickname", e.target.value)}
                placeholder="Contoh: Kartini"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>

            {/* Jenis Kelamin */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gender" className="font-bold text-slate-700">
                Jenis Kelamin <span className="text-[#A8281C]">*</span>
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => updateField("gender", e.target.value as Gender)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              >
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>

            {/* Tempat Lahir */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="birthPlace" className="font-bold text-slate-700">
                Tempat Lahir
              </label>
              <input
                id="birthPlace"
                type="text"
                value={formData.birthPlace}
                onChange={(e) => updateField("birthPlace", e.target.value)}
                placeholder="Contoh: Jakarta"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="birthDate" className="font-bold text-slate-700">
                Tanggal Lahir
              </label>
              <input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateField("birthDate", e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>

            {/* Agama */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="religion" className="font-bold text-slate-700">
                Agama
              </label>
              <select
                id="religion"
                value={formData.religion}
                onChange={(e) => updateField("religion", e.target.value as Religion)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              >
                <option value="">Pilih Agama</option>
                <option value="ISLAM">Islam</option>
                <option value="KRISTEN_PROTESTAN">Kristen Protestan</option>
                <option value="KATOLIK">Katolik</option>
                <option value="HINDU">Hindu</option>
                <option value="BUDDHA">Buddha</option>
                <option value="KONGHUCU">Konghucu</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            {/* Status Pernikahan */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="maritalStatus" className="font-bold text-slate-700">
                Status Pernikahan
              </label>
              <select
                id="maritalStatus"
                value={formData.maritalStatus}
                onChange={(e) => updateField("maritalStatus", e.target.value as MaritalStatus)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              >
                <option value="SINGLE">Belum Menikah (Lajang)</option>
                <option value="MARRIED">Menikah</option>
                <option value="WIDOWED">Cerai Mati</option>
                <option value="DIVORCED">Cerai Hidup</option>
              </select>
            </div>

            {/* Golongan Darah */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bloodType" className="font-bold text-slate-700">
                Golongan Darah
              </label>
              <select
                id="bloodType"
                value={formData.bloodType}
                onChange={(e) => updateField("bloodType", e.target.value as BloodType)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              >
                <option value="">Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            {/* Kewarganegaraan */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="citizenship" className="font-bold text-slate-700">
                Kewarganegaraan
              </label>
              <select
                id="citizenship"
                value={formData.citizenship}
                onChange={(e) => updateField("citizenship", e.target.value as "WNI" | "WNA")}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              >
                <option value="WNI">Warga Negara Indonesia (WNI)</option>
                <option value="WNA">Warga Negara Asing (WNA)</option>
              </select>
            </div>

            {/* Nama Ibu Kandung */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="motherName" className="font-bold text-slate-700">
                Nama Ibu Kandung
              </label>
              <input
                id="motherName"
                type="text"
                value={formData.motherName}
                onChange={(e) => updateField("motherName", e.target.value)}
                placeholder="Nama gadis ibu kandung (keperluan perbankan/BPJS)"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* 1.2 Informasi Kontak */}
      <FormSection
        id="seksi-kontak"
        title="1.2 Informasi Kontak & Komunikasi"
        subtitle="Alamat email resmi kantor, email pribadi untuk akses akun, dan nomor telepon aktif"
        icon={Phone}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Email Kantor */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="workEmail" className="font-bold text-slate-700">
              Email Kantor Resmi <span className="text-[#A8281C]">*</span>
            </label>
            <input
              id="workEmail"
              type="email"
              required
              value={formData.workEmail}
              onChange={(e) => updateField("workEmail", e.target.value)}
              placeholder="nama.pegawai@pspk.id"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all font-mono"
            />
            <span className="text-[10.5px] text-slate-400">
              Wajib menggunakan domain resmi <strong>@pspk.id</strong>.
            </span>
          </div>

          {/* Email Pribadi */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="personalEmail" className="font-bold text-slate-700">
              Email Pribadi {formData.createUserAccount && <span className="text-[#A8281C]">*</span>}
            </label>
            <input
              id="personalEmail"
              type="email"
              value={formData.personalEmail}
              onChange={(e) => updateField("personalEmail", e.target.value)}
              placeholder="email.pribadi@gmail.com"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all font-mono"
            />
            <span className="text-[10.5px] text-slate-400">
              Digunakan untuk pengiriman kata sandi awal dan notifikasi akun.
            </span>
          </div>

          {/* Nomor HP / WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="font-bold text-slate-700">
              Nomor Handphone / WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="081234567890"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>

          {/* Telepon Rumah */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="landlinePhone" className="font-bold text-slate-700">
              Telepon Rumah (Opsional)
            </label>
            <input
              id="landlinePhone"
              type="tel"
              value={formData.landlinePhone}
              onChange={(e) => updateField("landlinePhone", e.target.value)}
              placeholder="021-12345678"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>
        </div>
      </FormSection>

      {/* 1.3 Alamat KTP & Domisili */}
      <FormSection
        id="seksi-alamat"
        title="1.3 Alamat Tinggal (KTP & Domisili)"
        subtitle="Alamat terdaftar sesuai KTP dan tempat tinggal saat ini"
        icon={Home}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AddressFields
            title="Alamat Sesuai KTP"
            description="Alamat yang tertera pada Kartu Tanda Penduduk"
            value={addressKtp}
            onChange={setAddressKtp}
            required
          />

          <AddressFields
            title="Alamat Domisili Saat Ini"
            description="Tempat tinggal pegawai saat ini jika berbeda dengan KTP"
            value={addressDomicile}
            onChange={setAddressDomicile}
            syncOption={{
              checked: isDomicileSameAsKtp,
              onChange: handleToggleSameAddress,
              label: "Sama persis dengan Alamat KTP",
            }}
          />
        </div>
      </FormSection>

      {/* 1.4 Kontak Darurat */}
      <FormSection
        id="seksi-kontak-darurat"
        title="1.4 Kontak Darurat (Emergency Contact)"
        subtitle="Keluarga atau pihak terdekat yang dapat dihubungi saat situasi mendesak"
        icon={HeartHandshake}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="emergencyContactName" className="font-bold text-slate-700">
              Nama Kontak Darurat
            </label>
            <input
              id="emergencyContactName"
              type="text"
              value={formData.emergencyContactName}
              onChange={(e) => updateField("emergencyContactName", e.target.value)}
              placeholder="Contoh: Bambang Soedirman"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emergencyContactRelation" className="font-bold text-slate-700">
              Hubungan Keluarga
            </label>
            <input
              id="emergencyContactRelation"
              type="text"
              value={formData.emergencyContactRelation}
              onChange={(e) => updateField("emergencyContactRelation", e.target.value)}
              placeholder="Contoh: Suami / Istri / Orang Tua"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emergencyContactPhone" className="font-bold text-slate-700">
              Nomor Telepon Darurat
            </label>
            <input
              id="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
              placeholder="081298765432"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
