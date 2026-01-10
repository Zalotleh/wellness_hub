import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  console.log('🆕 Create New User\n');
  
  const email = await question('Email: ') || 'test@example.com';
  const password = await question('Password (default: password123): ') || 'password123';
  const name = await question('Name (default: Test User): ') || 'Test User';
  
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existing) {
      console.log(`\n❌ User with email ${email} already exists!`);
      console.log(`   User ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      rl.close();
      process.exit(1);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'active',
        termsAccepted: true,
        privacyAccepted: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });
    
    console.log('\n✅ User created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 You can now sign in at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('\n❌ Error creating user:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createUser();
