import mongoose, { Document, Schema } from 'mongoose';

// Define the shape of the form data using TypeScript interfaces
interface IFormData extends Document {
  envelopeId: string;
  signerEmail: string;
  pdfPath: string;
  status: string;
  formData: Map<string, string>;
  createdAt: Date;
}

// Define the schema
const formDataSchema: Schema<IFormData> = new mongoose.Schema({
  envelopeId: { type: String, required: true },
  signerEmail: { type: String, required: true },
  pdfPath: { type: String, required: true },
  status: { type: String, required: true },
  formData: {
    type: Map,
    of: String, // Store dynamic form field as key-value pairs
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Create and export the model
const envelopeFormData = mongoose.model<IFormData>('envelopeFormData', formDataSchema);

export default envelopeFormData;
