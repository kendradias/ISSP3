import nodemailer from 'nodemailer';
import {IStatusHistory, StatusHistory} from '../models/statusHistory.ts';
import { Request } from 'express';


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
            },
            tls: {
                rejectUnauthorized: false, // Allow self-signed certificates
            },
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
            console.error("Error sending notification: ", error);
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    async sendSupportNotification(
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
            throw error; // Rethrow the error to be handled by the caller
        }
    }

    async sendErrorNotification(err: unknown, req?: Request, envelopeId?: string): Promise<boolean> {
        try {
          const techSupportEmail = process.env.TECH_SUPPORT_EMAIL;
          if (!techSupportEmail) {
            console.error('Tech support email is not configured in the environment variables.');
            return false;
          }
      
          const subject = `[Error Notification] Application Error in ${process.env.NODE_ENV || 'development'}`;
          const timestamp = new Date().toISOString();
      
          const requestDetails = req
            ? `
            **Request Details**:
            - HTTP Method: ${req.method}
            - URL: ${req.originalUrl}
            - Query Parameters: ${JSON.stringify(req.query)}
            - Request Body: ${JSON.stringify(req.body)}
            - Headers: ${JSON.stringify(req.headers, null, 2)}
            `
            : '';
      
          const envelopeDetails = envelopeId
            ? `
            **Envelope Details**:
            - Envelope ID: ${envelopeId}
            `
            : '';
      
          const text = `
      An error occurred in the application:
      
      **Error Message**:
      ${err instanceof Error ? err.message : JSON.stringify(err)}
      
      **Stack Trace**:
      ${err instanceof Error ? err.stack : 'No stack trace available'}
      
      ${envelopeDetails}
      
      ${requestDetails}
      
      **Environment**:
      - NODE_ENV: ${process.env.NODE_ENV || 'development'}
      
      **Timestamp**:
      ${timestamp}
          `;
      
          const html = `
            <h2>An error occurred in the application</h2>
            <p><strong>Error Message:</strong> ${err instanceof Error ? err.message : JSON.stringify(err)}</p>
            <pre><strong>Stack Trace:</strong><br>${err instanceof Error ? err.stack : 'No stack trace available'}</pre>
            ${envelopeDetails ? `
            <h3>Envelope Details:</h3>
            <ul>
              <li><strong>Envelope ID:</strong> ${envelopeId}</li>
            </ul>
            ` : ''}
            ${req ? `
            <h3>Request Details:</h3>
            <ul>
              <li><strong>HTTP Method:</strong> ${req.method}</li>
              <li><strong>URL:</strong> ${req.originalUrl}</li>
              <li><strong>Query Parameters:</strong> ${JSON.stringify(req.query)}</li>
              <li><strong>Request Body:</strong> ${JSON.stringify(req.body)}</li>
              <li><strong>Headers:</strong> <pre>${JSON.stringify(req.headers, null, 2)}</pre></li>
            </ul>
            ` : ''}
            <h3>Environment:</h3>
            <p><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <h3>Timestamp:</h3>
            <p>${timestamp}</p>
          `;
      
          await this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: techSupportEmail,
            subject,
            text,
            html,
          });
      
          return true;
        } catch (error) {
          console.error('Error sending error notification:', error);
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
