import { SeesListPage } from './components/SeesListPage';
import { requireAuth } from '@/lib/auth';

export default async function Home() {
  // 認証チェック（未認証の場合は/loginにリダイレクト）
  await requireAuth();

  return <SeesListPage />;
}
