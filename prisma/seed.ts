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

  // 2. Remove any previous default songs
  await prisma.song.deleteMany({
    where: {
      title: {
        in: ['Midnight Pulse', 'Velvet Horizons', 'Starlight Drift'],
      },
    },
  });

  // Find or create Abener Tagesse Album
  let album = await prisma.album.findFirst({
    where: {
      OR: [
        { artist: 'Abener Tagesse' },
        { title: 'Neon Echoes' },
      ],
    },
  });

  if (album) {
    album = await prisma.album.update({
      where: { id: album.id },
      data: {
        title: 'ንጉሥ (King His)',
        artist: 'Abener Tagesse',
        coverUrl: '/album-cover.jpg',
      },
    });
  } else {
    album = await prisma.album.create({
      data: {
        title: 'ንጉሥ (King His)',
        artist: 'Abener Tagesse',
        coverUrl: '/album-cover.jpg',
      },
    });
  }

  // Delete existing songs for this album to ensure clean state
  await prisma.song.deleteMany({
    where: { albumId: album.id },
  });

  // Create Gospel Music Video track
  const videoTrack = await prisma.song.create({
    data: {
      title: 'ንጉሥ (King His) - Official Music Video',
      duration: 245,
      r2Key: 'king-his-video.mp4',
      trackNo: 1,
      albumId: album.id,
    },
  });

  console.log(`🎵 Video album configured: "${album.title}" by ${album.artist} with track "${videoTrack.title}"`);

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
