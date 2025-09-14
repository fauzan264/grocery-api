import { Request, Response } from "express";
import { getSalesReport } from "../services/report.service";

interface RequestWithUser extends Request {
  user?: { id: string; role: string; storeId?: string };
}

export const getSalesReportHandler = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    const reqWithUser = req as RequestWithUser;

        const report = await getSalesReport({
        role: reqWithUser.user?.role,
        userStoreId: reqWithUser.user?.storeId,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        storeId: storeId as string | undefined,
        });

    return res.json({ success: true, ...report });
  } catch (err) {
    console.error("Error getSalesReportHandler:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};