// src/models/formData.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a flexible schema for the form data
const formDataSchema = new Schema({
  // DocuSign envelope information
  envelopeId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['created', 'sent', 'delivered', 'completed', 'declined', 'voided'],
    default: 'completed'
  },
  completedDate: {
    type: Date
  },
  recipientInfo: {
    name: String,
    email: String,
    signedDate: Date
  },
  
  // Customer Information
  customerInfo: {
    businessName: String,
    tradeName: String,
    taxId: String,
    establishedYear: String,
    email: String,
    phone: String,
    website: String,
    netWorth: String,
    taxExempt: Boolean,
    ownership: {
      type: String,
      enum: ['Corporation', 'Partnership', 'Sole Proprietor', 'LLC', 'Not-For-Profit', 'Other']
    },
    building: {
      type: String,
      enum: ['Owned', 'Leased', 'Other']
    },
    status: {
      type: String,
      enum: ['Privately Held', 'Public', 'Subsidiary', 'Division', 'Other']
    },
    businessType: String,
    onlineSales: Boolean,
    websiteSalesChannels: {
      ownWebsite: Boolean,
      thirdPartyWebsites: Boolean
    },
    bankruptcy: Boolean
  },
  
  // Address Information
  billTo: {
    address: String,
    city: String,
    state: String,
    county: String,
    zipCode: String,
    country: String
  },
  
  shipTo: {
    sameAsBilling: Boolean,
    address: String,
    city: String,
    state: String,
    county: String,
    zipCode: String,
    country: String,
    hours: String,
    notes: String,
    deliveryRequirements: {
      forkliftOnSite: Boolean,
      loadingDock: Boolean,
      liftgateRequired: Boolean
    }
  },
  
  // Contact Information
  principals: [{
    name: String,
    title: String,
    email: String,
    phone: String,
    address: String
  }],
  
  // Department contacts
  contacts: {
    purchasing: {
      sameAsPrincipal: Boolean,
      name: String,
      phone: String,
      email: String,
      orderingEmail: String,
      confirmationsEmail: String
    },
    invoicing: {
      sameAsPrincipal: Boolean,
      name: String,
      phone: String,
      invoicesEmail: String,
      statementsEmail: String
    },
    shippingReceiving: {
      sameAsPrincipal: Boolean,
      name: String,
      phone: String,
      email: String
    }
  },
  
  // Payment Information
  payment: {
    creditRequest: String,
    methods: {
      creditCard: Boolean,
      wire: Boolean,
      check: Boolean
    },
    creditCard: {
      businessName: String,
      name: String,
      type: String,
      lastFourDigits: String,
      date: Date,
      email: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  
  // Banking Reference
  bankingReference: {
    name: String,
    branch: String,
    account: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Supplier References
  supplierReferences: [{
    name: String,
    supplierName: String,
    email: String,
    phone: String,
    address: String
  }],
  
  // Agreement Information
  agreement: {
    businessName: String,
    name: String,
    title: String,
    date: Date
  },
  
  // Guarantor Information
  guarantor: {
    businessName: String,
    tradeName: String,
    name: String,
    email: String,
    ssn: String,
    date: Date
  },
  
  // Newsletter Preferences
  newsletter: {
    join: Boolean,
    email: String
  },
  
  // Dynamic fields - store any additional form data as key-value pairs
  formFields: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  
  // Raw form data - store the entire form response as JSON
  rawData: Schema.Types.Mixed,
  
  // Checkbox groups for better data organization
  checkboxGroups: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  
  // Processing metadata
  apiSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },
  apiSyncDate: Date,
  apiSyncErrors: [String]
}, {
  // Enable automatic timestamps
  timestamps: true,
  
  // Enable schema to accept additional fields not defined above
  strict: false
});

// Create indexes for common query fields
formDataSchema.index({ 'recipientInfo.email': 1 });
formDataSchema.index({ 'customerInfo.businessName': 1 });
formDataSchema.index({ 'billTo.zipCode': 1 });
formDataSchema.index({ apiSyncStatus: 1 });
formDataSchema.index({ createdAt: 1 });

// Create a method to prepare data for API sync
formDataSchema.methods.prepareForApiSync = function() {
  // Custom method to format the data for the external API
  // Implementation would depend on the API requirements
  const apiData = {
    id: this._id,
    envelopeId: this.envelopeId,
    recipient: this.recipientInfo,
    customer: this.customerInfo,
    addresses: {
      billing: this.billTo,
      shipping: this.shipTo
    },
    contacts: {
      principals: this.principals,
      departments: this.contacts
    },
    payment: this.payment,
    references: {
      banking: this.bankingReference,
      suppliers: this.supplierReferences
    },
    agreement: this.agreement,
    guarantor: this.guarantor,
    newsletter: this.newsletter
  };
  
  return apiData;
};

const FormData = mongoose.model('FormData', formDataSchema);

module.exports = FormData;