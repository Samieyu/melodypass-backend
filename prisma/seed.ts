import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MelodyPass database seed...');

  // 1. Create Admin Users
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const supportPasswordHash = await bcrypt.hash('SupportPass123!', 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@melodypass.com' },
    update: {},
    create: {
      email: 'admin@melodypass.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });

  const support = await prisma.adminUser.upsert({
    where: { email: 'support@melodypass.com' },
    update: {},
    create: {
      email: 'support@melodypass.com',
      passwordHash: supportPasswordHash,
      role: 'support',
    },
  });

  console.log(`👤 Admin Users created: ${admin.email} (admin), ${support.email} (support)`);

  // 2. Create Sample Album
  const album = await prisma.album.create({
    data: {
      title: 'Neon Echoes',
      artist: 'Aura V',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop',
      songs: {
        create: [
          {
            title: 'Midnight Pulse',
            duration: 215,
            r2Key: 'sample-song-1.mp3',
            trackNo: 1,
          },
          {
            title: 'Velvet Horizons',
            duration: 198,
            r2Key: 'sample-song-2.mp3',
            trackNo: 2,
          },
          {
            title: 'Starlight Drift',
            duration: 240,
            r2Key: 'sample-song-3.mp3',
            trackNo: 3,
          },
        ],
      },
    },
    include: {
      songs: true,
    },
  });

  console.log(`🎵 Album created: "${album.title}" by ${album.artist} with ${album.songs.length} songs`);

  // 3. Create Sample Access Codes
  const sampleCodes = ['K8N9P2', 'X4M7R3', 'H9J2W5', 'B3T6V8', 'Z7Y4Q9'];

  for (const code of sampleCodes) {
    await prisma.accessCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        albumId: album.id,
      },
    });
  }

  console.log(`🔑 Created ${sampleCodes.length} access codes: ${sampleCodes.join(', ')}`);
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
