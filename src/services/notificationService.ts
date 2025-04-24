import nodemailer from 'nodemailer';
import {IStatusHistory, StatusHistory} from '../models/statusHistory';

export interface EmailNotification {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export class NotificationService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }
    async sendStatusNotification(statusHistory: IStatusHistory): Promise<boolean> {
        try {
            const notification = this.createStatusEmail(statusHistory);
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: statusHistory.signerEmail,
                subject: notification.subject,
                text: notification.text,
                html: notification.html
            });

            await StatusHistory.findByIdAndUpdate(statusHistory._id, {
                notificationSent: true,
                notificationTimestamp: new Date()
            });

            return true;
        } catch(error) {    
            console.error("Error sending notification: ", error)
            return false;
        }
    }
    private createStatusEmail(statusHistory: IStatusHistory): EmailNotification {
        const subject = `Document Status Update: ${statusHistory.status}`;
        const text = `Your Document (Envelope IS: ${statusHistory.envelopeId}) is now ${statusHistory.status}`;

            // HTML version of the email could be created here
        const html = `
        <h2>Document Status Update</h2>
        <p>Your document (Envelope ID: <strong>${statusHistory.envelopeId}</strong>) 
        status is now: <strong>${statusHistory.status}</strong></p>
        <p>Time: ${statusHistory.timestamp.toLocaleString()}</p>
        `;


        return { to: statusHistory.signerEmail, subject, text, html };
    }
}
