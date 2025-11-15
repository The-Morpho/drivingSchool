import connectDB, { getDB } from '../db.js';

/**
 * Migration script to copy documents from the old misspelled collection
 * 'Adresses' into the correctly named 'Addresses' collection.
 * - If 'Adresses' doesn't exist, nothing happens.
 * - It inserts documents into 'Addresses' and ignores duplicates where possible.
 */
const migrate = async () => {
  try {
    await connectDB();
    const db = getDB();

    const oldName = 'Adresses';
    const newName = 'Addresses';

    const existing = await db.listCollections({ name: oldName }).toArray();
    if (existing.length === 0) {
      console.log(`No '${oldName}' collection found — nothing to migrate.`);
      process.exit(0);
    }

    const docs = await db.collection(oldName).find().toArray();
    if (!docs.length) {
      console.log(`'${oldName}' collection is empty.`);
      // Drop empty old collection
      await db.collection(oldName).drop();
      console.log(`Dropped empty collection '${oldName}'.`);
      process.exit(0);
    }

    // Prepare docs for insertion into new collection
    // Keep address_id and other fields. We'll remove the old _id so MongoDB will recreate it
    const sanitized = docs.map(({ _id, ...rest }) => ({ ...rest }));

    try {
      const result = await db.collection(newName).insertMany(sanitized, { ordered: false });
      console.log(`Inserted ${result.insertedCount} documents into '${newName}'.`);
    } catch (insertErr) {
      // Ordered:false allows continuing on duplicate key errors; report outcome
      console.warn('Some documents could not be inserted (possible duplicates).', insertErr.message);
    }

    // Optional: drop old collection after copying
    await db.collection(oldName).drop();
    console.log(`Dropped old collection '${oldName}'. Migration complete.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
