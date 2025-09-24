/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // PERINGATAN: Mengizinkan build produksi untuk berhasil
    // meskipun proyek Anda memiliki error tipe data.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;