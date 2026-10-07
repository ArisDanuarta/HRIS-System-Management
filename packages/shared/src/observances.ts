/**
 * Modul Hari Peringatan Nasional & Hari Besar Indonesia
 *
 * Menyediakan database kurasi lengkap peringatan nasional di Indonesia (non-libur maupun hari bersejarah),
 * terutama bidang pendidikan, kebijakan, kebangsaan, sosial, dan profesi.
 */

export type ObservanceCategory =
  | "education" // Pendidikan, Literasi, Riset & Anak
  | "national" // Kebangsaan, Sejarah & Pahlawan
  | "culture" // Budaya, Seni & Sosial
  | "profession" // Profesi & Kelembagaan
  | "environment"; // Lingkungan, Kesehatan & Kemanusiaan

export interface NationalObservanceDefinition {
  id: string;
  month: number; // 1-12
  day: number; // 1-31
  name: string;
  shortName?: string;
  description: string;
  category: ObservanceCategory;
  categoryLabel: string;
}

export interface ComputedObservance extends NationalObservanceDefinition {
  dateStr: string; // YYYY-MM-DD
  year: number;
}

export const INDONESIAN_NATIONAL_OBSERVANCES: NationalObservanceDefinition[] = [
  // === JANUARI ===
  {
    id: "obs-01-03",
    month: 1,
    day: 3,
    name: "Hari Amal Bhakti Kementerian Agama RI",
    shortName: "Hari Kemenag",
    description:
      "Memperingati berdirinya Departemen Agama Republik Indonesia pada 3 Januari 1946 dengan menteri pertama H. Rasjidi, mempertegas komitmen kerukunan antarumat beragama di Indonesia.",
    category: "profession",
    categoryLabel: "Kelembagaan Negara",
  },
  {
    id: "obs-01-10",
    month: 1,
    day: 10,
    name: "Hari Gerakan Satu Juta Pohon",
    shortName: "Hari Satu Juta Pohon",
    description:
      "Gerakan nasional pelestarian lingkungan hidup dan mitigasi perubahan iklim melalui penanaman pohon serentak di seluruh wilayah Indonesia.",
    category: "environment",
    categoryLabel: "Lingkungan Hidup",
  },
  {
    id: "obs-01-15",
    month: 1,
    day: 15,
    name: "Hari Dharma Samudera",
    shortName: "Hari Dharma Samudera",
    description:
      "Mengenang heroisme dan gugurnya Komodor Yos Sudarso beserta awak KRI Macan Tutul dalam Pertempuran Laut Aru pada 15 Januari 1962 demi pembebasan Irian Barat.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },
  {
    id: "obs-01-25",
    month: 1,
    day: 25,
    name: "Hari Gizi Nasional (HGN)",
    shortName: "Hari Gizi Nasional",
    description:
      "Peringatan dimulainya pengkaderan tenaga gizi Indonesia oleh Prof. Poorwo Soedarmo pada 1951, sebagai momentum penguatan pemenuhan nutrisi dan penurunan angka stunting anak Indonesia.",
    category: "environment",
    categoryLabel: "Kesehatan & Anak",
  },

  // === FEBRUARI ===
  {
    id: "obs-02-09",
    month: 2,
    day: 9,
    name: "Hari Pers Nasional (HPN)",
    shortName: "Hari Pers Nasional",
    description:
      "Bertepatan dengan hari berdirinya Persatuan Wartawan Indonesia (PWI) pada 9 Februari 1946, merayakan peran strategis pers sebagai pilar keempat demokrasi dan pencerdas bangsa.",
    category: "profession",
    categoryLabel: "Profesi & Demokrasi",
  },
  {
    id: "obs-02-14",
    month: 2,
    day: 14,
    name: "Hari Peringatan Pembela Tanah Air (PETA)",
    shortName: "Hari PETA",
    description:
      "Mengenang pemberontakan bersenjata prajurit PETA di Blitar pada 14 Februari 1945 di bawah kepemimpinan Supriyadi melawan pendudukan militer Jepang.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },
  {
    id: "obs-02-21",
    month: 2,
    day: 21,
    name: "Hari Peduli Sampah Nasional (HPSN)",
    shortName: "Hari Peduli Sampah",
    description:
      "Peringatan mengenang tragedi longsor TPA Leuwigajah pada 2005 serta pengingat kesadaran kolektif pengelolaan sampah sirkular dan pengurangan sampah plastik.",
    category: "environment",
    categoryLabel: "Lingkungan Hidup",
  },

  // === MARET ===
  {
    id: "obs-03-01",
    month: 3,
    day: 1,
    name: "Hari Penegakan Kedaulatan Negara",
    shortName: "Serangan Umum 1 Maret",
    description:
      "Ditetapkan melalui Keppres No. 2 Tahun 2022 untuk memperingati Serangan Umum 1 Maret 1949 di Yogyakarta yang membuktikan kepada dunia internasional bahwa NKRI dan TNI masih berdaulat.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },
  {
    id: "obs-03-08",
    month: 3,
    day: 8,
    name: "Hari Perempuan Internasional",
    shortName: "Hari Perempuan Internasional",
    description:
      "Memperingati perjuangan kesetaraan hak, partisipasi kepemimpinan, perlindungan dari diskriminasi, dan keadilan gender bagi kaum perempuan di seluruh dunia.",
    category: "culture",
    categoryLabel: "Sosial & Kesetaraan",
  },
  {
    id: "obs-03-09",
    month: 3,
    day: 9,
    name: "Hari Musik Nasional",
    shortName: "Hari Musik Nasional",
    description:
      "Peringatan hari lahir komponis pencipta lagu kebangsaan 'Indonesia Raya', Wage Rudolf Soepratman, sebagai bentuk apresiasi terhadap kekayaan musik dan seniman nusantara.",
    category: "culture",
    categoryLabel: "Seni & Budaya",
  },
  {
    id: "obs-03-24",
    month: 3,
    day: 24,
    name: "Hari Peringatan Bandung Lautan Api",
    shortName: "Bandung Lautan Api",
    description:
      "Mengenang peristiwa pembumihangusan kota Bandung Selatan oleh para pejuang dan warga pada 24 Maret 1946 demi mencegah penguasaan kota oleh tentara Sekutu dan NICA.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },
  {
    id: "obs-03-30",
    month: 3,
    day: 3,
    name: "Hari Film Nasional",
    shortName: "Hari Film Nasional",
    description:
      "Menandai hari pertama proses syuting film Indonesia 'Darah dan Doa' (Long March of Siliwangi) karya sutradara Usmar Ismail pada 30 Maret 1950, tonggak sinema mandiri bangsa.",
    category: "culture",
    categoryLabel: "Seni & Budaya",
  },

  // === APRIL ===
  {
    id: "obs-04-06",
    month: 4,
    day: 6,
    name: "Hari Nelayan Nasional",
    shortName: "Hari Nelayan",
    description:
      "Penghormatan atas dedikasi dan jerih payah para nelayan Indonesia yang menjaga kedaulatan pangan bahari di negara kepulauan terbesar di dunia.",
    category: "profession",
    categoryLabel: "Kemaritiman & Profesi",
  },
  {
    id: "obs-04-09",
    month: 4,
    day: 9,
    name: "Hari Tentara Nasional Indonesia Angkatan Udara (TNI AU)",
    shortName: "Hari TNI AU",
    description:
      "Hari lahirnya Angkatan Udara Republik Indonesia pada 9 April 1946, pilar pengawal kedaulatan dirgantara nusantara.",
    category: "profession",
    categoryLabel: "Pertahanan Negara",
  },
  {
    id: "obs-04-21",
    month: 4,
    day: 21,
    name: "Hari Kartini",
    shortName: "Hari Kartini",
    description:
      "Memperingati kelahiran Raden Ajeng Kartini (1879), pahlawan pelopor emansipasi wanita, kebebasan berpikir, dan hak akses pendidikan bagi seluruh perempuan Indonesia.",
    category: "education",
    categoryLabel: "Pendidikan & Kesetaraan",
  },
  {
    id: "obs-04-22",
    month: 4,
    day: 22,
    name: "Hari Bumi (Earth Day)",
    shortName: "Hari Bumi",
    description:
      "Peringatan internasional untuk menumbuhkan aksi nyata pelestarian biosfer, restorasi hutan, energi bersih, dan perlindungan ekosistem bumi dari pemanasan global.",
    category: "environment",
    categoryLabel: "Lingkungan Hidup",
  },
  {
    id: "obs-04-28",
    month: 4,
    day: 28,
    name: "Hari Puisi Nasional",
    shortName: "Hari Puisi Nasional",
    description:
      "Mengenang wafatnya penyair angkatan '45 Chairil Anwar pada 28 April 1949, sosok pelopor sastra modern Indonesia dengan semangat perjuangan merdeka yang menyala-nyala.",
    category: "culture",
    categoryLabel: "Sastra & Bahasa",
  },

  // === MEI ===
  {
    id: "obs-05-02",
    month: 5,
    day: 2,
    name: "Hari Pendidikan Nasional (Hardiknas)",
    shortName: "Hardiknas",
    description:
      "Memperingati hari kelahiran Ki Hadjar Dewantara (2 Mei 1889), Bapak Pendidikan Nasional dan pendiri Perguruan Taman Siswa. Menjadi momentum refleksi reformasi pendidikan, filosofi 'Ing Ngarsa Sung Tuladha, Ing Madya Mangun Karsa, Tut Wuri Handayani', serta pemerataan mutu pembelajaran di Indonesia.",
    category: "education",
    categoryLabel: "Pendidikan & Kebijakan",
  },
  {
    id: "obs-05-17",
    month: 5,
    day: 17,
    name: "Hari Buku Nasional",
    shortName: "Hari Buku Nasional",
    description:
      "Dicanangkan pada 17 Mei 2002 bertepatan dengan tanggal berdirinya Perpustakaan Nasional RI (1980), sebagai penggerak budaya gemar membaca dan literasi kritis anak bangsa.",
    category: "education",
    categoryLabel: "Literasi & Buku",
  },
  {
    id: "obs-05-20",
    month: 5,
    day: 20,
    name: "Hari Kebangkitan Nasional (Harkitnas)",
    shortName: "Harkitnas",
    description:
      "Memperingati berdirinya organisasi pergerakan Boedi Oetomo pada 20 Mei 1908 oleh Dr. Soetomo dan para mahasiswa STOVIA, menjadi awal tumbuhnya kesadaran nasionalisme Indonesia modern.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },
  {
    id: "obs-05-21",
    month: 5,
    day: 21,
    name: "Hari Peringatan Reformasi Nasional",
    shortName: "Hari Reformasi",
    description:
      "Mengenang momentum mundurnya Presiden Soeharto pada 21 Mei 1998 yang mengawali era reformasi demokrasi, kebebasan berekspresi, supremasi hukum, dan desentralisasi di Indonesia.",
    category: "national",
    categoryLabel: "Demokrasi & Tata Kelola",
  },
  {
    id: "obs-05-29",
    month: 5,
    day: 29,
    name: "Hari Lanjut Usia Nasional (HLUN)",
    shortName: "Hari Lansia",
    description:
      "Apresiasi terhadap kebijaksanaan dan pengabdian para lanjut usia Indonesia, serta komitmen perlindungan sosial dan kesehatan usia senja.",
    category: "culture",
    categoryLabel: "Kesejahteraan Sosial",
  },

  // === JUNI ===
  {
    id: "obs-06-01",
    month: 6,
    day: 1,
    name: "Hari Lahir Pancasila",
    shortName: "Hari Lahir Pancasila",
    description:
      "Memperingati pidato pertama Ir. Soekarno pada 1 Juni 1945 di hadapan sidang BPUPKI yang menguraikan konsep dasar negara Pancasila sebagai pandangan hidup bangsa Indonesia.",
    category: "national",
    categoryLabel: "Ideologi Bangsa",
  },
  {
    id: "obs-06-05",
    month: 6,
    day: 5,
    name: "Hari Lingkungan Hidup Sedunia",
    shortName: "Hari Lingkungan Hidup",
    description:
      "Peringatan internasional United Nations Environment Programme (UNEP) yang diperingati sejak 1974 untuk menggalang aksi penyelamatan ekosistem bumi dan keanekaragaman hayati.",
    category: "environment",
    categoryLabel: "Lingkungan Hidup",
  },
  {
    id: "obs-06-21",
    month: 6,
    day: 21,
    name: "Hari Krida Pertanian",
    shortName: "Hari Krida Pertanian",
    description:
      "Hari bersyukur dan apresiasi atas kerja keras masyarakat pertanian, peternakan, perikanan, dan perkebunan dalam mewujudkan ketahanan pangan nusantara.",
    category: "profession",
    categoryLabel: "Pertanian & Pangan",
  },
  {
    id: "obs-06-24",
    month: 6,
    day: 24,
    name: "Hari Bidan Nasional",
    shortName: "Hari Bidan",
    description:
      "Memperingati berdirinya Ikatan Bidan Indonesia (IBI) pada 1951 dan dedikasi garda terdepan kesehatan ibu, persalinan aman, dan tumbuh kembang bayi di pelosok negeri.",
    category: "profession",
    categoryLabel: "Kesehatan Ibu & Anak",
  },
  {
    id: "obs-06-29",
    month: 6,
    day: 29,
    name: "Hari Keluarga Nasional (Harganas)",
    shortName: "Harganas",
    description:
      "Mengingatkan kembali bahwa keluarga adalah unit sosial terkecil yang menjadi fondasi karakter, budi pekerti, dan masa depan generasi penerus bangsa.",
    category: "culture",
    categoryLabel: "Pemberdayaan Keluarga",
  },

  // === JULI ===
  {
    id: "obs-07-01",
    month: 7,
    day: 1,
    name: "Hari Bhayangkara (POLRI)",
    shortName: "Hari Bhayangkara",
    description:
      "Peringatan penetapan Kepolisian Negara Republik Indonesia sebagai institusi mandiri di bawah Perdana Menteri pada 1 Juli 1946 melalui Penetapan Pemerintah No. 11/S.D.",
    category: "profession",
    categoryLabel: "Ketertiban & Hukum",
  },
  {
    id: "obs-07-05",
    month: 7,
    day: 5,
    name: "Hari Bank Indonesia",
    shortName: "Hari Bank Indonesia",
    description:
      "Memperingati berdirinya Bank Negara Indonesia (BNI) sebagai bank pertama milik pemerintah RI pada 5 Juli 1946 pasca kemerdekaan.",
    category: "profession",
    categoryLabel: "Moneter & Keuangan",
  },
  {
    id: "obs-07-12",
    month: 7,
    day: 12,
    name: "Hari Koperasi Indonesia",
    shortName: "Hari Koperasi",
    description:
      "Memperingati Kongres Koperasi Pertama di Tasikmalaya pada 12 Juli 1947, pilar ekonomi kerakyatan dan asas kekeluargaan yang diperjuangkan Bung Hatta.",
    category: "profession",
    categoryLabel: "Ekonomi Kerakyatan",
  },
  {
    id: "obs-07-22",
    month: 7,
    day: 22,
    name: "Hari Kejaksaan RI (Hari Bhakti Adhyaksa)",
    shortName: "Bhakti Adhyaksa",
    description:
      "Peringatan kelahiran Kejaksaan RI sebagai lembaga penegak hukum independen yang berintegritas demi kepastian hukum dan keadilan masyarakat.",
    category: "profession",
    categoryLabel: "Penegakan Hukum",
  },
  {
    id: "obs-07-23",
    month: 7,
    day: 23,
    name: "Hari Anak Nasional (HAN)",
    shortName: "Hari Anak Nasional",
    description:
      "Ditetapkan melalui Keppres No. 44 Tahun 1984 untuk menjamin hak hidup, hak tumbuh kembang, hak perlindungan dari kekerasan, serta hak partisipasi bagi seluruh anak Indonesia.",
    category: "education",
    categoryLabel: "Anak & Perlindungan",
  },

  // === AGUSTUS ===
  {
    id: "obs-08-10",
    month: 8,
    day: 10,
    name: "Hari Kebangkitan Teknologi Nasional (Hakteknas)",
    shortName: "Hakteknas",
    description:
      "Memperingati penerbangan perdana pesawat terbang rancangan putra bangsa N-250 Gatotkaca pada 10 Agustus 1995 di Bandung karya B.J. Habibie, simbol kemajuan riset dan inovasi kedirgantaraan RI.",
    category: "education",
    categoryLabel: "Riset & Teknologi",
  },
  {
    id: "obs-08-14",
    month: 8,
    day: 14,
    name: "Hari Pramuka (Praja Muda Karana)",
    shortName: "Hari Pramuka",
    description:
      "Memperingati pelantikan pimpinan Gerakan Pramuka dan penganugerahan Panji Gerakan Pramuka oleh Presiden Soekarno pada 14 Agustus 1961 di Istana Negara.",
    category: "education",
    categoryLabel: "Karakter & Pemuda",
  },
  {
    id: "obs-08-17",
    month: 8,
    day: 17,
    name: "Hari Proklamasi Kemerdekaan RI",
    shortName: "HUT RI",
    description:
      "Peringatan sakral detik-detik pembacaan teks Proklamasi Kemerdekaan oleh Soekarno-Hatta pada 17 Agustus 1945 di Jalan Pegangsaan Timur 56 Jakarta, tonggak lahirnya Negara Kesatuan Republik Indonesia.",
    category: "national",
    categoryLabel: "Kemerdekaan RI",
  },
  {
    id: "obs-08-18",
    month: 8,
    day: 18,
    name: "Hari Konstitusi Republik Indonesia",
    shortName: "Hari Konstitusi",
    description:
      "Mengenang sidang PPKI 18 Agustus 1945 yang menetapkan Undang-Undang Dasar 1945 sebagai hukum dasar tertulis tertinggi negara dan memilih Presiden serta Wakil Presiden pertama.",
    category: "national",
    categoryLabel: "Konstitusi & Hukum",
  },

  // === SEPTEMBER ===
  {
    id: "obs-09-01",
    month: 9,
    day: 1,
    name: "Hari Polisi Wanita (Polwan)",
    shortName: "Hari Polwan",
    description:
      "Peringatan penerimaan enam wanita pertama sebagai perwira polisi di Bukittinggi pada 1 September 1948, pelopor keterlibatan wanita dalam kepolisian.",
    category: "profession",
    categoryLabel: "Profesi & Kesetaraan",
  },
  {
    id: "obs-09-08",
    month: 9,
    day: 8,
    name: "Hari Aksara Internasional (Hari Literasi)",
    shortName: "Hari Aksara",
    description:
      "Peringatan internasional untuk menuntaskan buta huruf, memperluas akses membaca dan bahan ajar berkualitas, serta memperkuat kecakapan literasi digital masyarakat.",
    category: "education",
    categoryLabel: "Pendidikan & Literasi",
  },
  {
    id: "obs-09-09",
    month: 9,
    day: 9,
    name: "Hari Olahraga Nasional (Haornas)",
    shortName: "Haornas",
    description:
      "Memperingati pembukaan Pekan Olahraga Nasional (PON) pertama di Surakarta pada 9 September 1948, menyalakan semangat sportivitas dan kesehatan jasmani masyarakat.",
    category: "culture",
    categoryLabel: "Olahraga & Prestasi",
  },
  {
    id: "obs-09-11",
    month: 9,
    day: 11,
    name: "Hari Radio Republik Indonesia (Hari RRI)",
    shortName: "Hari RRI",
    description:
      "Peringatan berdirinya Radio Republik Indonesia pada 11 September 1945 dengan semboyan 'Sekali di Udara Tetap di Udara', corong perjuangan informasi kemerdekaan.",
    category: "profession",
    categoryLabel: "Media & Informasi",
  },
  {
    id: "obs-09-17",
    month: 9,
    day: 17,
    name: "Hari Palang Merah Indonesia (PMI)",
    shortName: "Hari PMI",
    description:
      "Memperingati pembentukan PMI pada 17 September 1945 atas instruksi Presiden Soekarno di bawah kepemimpinan Wakil Presiden Mohammad Hatta.",
    category: "environment",
    categoryLabel: "Kemanusiaan",
  },
  {
    id: "obs-09-24",
    month: 9,
    day: 24,
    name: "Hari Tani Nasional",
    shortName: "Hari Tani",
    description:
      "Memperingati disahkannya Undang-Undang Pokok Agraria (UUPA) No. 5 Tahun 1960 untuk mewujudkan reforma agraria, keadilan distribusi lahan, dan kedaulatan pangan para petani.",
    category: "profession",
    categoryLabel: "Agraria & Pangan",
  },
  {
    id: "obs-09-28",
    month: 9,
    day: 28,
    name: "Hari Kereta Api Nasional",
    shortName: "Hari Kereta Api",
    description:
      "Memperingati pengambilalihan Balai Besar Kereta Api Bandung dari kekuasaan militer Jepang oleh para buruh kereta api Indonesia pada 28 September 1945.",
    category: "profession",
    categoryLabel: "Transportasi Publik",
  },
  {
    id: "obs-09-30",
    month: 9,
    day: 30,
    name: "Hari Peringatan Pemberontakan G30S/PKI",
    shortName: "Peringatan G30S/PKI",
    description:
      "Hari peringatan berkabung nasional mengenang gugurnya para perwira tinggi TNI Angkatan Darat yang dianugerahi gelar Pahlawan Revolusi dalam peristiwa 30 September 1965.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },

  // === OKTOBER ===
  {
    id: "obs-10-01",
    month: 10,
    day: 1,
    name: "Hari Kesaktian Pancasila",
    shortName: "Kesaktian Pancasila",
    description:
      "Peringatan nasional untuk meneguhkan kembali komitmen kebangsaan bahwa ideologi Pancasila senantiasa kokoh dan sakti dalam mempertahankan keutuhan Negara Kesatuan Republik Indonesia.",
    category: "national",
    categoryLabel: "Ideologi Bangsa",
  },
  {
    id: "obs-10-02",
    month: 10,
    day: 2,
    name: "Hari Batik Nasional",
    shortName: "Hari Batik",
    description:
      "Merayakan penetapan batik Indonesia sebagai Warisan Kemanusiaan untuk Budaya Lisan dan Nonbendawi (Masterpiece of the Oral and Intangible Heritage of Humanity) oleh UNESCO pada 2 Oktober 2009.",
    category: "culture",
    categoryLabel: "Warisan Budaya",
  },
  {
    id: "obs-10-05",
    month: 10,
    day: 5,
    name: "Hari Tentara Nasional Indonesia (TNI) & Hari Guru Sedunia",
    shortName: "HUT TNI / Guru Sedunia",
    description:
      "Memperingati pembentukan Tentara Keamanan Rakyat (TKR) pada 5 Oktober 1945, serta bertepatan dengan World Teachers' Day UNESCO yang mengapresiasi guru di seluruh dunia.",
    category: "national",
    categoryLabel: "Pertahanan & Guru",
  },
  {
    id: "obs-10-22",
    month: 10,
    day: 22,
    name: "Hari Santri Nasional",
    shortName: "Hari Santri",
    description:
      "Ditetapkan melalui Keppres No. 22 Tahun 2015 untuk memperingati Resolusi Jihad 22 Oktober 1945 yang dicetuskan oleh KH Hasyim Asy'ari demi menggerakkan perlawanan membela tanah air.",
    category: "national",
    categoryLabel: "Kebangsaan & Agama",
  },
  {
    id: "obs-10-24",
    month: 10,
    day: 24,
    name: "Hari Dokter Indonesia (Hari IDI)",
    shortName: "Hari Dokter",
    description:
      "Memperingati berdirinya Ikatan Dokter Indonesia (IDI) pada 24 Oktober 1950, perkumpulan profesi medis yang mengabdikan diri bagi kesehatan masyarakat.",
    category: "profession",
    categoryLabel: "Kesehatan & Medis",
  },
  {
    id: "obs-10-28",
    month: 10,
    day: 28,
    name: "Hari Sumpah Pemuda",
    shortName: "Sumpah Pemuda",
    description:
      "Memperingati ikrar bersejarah para pemuda nusantara pada Kongres Pemuda II di Batavia pada 28 Oktober 1928: Satu Nusa, Satu Bangsa, dan Menjunjung Bahasa Persatuan, Bahasa Indonesia.",
    category: "national",
    categoryLabel: "Kebangsaan & Pemuda",
  },
  {
    id: "obs-10-30",
    month: 10,
    day: 30,
    name: "Hari Keuangan Nasional (Hari Oeang Republik Indonesia)",
    shortName: "Hari Keuangan (HORI)",
    description:
      "Memperingati penerbitan pertama Oeang Republik Indonesia (ORI) pada 30 Oktober 1946 sebagai simbol kedaulatan moneter dan ekonomi negara merdeka.",
    category: "profession",
    categoryLabel: "Keuangan Negara",
  },

  // === NOVEMBER ===
  {
    id: "obs-11-10",
    month: 11,
    day: 10,
    name: "Hari Pahlawan",
    shortName: "Hari Pahlawan",
    description:
      "Mengenang pertempuran sengit di Surabaya pada 10 November 1945 yang dipimpin Bung Tomo dan para arek-arek Suroboyo dalam mempertahankan kedaulatan RI dari agresi tentara Sekutu.",
    category: "national",
    categoryLabel: "Kebangsaan & Pahlawan",
  },
  {
    id: "obs-11-12",
    month: 11,
    day: 12,
    name: "Hari Kesehatan Nasional (HKN) & Hari Ayah Nasional",
    shortName: "Hari Kesehatan / Ayah",
    description:
      "Mengenang keberhasilan pemberantasan wabah malaria tahun 1959 di bawah Presiden Soekarno serta hari apresiasi atas figur dan kasih sayang seorang ayah dalam keluarga.",
    category: "environment",
    categoryLabel: "Kesehatan & Keluarga",
  },
  {
    id: "obs-11-20",
    month: 11,
    day: 20,
    name: "Hari Anak Sedunia (Universal Children's Day)",
    shortName: "Hari Anak Sedunia",
    description:
      "Peringatan pengadopsian Konvensi Hak Anak PBB tahun 1989 untuk mempromosikan kebersamaan internasional, kesadaran hak anak, dan kesejahteraan anak-anak dunia.",
    category: "education",
    categoryLabel: "Pendidikan & Anak",
  },
  {
    id: "obs-11-25",
    month: 11,
    day: 25,
    name: "Hari Guru Nasional (HGN)",
    shortName: "Hari Guru Nasional",
    description:
      "Memperingati berdirinya Persatuan Guru Republik Indonesia (PGRI) pada Kongres Guru di Surakarta 24–25 November 1945. Momentum luhur penghormatan kepada guru sebagai pahlawan tanpa tanda jasa, pembentuk nalar kritis anak bangsa, dan motor kemajuan pendidikan Indonesia.",
    category: "education",
    categoryLabel: "Pendidikan & Kebijakan",
  },
  {
    id: "obs-11-28",
    month: 11,
    day: 28,
    name: "Hari Menanam Pohon Indonesia (HMPI)",
    shortName: "Hari Menanam Pohon",
    description:
      "Aksi serentak nasional rehabilitasi hutan dan lahan kritis serta pencegahan degradasi lingkungan hidup di seluruh Indonesia.",
    category: "environment",
    categoryLabel: "Lingkungan Hidup",
  },
  {
    id: "obs-11-29",
    month: 11,
    day: 29,
    name: "Hari Korps Pegawai Republik Indonesia (KORPRI)",
    shortName: "Hari KORPRI",
    description:
      "Memperingati berdirinya KORPRI pada 29 November 1971 sebagai wadah aparatur sipil negara dan abdi masyarakat dalam memberikan pelayanan publik yang berintegritas.",
    category: "profession",
    categoryLabel: "Aparatur Negara",
  },

  // === DESEMBER ===
  {
    id: "obs-12-01",
    month: 12,
    day: 1,
    name: "Hari AIDS Sedunia",
    shortName: "Hari AIDS Sedunia",
    description:
      "Peringatan solidaritas global untuk menumbuhkan kesadaran pencegahan penularan HIV/AIDS, melawan stigma terhadap ODHA, dan memperluas akses pengobatan.",
    category: "environment",
    categoryLabel: "Kesehatan Global",
  },
  {
    id: "obs-12-03",
    month: 12,
    day: 3,
    name: "Hari Disabilitas Internasional",
    shortName: "Hari Disabilitas",
    description:
      "Mendorong aksesibilitas universal, perlindungan hak-hak penyandang disabilitas, dan inklusivitas tanpa diskriminasi dalam pendidikan, pekerjaan, dan ruang publik.",
    category: "culture",
    categoryLabel: "Inklusi & Hak Asasi",
  },
  {
    id: "obs-12-09",
    month: 12,
    day: 9,
    name: "Hari Antikorupsi Sedunia (Hakordia)",
    shortName: "Hakordia",
    description:
      "Peringatan internasional untuk memperkuat komitmen integritas, tata kelola pemerintahan yang transparan dan akuntabel, serta pencegahan korupsi di seluruh lini institusi.",
    category: "national",
    categoryLabel: "Tata Kelola & Integritas",
  },
  {
    id: "obs-12-10",
    month: 12,
    day: 10,
    name: "Hari Hak Asasi Manusia (HAM) Sedunia",
    shortName: "Hari HAM",
    description:
      "Memperingati pengadopsian Deklarasi Universal Hak Asasi Manusia (UDHR) oleh Majelis Umum PBB pada 10 Desember 1948, piagam universal perlindungan martabat setiap insan.",
    category: "national",
    categoryLabel: "Hak Asasi Manusia",
  },
  {
    id: "obs-12-13",
    month: 12,
    day: 13,
    name: "Hari Nusantara",
    shortName: "Hari Nusantara",
    description:
      "Memperingati Deklarasi Djuanda pada 13 Desember 1957 yang menegaskan bahwa seluruh perairan di antara dan yang menghubungkan pulau-pulau di Indonesia adalah wilayah kedaulatan mutlak NKRI.",
    category: "national",
    categoryLabel: "Kedaulatan Maritim",
  },
  {
    id: "obs-12-19",
    month: 12,
    day: 19,
    name: "Hari Bela Negara",
    shortName: "Hari Bela Negara",
    description:
      "Mengenang deklarasi Pemerintahan Darurat Republik Indonesia (PDRI) oleh Mr. Sjafruddin Prawiranegara di Sumatera Barat pada 19 Desember 1948 yang menyelamatkan eksistensi NKRI saat Yogyakarta diduduki Belanda.",
    category: "national",
    categoryLabel: "Kebangsaan & Sejarah",
  },
  {
    id: "obs-12-22",
    month: 12,
    day: 22,
    name: "Hari Ibu",
    shortName: "Hari Ibu",
    description:
      "Memperingati Kongres Perempuan Indonesia Pertama pada 22–25 Desember 1928 di Ndalem Joyodipuran Yogyakarta, tonggak persatuan organisasi pergerakan perempuan nusantara demi kemerdekaan dan keadilan sosial.",
    category: "culture",
    categoryLabel: "Pergerakan Perempuan",
  },
];

/**
 * Mengambil daftar hari peringatan nasional yang jatuh pada bulan dan tahun tertentu.
 */
export function getIndonesianObservancesForMonth(
  year: number,
  month: number,
): ComputedObservance[] {
  const filtered = INDONESIAN_NATIONAL_OBSERVANCES.filter((obs) => obs.month === month);

  return filtered.map((obs) => {
    const monthPadded = String(month).padStart(2, "0");
    const dayPadded = String(obs.day).padStart(2, "0");
    const dateStr = `${year}-${monthPadded}-${dayPadded}`;

    return {
      ...obs,
      year,
      dateStr,
    };
  });
}

/**
 * Mencari hari peringatan nasional pada tanggal tertentu (YYYY-MM-DD).
 */
export function getIndonesianObservancesForDate(
  year: number,
  month: number,
  day: number,
): ComputedObservance[] {
  const filtered = INDONESIAN_NATIONAL_OBSERVANCES.filter(
    (obs) => obs.month === month && obs.day === day,
  );

  const monthPadded = String(month).padStart(2, "0");
  const dayPadded = String(day).padStart(2, "0");
  const dateStr = `${year}-${monthPadded}-${dayPadded}`;

  return filtered.map((obs) => ({
    ...obs,
    year,
    dateStr,
  }));
}
