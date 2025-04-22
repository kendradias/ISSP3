const mongoose = require('mongoose');

const formDataSchema = new mongoose.Schema({
    envelopeId: String,
    signerEmail: String,
    pdfPath: String,
    status: String,
    formData: {
        type: Map,
        of: String,  ///store dynamic form field as key-value pairs
        required: true
    },
    createdAt:{type:Date, default:Date.now} 
})

const envelopeFormData = mongoose.model('envelopeFormData', formDataSchema);

module.exports = envelopeFormData;