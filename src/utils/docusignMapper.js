// src/utils/docusignMapper.js

/**
 * Maps DocuSign form data to our MongoDB schema
 * @param {Array} formData - The raw form field data from DocuSign
 * @returns {Object} Formatted data ready for MongoDB insertion
 */
function mapDocusignDataToSchema(formData) {
    if (!Array.isArray(formData) || formData.length === 0) {
      throw new Error('Form data is empty or not in the expected format');
    }
    
    // Group entries by envelope ID
    const envelopeId = formData[0].EnvelopeId;
    
    // Extract recipient info
    const recipientName = formData[0]['Recipient Name'];
    const recipientEmail = formData[0]['Recipient Email'];
    const recipientSignedDateStr = formData[0]['Recipient Signed'];
    const recipientSignedDate = recipientSignedDateStr ? new Date(recipientSignedDateStr) : null;
    
    // Initialize the formatted data structure
    const formattedData = {
      envelopeId: envelopeId,
      status: 'completed',
      completedDate: recipientSignedDate,
      recipientInfo: {
        name: recipientName,
        email: recipientEmail,
        signedDate: recipientSignedDate
      },
      customerInfo: {},
      billTo: {},
      shipTo: {
        deliveryRequirements: {}
      },
      principals: [],
      contacts: {
        purchasing: {},
        invoicing: {},
        shippingReceiving: {}
      },
      payment: {
        methods: {},
        creditCard: {}
      },
      bankingReference: {},
      supplierReferences: [],
      agreement: {},
      guarantor: {},
      newsletter: {},
      formFields: new Map(),
      checkboxGroups: new Map(),
      rawData: formData
    };
    
    // Process all form fields
    formData.forEach(entry => {
      const fieldName = entry.Field;
      const fieldValue = entry.Value;
      const dropdownValue = entry['Dropdown Selected Value'];
      
      // Skip entries without field names
      if (!fieldName) return;
      
      // Process checkbox groups separately
      if (fieldName.startsWith('Checkbox Group')) {
        formattedData.checkboxGroups.set(fieldName, fieldValue);
        return;
      }
      
      // Map fields to schema structure
      mapFieldToSchema(formattedData, fieldName, fieldValue, dropdownValue);
    });
    
    // Process checkbox groups to set boolean values
    processCheckboxGroups(formattedData);
    
    // Default API sync status
    formattedData.apiSyncStatus = 'pending';
    
    return formattedData;
  }
  
  /**
   * Maps individual fields to the appropriate schema location
   * @param {Object} formattedData - The data object being built
   * @param {String} fieldName - The DocuSign field name
   * @param {String} fieldValue - The field value
   * @param {String} dropdownValue - The selected dropdown value if applicable
   */
  function mapFieldToSchema(formattedData, fieldName, fieldValue, dropdownValue) {
    // Store all fields in the formFields map for reference
    formattedData.formFields.set(fieldName, fieldValue);
    
    // Customer Information fields
    if (fieldName === 'businessnameCustomerInfo') {
      formattedData.customerInfo.businessName = fieldValue;
    } else if (fieldName === 'tradenameCustomerInfo') {
      formattedData.customerInfo.tradeName = fieldValue;
    } else if (fieldName === 'taxidCustomerInfo') {
      formattedData.customerInfo.taxId = fieldValue;
    } else if (fieldName === 'yearsCustomerInfo') {
      formattedData.customerInfo.establishedYear = fieldValue;
    } else if (fieldName === 'emailCustomerInformation') {
      formattedData.customerInfo.email = fieldValue;
    } else if (fieldName === 'phoneCustomerInfo') {
      formattedData.customerInfo.phone = fieldValue;
    } else if (fieldName === 'websitesCustomerInfo') {
      formattedData.customerInfo.website = fieldValue;
    } else if (fieldName === 'networthCustomerInfo') {
      formattedData.customerInfo.netWorth = fieldValue;
    } else if (fieldName === 'taxexemptCustomerInfo') {
      formattedData.customerInfo.taxExempt = fieldValue === 'taxexemptYes';
    } else if (fieldName === 'ownershipCustomerInfo') {
      formattedData.customerInfo.ownership = mapOwnershipType(fieldValue);
    } else if (fieldName === 'buildingCustomerInfo') {
      formattedData.customerInfo.building = mapBuildingType(fieldValue);
    } else if (fieldName === 'statusCustomerInfo') {
      formattedData.customerInfo.status = mapStatusType(fieldValue);
    } else if (fieldName === 'typeCustomerInfo') {
      formattedData.customerInfo.businessType = fieldValue;
    } else if (fieldName === 'onlinesalesCustomerInfo') {
      formattedData.customerInfo.onlineSales = fieldValue === 'onlinesalesYes';
    } else if (fieldName === 'bankruptcyCustomerInfo') {
      formattedData.customerInfo.bankruptcy = fieldValue === 'bankruptcyYes';
    }
    
    // Bill To Address
    else if (fieldName === 'addressBillTo') {
      formattedData.billTo.address = fieldValue;
    } else if (fieldName === 'cityBillTo') {
      formattedData.billTo.city = fieldValue;
    } else if (fieldName === 'stateBillTo') {
      formattedData.billTo.state = dropdownValue || fieldValue;
    } else if (fieldName === 'countyBillTo') {
      formattedData.billTo.county = fieldValue;
    } else if (fieldName === 'zipBillTo') {
      formattedData.billTo.zipCode = fieldValue;
    } else if (fieldName === 'countryBillTo') {
      formattedData.billTo.country = dropdownValue || fieldValue;
    }
    
    // Ship To Address
    else if (fieldName === 'addressShipTo') {
      formattedData.shipTo.address = fieldValue;
    } else if (fieldName === 'cityShipTo') {
      formattedData.shipTo.city = fieldValue;
    } else if (fieldName === 'stateShipTo') {
      formattedData.shipTo.state = dropdownValue || fieldValue;
    } else if (fieldName === 'countyShipTo') {
      formattedData.shipTo.county = fieldValue;
    } else if (fieldName === 'zipShipTo') {
      formattedData.shipTo.zipCode = fieldValue;
    } else if (fieldName === 'countryShipTo') {
      formattedData.shipTo.country = dropdownValue || fieldValue;
    } else if (fieldName === 'hoursShipTo') {
      formattedData.shipTo.hours = fieldValue;
    } else if (fieldName === 'notesShipTo') {
      formattedData.shipTo.notes = fieldValue;
    } else if (fieldName === 'sameShipTo') {
      formattedData.shipTo.sameAsBilling = fieldValue === 'X';
    }
    
    // Principals
    else if (fieldName === 'nameFirstPrincipal') {
      ensurePrincipal(formattedData.principals, 0).name = fieldValue;
    } else if (fieldName === 'titleFirstPrincipal') {
      ensurePrincipal(formattedData.principals, 0).title = fieldValue;
    } else if (fieldName === 'emailFirstPrincipal') {
      ensurePrincipal(formattedData.principals, 0).email = fieldValue;
    } else if (fieldName === 'phoneFirstPrincipal') {
      ensurePrincipal(formattedData.principals, 0).phone = fieldValue;
    } else if (fieldName === 'addressFirstPrincipal') {
      ensurePrincipal(formattedData.principals, 0).address = fieldValue;
    } 
    // Second principal
    else if (fieldName === 'nameSecondPrincipal') {
      ensurePrincipal(formattedData.principals, 1).name = fieldValue;
    } else if (fieldName === 'titleSecondPrincipal') {
      ensurePrincipal(formattedData.principals, 1).title = fieldValue;
    } else if (fieldName === 'emailSecondPrincipal') {
      ensurePrincipal(formattedData.principals, 1).email = fieldValue;
    } else if (fieldName === 'phoneSecondPrincipal') {
      ensurePrincipal(formattedData.principals, 1).phone = fieldValue;
    } else if (fieldName === 'addressSecondPrincipal') {
      ensurePrincipal(formattedData.principals, 1).address = fieldValue;
    }
    // Map other principals similarly...
    
    // Contacts - Purchasing
    else if (fieldName === 'namePurchasing') {
      formattedData.contacts.purchasing.name = fieldValue;
    } else if (fieldName === 'phonePurchasing') {
      formattedData.contacts.purchasing.phone = fieldValue;
    } else if (fieldName === 'emailOrderingPurchasing') {
      formattedData.contacts.purchasing.orderingEmail = fieldValue;
    } else if (fieldName === 'emailConfirmationsPurchasing') {
      formattedData.contacts.purchasing.confirmationsEmail = fieldValue;
    } else if (fieldName === 'samePurchasing') {
      formattedData.contacts.purchasing.sameAsPrincipal = fieldValue === 'X';
    }
    
    // Contacts - Invoicing
    else if (fieldName === 'nameInvoicing') {
      formattedData.contacts.invoicing.name = fieldValue;
    } else if (fieldName === 'phoneInvoicing') {
      formattedData.contacts.invoicing.phone = fieldValue;
    } else if (fieldName === 'emailInvoicesInvoicing') {
      formattedData.contacts.invoicing.invoicesEmail = fieldValue;
    } else if (fieldName === 'emailStatementsInvoicing') {
      formattedData.contacts.invoicing.statementsEmail = fieldValue;
    } else if (fieldName === 'sameInvoicing') {
      formattedData.contacts.invoicing.sameAsPrincipal = fieldValue === 'X';
    }
    
    // Contacts - Shipping/Receiving
    else if (fieldName === 'nameShippingReceiving') {
      formattedData.contacts.shippingReceiving.name = fieldValue;
    } else if (fieldName === 'phoneShippingReceiving') {
      formattedData.contacts.shippingReceiving.phone = fieldValue;
    } else if (fieldName === 'emailShippingReceiving') {
      formattedData.contacts.shippingReceiving.email = fieldValue;
    } else if (fieldName === 'sameShippingReceiving') {
      formattedData.contacts.shippingReceiving.sameAsPrincipal = fieldValue === 'X';
    }
    
    // Payment
    else if (fieldName === 'creditrequestCustomerInfo') {
      formattedData.payment.creditRequest = fieldValue;
    } else if (fieldName === 'paymentCreditCard') {
      formattedData.payment.methods.creditCard = fieldValue === 'X';
    } else if (fieldName === 'paymentWire') {
      formattedData.payment.methods.wire = fieldValue === 'X';
    } else if (fieldName === 'paymentCheck') {
      formattedData.payment.methods.check = fieldValue === 'X';
    } 
    
    // Credit Card
    else if (fieldName === 'businessnameCreditCard') {
      formattedData.payment.creditCard.businessName = fieldValue;
    } else if (fieldName === 'nameCreditCard') {
      formattedData.payment.creditCard.name = fieldValue;
    } else if (fieldName === 'typeCreditCard') {
      formattedData.payment.creditCard.type = fieldValue;
    } else if (fieldName === 'digitsCreditCard') {
      formattedData.payment.creditCard.lastFourDigits = fieldValue;
    } else if (fieldName === 'dateCreditCard') {
      formattedData.payment.creditCard.date = fieldValue ? new Date(fieldValue) : null;
    } else if (fieldName === 'emailCreditCard') {
      formattedData.payment.creditCard.email = fieldValue;
    } else if (fieldName === 'addressCreditCard') {
      formattedData.payment.creditCard.address = fieldValue;
    } else if (fieldName === 'cityCreditCard') {
      formattedData.payment.creditCard.city = fieldValue;
    } else if (fieldName === 'stateCreditCard') {
      formattedData.payment.creditCard.state = dropdownValue || fieldValue;
    } else if (fieldName === 'zipCreditCard') {
      formattedData.payment.creditCard.zipCode = fieldValue;
    } else if (fieldName === 'countryCreditCard') {
      formattedData.payment.creditCard.country = fieldValue;
    }
    
    // Banking Reference
    else if (fieldName === 'nameBankingReference') {
      formattedData.bankingReference.name = fieldValue;
    } else if (fieldName === 'branchBankingReference') {
      formattedData.bankingReference.branch = fieldValue;
    } else if (fieldName === 'accountBankingReference') {
      formattedData.bankingReference.account = fieldValue;
    } else if (fieldName === 'emailBankingReference') {
      formattedData.bankingReference.email = fieldValue;
    } else if (fieldName === 'phoneBankingReference') {
      formattedData.bankingReference.phone = fieldValue;
    } else if (fieldName === 'addressBankingReference') {
      formattedData.bankingReference.address = fieldValue;
    }
    
    // Supplier References
    else if (fieldName === 'nameFirstSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 0).name = fieldValue;
    } else if (fieldName === 'supplierFirstSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 0).supplierName = fieldValue;
    } else if (fieldName === 'emailFirstSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 0).email = fieldValue;
    } else if (fieldName === 'phoneFirstSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 0).phone = fieldValue;
    } else if (fieldName === 'addressFirstSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 0).address = fieldValue;
    }
    // Map second and third supplier references similarly
    else if (fieldName === 'nameSecondSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 1).name = fieldValue;
    } else if (fieldName === 'supplierSecondSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 1).supplierName = fieldValue;
    } else if (fieldName === 'emailSecondSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 1).email = fieldValue;
    } else if (fieldName === 'phoneSecondSupplierReference') {
      ensureSupplier(formattedData.supplierReferences, 1).phone = fieldValue;
    }
  }