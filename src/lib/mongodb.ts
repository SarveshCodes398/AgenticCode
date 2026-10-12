import { MongoClient } from 'mongodb';

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClientPromise = client.connect();
  }

  const client = await globalForMongo.mongoClientPromise;
  return client.db(process.env.MONGODB_DB ?? 'agentic_code');
}

export async function getUsersCollection() {
  const database = await getDatabase();
  return database.collection<UserRecord>('users');
}