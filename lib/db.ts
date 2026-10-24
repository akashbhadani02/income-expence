import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI)
    throw new Error('Please set MONGODB_URI in environment variables');
type Cached = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};
const globalWithMongoose = global as typeof globalThis & {
    mongooseCache?: Cached;
};
const cached = globalWithMongoose.mongooseCache ?? { conn: null, promise: null };
globalWithMongoose.mongooseCache = cached;
export async function connectDB() {
    if (cached.conn)
        return cached.conn;
    if (!cached.promise)
        cached.promise = mongoose.connect(MONGODB_URI!, { bufferCommands: false });
    cached.conn = await cached.promise;
    return cached.conn;
}
