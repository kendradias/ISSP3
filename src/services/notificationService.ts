import nodemailer from 'nodemailer';
import {IStatusHistory, StatusHistory} from '../models/statusHistory.ts';

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

    async sendSenderNotification(
        formIssuerEmail: string,
        envelopeId: string,
        status: string
    ): Promise<boolean> {
        try {
            const subject = `Envelope ${envelopeId} Status Update: ${status}`;
            const text = `The envelope with ID ${envelopeId} has been updated to the status: ${status}.`;
            const html = `
                <h2>Envelope Status Update</h2>
                <p>The envelope with ID <strong>${envelopeId}</strong> has been updated to the status: <strong>${status}</strong>.</p>
            `;
    
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: formIssuerEmail,
                subject,
                text,
                html,
            });
    
            console.log(`Notification sent to form issuer: ${formIssuerEmail}`);
            return true;
        } catch (error) {
            console.error(`Error sending notification to form issuer (${formIssuerEmail}):`, error);
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

    async checkAndSendNotification(
        envelopeId: string, 
        signerEmail: string, 
        status: string
      ): Promise<boolean> {
        try {
          // Check if notification was already sent for this envelope
          const existingNotification = await StatusHistory.findOne({
            envelopeId,
            notificationSent: true
          });
  
          // If notification already exists, don't send again
          if (existingNotification) {
            console.log(`Notification already sent for envelope ${envelopeId}`);
            return false;
          }
  
          // Find or create status history
          let statusHistory = await StatusHistory.findOne({ envelopeId });
          
          if (!statusHistory) {
            // Create new status history record if none exists
            statusHistory = new StatusHistory({
              envelopeId,
              signerEmail,
              status,
              previousStatus: null,
              timestamp: new Date(),
              notificationSent: false
            });
            await statusHistory.save();
          }
  
          // Use existing method to send the notification
          console.log(`Sending missing notification for envelope ${envelopeId}`);
          return this.sendStatusNotification(statusHistory);
          
        } catch (error) {
          console.error(`Error checking/sending notification for envelope ${envelopeId}:`, error);
          return false;
        }
      }
}
