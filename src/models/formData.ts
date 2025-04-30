import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnvelopeFormData extends Document {
    envelopeId: string;
    signerEmail: string;
    pdfPath: string;
    status: string;
    formData: Map<string, string>;
    createdAt: Date;
    completedAt: Date;
}

const formDataSchema: Schema<IEnvelopeFormData> = new mongoose.Schema({
    envelopeId: {
        type: String,
        required: true
    },
    signerEmail: String,
    pdfPath: String,
    status:
    {
        type: String,
        required: true
    },
    formData: {
        type: Map,
        of: String,  //store dynamic form field as key-value pairs
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, required: true }
})

const EnvelopeFormData:Model<IEnvelopeFormData> = mongoose.model<IEnvelopeFormData>('envelopeFormData', formDataSchema);

export default EnvelopeFormData;