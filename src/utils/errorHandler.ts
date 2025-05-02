import { Request, Response } from "express";

const handleError = (
  response: Response<any, Record<string, any>>,
  errorCode: number,
  errorMessage: string,
  envelopeId: string,
  consoleMessage: string
): void => {
  console.error(consoleMessage);

  response.status(errorCode).send(errorMessage);

  // TODO: send notification email to Quality tech support email address
  
};

export default handleError;