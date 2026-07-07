import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Clean up database before each test
beforeEach(async () => {
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.material.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
