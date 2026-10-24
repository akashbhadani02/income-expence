import mongoose, { Schema, models, model } from 'mongoose';
const PersonSchema = new Schema({ userId: { type: Schema.Types.ObjectId, required: true, index: true }, name: { type: String, required: true, trim: true } }, { timestamps: true });
PersonSchema.index({ userId: 1, name: 1 }, { unique: true });
export default models.Person || model('Person', PersonSchema);
