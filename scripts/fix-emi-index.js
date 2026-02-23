// scripts/fix-emi-index.js
// Run this once to fix the index issue

require("dotenv").config({ path: ".env" });
const { MongoClient } = require("mongodb");

async function fixEMIIndex() {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("BANKING");
    const collection = db.collection("emipayments");

    // Get all indexes
    const indexes = await collection.indexes();
    console.log(
      "📋 Current indexes:",
      indexes.map((i) => i.name)
    );

    // Drop the problematic transactionId_1 index
    try {
      await collection.dropIndex("transactionId_1");
      console.log("✅ Dropped transactionId_1 index");
    } catch (error) {
      if (error.code === 27) {
        console.log("ℹ️  transactionId_1 index does not exist (already fixed)");
      } else {
        throw error;
      }
    }

    // Optionally: Create a sparse index (allows multiple nulls)
    await collection.createIndex(
      { transactionId: 1 },
      { sparse: true, name: "transactionId_sparse" }
    );
    console.log("✅ Created sparse index on transactionId");

    console.log("🎉 Index fix completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("👋 Disconnected from MongoDB");
  }
}

fixEMIIndex();
