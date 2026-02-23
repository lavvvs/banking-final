const mongoose = require("mongoose");

async function clearDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);

  const collections = [
    "profiles",
    "accounts",
    "transactions",
    "loans",
    "emipayments",
    "banksettings",
  ];

  for (const collection of collections) {
    await mongoose.connection.db.collection(collection).deleteMany({});
    console.log(`Cleared ${collection}`);
  }

  await mongoose.disconnect();
  console.log("Database cleared!");
}

clearDatabase();
