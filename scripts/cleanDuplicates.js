const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function cleanDuplicates() {
  console.log("Removing duplicate WorkplaceRecipient entries...");

  await db.workplaceRecipient.deleteMany({});
  await db.workplace.deleteMany({});
  
  console.log("Cleaned all existing recipient entries!");
}

cleanDuplicates()
  .catch(console.error)
  .finally(() => db.$disconnect());
