import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import prisma from '../src/prismaClient';

dotenv.config();

async function seedAdmin() {
    console.log('🔐 Seeding initial Admin user...');

    const email = 'admin@kyndo.com';
    const password = 'admin123'; // Default password

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`⚠️ Admin user ${email} already exists. Skipping.`);
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data: {
            email,
            passwordHash,
            username: 'KYNDO Admin',
            role: 'admin',
        },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n¡Utiliza estas credenciales para entrar al panel de administración!');
}

seedAdmin()
    .catch((e) => {
        console.error('❌ Admin seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
