import express from 'express';
import { getAllApplications } from '../controllers/applicationController.ts';

const applicationRouter = express.Router();

applicationRouter.get('/applications', getAllApplications);

export default applicationRouter;
