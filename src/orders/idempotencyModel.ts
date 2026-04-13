import mongoose, { Document, Model } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  response: unknown;
  statusCode: number;
  createdAt: Date;
}

const idempotencyKeySchema = new mongoose.Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true },
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  statusCode: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

const IdempotencyKey: Model<IIdempotencyKey> = mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
export default IdempotencyKey;
