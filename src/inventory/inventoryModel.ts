import mongoose, { Document, Model } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  sku: string;
  basePrice: number;
  category?: string;
  stock: number;
  reservedStock: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new mongoose.Schema<IInventory>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    category: { type: String },
    stock: { type: Number, required: true, default: 0, min: 0 },
    reservedStock: { type: Number, required: true, default: 0, min: 0 },
    version: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

inventorySchema.index({ sku: 1 }, { unique: true });

const Inventory: Model<IInventory> = mongoose.model<IInventory>('Inventory', inventorySchema);
export default Inventory;
