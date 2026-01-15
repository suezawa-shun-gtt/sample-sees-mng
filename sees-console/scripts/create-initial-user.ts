import { PrismaClient } from '../app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('system77', 10);
  
  const user = await prisma.user.create({
    data: {
      name: '末澤舜',
      email: 'shun.suezawa@govtechtokyo.or.jp',
      password: hashedPassword,
      role: 2,
    },
  });

  console.log('✓ ユーザーを作成しました:');
  console.log(`  ID: ${user.id}`);
  console.log(`  名前: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  権限: ${user.role} (管理者)`);
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
