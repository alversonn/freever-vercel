import { redirect } from 'next/navigation';

export default function HomePage() {
  // Arahkan pengguna secara permanen ke halaman asesmen baru
  redirect('/assessment');

  // Komponen ini tidak akan pernah me-render apapun
  // karena redirect terjadi di sisi server.
  return null;
}