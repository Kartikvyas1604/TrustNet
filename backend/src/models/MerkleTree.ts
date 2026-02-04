import mongoose, { Schema, Document } from 'mongoose';

export interface IMerkleLeaf {
  index: number;
  hash: string;
}

export interface IMerkleTree extends Document {
  organizationId: string;
  root: string;
  depth: number;
  leaves: IMerkleLeaf[];
  version: number;
  updatedAt: Date;
}

const MerkleTreeSchema = new Schema<IMerkleTree>({
  organizationId: { type: String, required: true, unique: true },
  root: { type: String, required: true },
  depth: { type: Number, default: 20 },
  version: { type: Number, default: 1 },
  leaves: [
    {
      index: Number,
      hash: String,
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMerkleTree>('MerkleTree', MerkleTreeSchema);
