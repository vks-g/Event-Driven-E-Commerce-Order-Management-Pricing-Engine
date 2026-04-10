import Inventory, { type IInventory } from './inventoryModel';

class InventoryRepository {
  async addProduct(productData: Partial<IInventory>): Promise<IInventory> {
    const product = new Inventory(productData);
    return product.save();
  }

  async findBySku(sku: string): Promise<IInventory | null> {
    return Inventory.findOne({ sku });
  }

  async findAll(): Promise<IInventory[]> {
    return Inventory.find().sort({ createdAt: -1 });
  }

  async updateStock(sku: string, stockChange: number, reservedChange: number, currentVersion: number): Promise<boolean> {
    const result = await Inventory.updateOne(
      { sku, version: currentVersion },
      { $inc: { stock: stockChange, reservedStock: reservedChange, version: 1 } }
    );
    return result.matchedCount > 0;
  }

  async updateProduct(sku: string, updateData: Partial<IInventory>): Promise<IInventory | null> {
    return Inventory.findOneAndUpdate({ sku }, updateData, { new: true, runValidators: true });
  }
}

export default new InventoryRepository();
