const { saveFormDataToDB } = require("../services/databaseService");
const { downloadEnvelopePDF, getFormData } = require("../services/docuSignService");

const handleWebhook = async (req, res) => {
  try {
    const envelopeData = req.body.data;

    if (!envelopeData || envelopeData.envelopeSummary.status !== 'completed') {
      console.log("Ignored: Incomplete or invalid envelope");
      return res.status(200).send("Ignored event");
    }

    const envelopeId = envelopeData.envelopeId;
    const accountId = envelopeData.accountId;

    const accessToken = await getAccessToken({
      clientId: process.env.CLIENT_ID,
      userId: process.env.DOCUSIGN_USER_ID,
    });

    const { formData, signerEmail } = await getFormData(accessToken, accountId, envelopeId);

    const pdfPath = await downloadEnvelopePDF(accessToken, accountId, envelopeId);

    await saveFormDataToDB({
      envelopeId,
      signerEmail,
      status: envelopeData.envelopeSummary.status,
      pdfPath,
      formData,
      completedAt: envelopeData.envelopeSummary.completedDateTime
    });

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
};

module.exports = { handleWebhook };
