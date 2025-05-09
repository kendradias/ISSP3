import { Request, Response, NextFunction } from "express";
import { NotificationService } from '../services/notificationService.ts';

const notificationService = new NotificationService();

// Middleware for handling errors in the application
export const handleError = async(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction = () => {}
): Promise<void> => {

  // Extract envelope id if available
  const envelopeId = req.body?.data?.envelopeSummary.envelopeId || req.query?.envelopeId || 'Unknown Envelope ID';

  // Send notification email to tech support
  try {
    await notificationService.sendErrorNotification(err, req, envelopeId);
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
  }

  // Respond with a generic error message
  res.status(500).json({
      success: false,
      message: 'An internal server error occurred. The tech support team has been notified.',
  });
};

export default handleError;