import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dummyFingerprints = [
    { hash: 12345, origStart: 0, origEnd: 5 },
    { hash: 67890, origStart: 6, origEnd: 11 }
  ];

  try {
    const doc = await prisma.document.create({
      data: {
        title: "Test Debug Doc",
        fileName: "test-debug.txt",
        content: "Hello World",
        // Try passing the array of objects directly first
        fingerprints: dummyFingerprints as any,
      }
    });
    console.log("Success with direct object cast:", doc.id);
  } catch (error) {
    console.error("Failed with direct cast:", error);
    
    // Try passing a JSON string representation if direct fails
    try {
      const doc2 = await prisma.document.create({
        data: {
          title: "Test Debug Doc 2",
          fileName: "test-debug2.txt",
          content: "Hello World",
          // The other way Prisma accepts JSON
          fingerprints: JSON.stringify(dummyFingerprints) as any,
        }
      });
      console.log("Success with JSON.stringify cast:", doc2.id);
    } catch (error2) {
      console.error("Failed with JSON.stringify cast:", error2);
    }
  }

  // Cleanup
  await prisma.document.deleteMany({
    where: { fileName: { startsWith: "test-debug" } }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // pool.end(); // we'll let node exit naturally
  });
