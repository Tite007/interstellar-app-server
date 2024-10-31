import mongoose from "mongoose";

const taxCodeSchema = new mongoose.Schema({
  stripeTaxCode: { type: String, unique: true, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  name: { type: String, required: true },
});

export const TaxCode = mongoose.model("TaxCode", taxCodeSchema);
