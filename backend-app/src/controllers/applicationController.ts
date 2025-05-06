import { Request, Response } from "express";
import EnvelopeFormData from "../models/formData.ts";

export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const applications = await EnvelopeFormData.find().sort({completedAt: -1});

    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error" });
  }
};
