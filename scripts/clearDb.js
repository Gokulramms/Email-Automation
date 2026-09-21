const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function clearDatabase() {
  console.log("Cleaning all mock and demo data from mailops.db...");

  await db.appNotification.deleteMany({});
  await db.activity.deleteMany({});
  await db.gmailMessage.deleteMany({});
  await db.gmailThread.deleteMany({});
  await db.workplaceRecipient.deleteMany({});
  await db.workplace.deleteMany({});
  await db.account.deleteMany({});
  
  await db.appSettings.upsert({
    where: { id: "default" },
    update: {
      demoMode: false,
    },
    create: {
      id: "default",
      authorizedEmail: "gokulramms@gmail.com",
      syncIntervalSeconds: 90,
      defaultTimerValue: 3,
      defaultTimerUnit: "days",
      timezone: "Asia/Kolkata",
      aiEnabled: false,
      demoMode: false,
      syncFromDate: "2026-09-15",
    },
  });

  console.log("SUCCESS: All mock data deleted! Database is completely empty and ready.");
}

clearDatabase()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
