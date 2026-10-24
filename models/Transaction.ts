import mongoose, { Schema, models, model } from 'mongoose';
const TransactionSchema = new Schema({ userId: { type: Schema.Types.ObjectId, required: true, index: true }, personId: { type: Schema.Types.ObjectId, required: true, index: true }, type: { type: String, enum: ['income', 'expense'], required: true }, amount: { type: Number, required: true, min: 0.01 }, category: { type: String, required: true, trim: true }, note: { type: String, default: '', trim: true }, date: { type: Date, required: true, index: true } }, { timestamps: true });
TransactionSchema.index({ userId: 1, date: -1 });
export default models.Transaction || model('Transaction', TransactionSchema);
