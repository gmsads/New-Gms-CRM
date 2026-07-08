const mongoose = require('mongoose');

async function dropIndex() {
  const MONGO_URI = 'mongodb+srv://prasadd313:Prasad123@cluster0.bv44x16.mongodb.net/gms_crm?retryWrites=true&w=majority&appName=Cluster0';
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Atlas DB');

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('quotations');
    
    console.log('Fetching indexes for collection "quotations"...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    const hasQuotationNumberIndex = indexes.some(idx => idx.name === 'quotationNumber_1');
    if (hasQuotationNumberIndex) {
      console.log('Found index "quotationNumber_1", dropping it now...');
      await collection.dropIndex('quotationNumber_1');
      console.log('Successfully dropped index "quotationNumber_1"!');
      
      const newIndexes = await collection.indexes();
      console.log('Updated indexes:', JSON.stringify(newIndexes, null, 2));
    } else {
      console.log('Index "quotationNumber_1" not found. No actions needed.');
    }
  } catch (err) {
    console.error('Error during index drop:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

dropIndex();
