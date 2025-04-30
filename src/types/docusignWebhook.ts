export interface CustomField {
    fieldId: string;
    name: string;
    show: string;
    required: string;
    value: string;
}

export interface EnvelopeSender {
    userName: string;
    userId: string;
    accountId: string;
    email: string;
    ipAddress: string;
}

export interface EnvelopeSummary {
    status: string;
    completedDateTime: string;
    envelopeId: string;
    documentsUri: string;
    recipientsUri: string;
    attachmentsUri: string;
    envelopeUri: string;
    emailSubject: string;
    signingLocation: string;
    createdDateTime: string;
    lastModifiedDateTime: string;
    sentDateTime: string;
    deliveredDateTime: string;
    initialSentDateTime: string;
    statusChangedDateTime: string;
    documentsCombinedUri: string;
    certificateUri: string;
    templatesUri: string;
    expireDateTime: string;
    expireAfter: string;
    sender: EnvelopeSender;
    customFields: {
        textCustomFields: CustomField[];
        listCustomFields: any[];
    };
    [key: string]: any; // fallback for untyped fields
}

export interface EnvelopeData {
    accountId: string;
    userId: string;
    envelopeId: string;
    envelopeSummary: EnvelopeSummary;
}

export interface DocuSignWebhookRequest {
    event: string;
    apiVersion: string;
    uri: string;
    retryCount: number;
    configurationId: number;
    generatedDateTime: string;
    data: EnvelopeData;
}
