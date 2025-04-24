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

        })
    }
}