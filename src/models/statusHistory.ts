import mongoose, {Document} from 'mongoose';

export interface IStatusHistory extends Document {
    envelopeId: string;
    signerEmail: string;
    status: string;
    previousstatus: string | null;
    timestamp: Date;
    notificationSent: boolean;
    notificationTimestamp: Date | null;
}

const statusHistorySchema =  new mongoose.Schema({
    envelopeId: {type: String, required: true, index: true},
    
})