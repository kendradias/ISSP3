import mongoose, {Document} from 'mongoose';

export interface IStatusHistory extends Document {
    envelopeId: string;
    signerEmail: string;
    status: string;
    previousStatus: string | null;
    timestamp: Date;
    notificationSent: boolean;
    notificationTimestamp: Date | null;
}

const statusHistorySchema =  new mongoose.Schema({
    envelopeId: {type: String, required: true, index: true},
    signerEmail: {type: String, required: true},
    status: {type: String, required: true},
    previousStatus: {type: String, default: null},
    timestamp: {type: Date, default: Date.now},
    notificationSent: {type: Boolean, default: false},
    notificationTimestamp: {type: Date, default: null}
});

export const StatusHistory = mongoose.model<IStatusHistory>('StatusHistory', statusHistorySchema)