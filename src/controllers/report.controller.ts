import { Request, Response } from "express";
import { getCustomerBehaviorReport, getDiscountReport, getSalesReport, getStockReport } from "../services/report.service";

interface RequestWithUser extends Request {
  user?: { id: string; role: string; storeId?: string };
}

const parsePagination = (req: Request) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100); // limit max 100
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// ==================== SALES REPORT HANDLER ====================
export const getSalesReportHandler = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const reqWithUser = req as RequestWithUser;

    const { page, limit } = parsePagination(req);

    const report = await getSalesReport({
      role: reqWithUser.user?.role,
      userStoreId: reqWithUser.user?.storeId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      storeId: storeId as string | undefined,
      page,
      limit,
    });

    return res.json({ success: true, page, limit, ...report });
  } catch (err) {
    console.error("Error getSalesReportHandler:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== STOCK REPORT HANDLER ====================
export const getStockReportHandler = async (req: RequestWithUser, res: Response) => {
  try {
    const { startDate, endDate, storeId, categoryId } = req.query;
    const { page, limit } = parsePagination(req);

    const report = await getStockReport({
      role: req.user?.role,
      userStoreId: req.user?.storeId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      storeId: storeId as string | undefined,
      categoryId: categoryId as string | undefined,
      page,
      limit,
    });

    return res.json({ success: true, page, limit, ...report });
  } catch (err) {
    console.error("Error getStockReportHandler:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== DISCOUNT REPORT HANDLER ====================
export const getDiscountReportHandler = async (req: RequestWithUser, res: Response) => {
  try {
    const { startDate, endDate, storeId, categoryId } = req.query;
    const { page, limit } = parsePagination(req);

    const report = await getDiscountReport({
      role: req.user?.role,
      userStoreId: req.user?.storeId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      storeId: storeId as string | undefined,
      categoryId: categoryId as string | undefined,
      page,
      limit,
    });

    return res.json({ success: true, page, limit, ...report });
  } catch (err) {
    console.error("Error getDiscountReportHandler:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== CUSTOMER BEHAVIOR REPORT HANDLER ====================
export const getCustomerBehaviorReportHandler = async (req: RequestWithUser, res: Response) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const { page, limit } = parsePagination(req);

    const report = await getCustomerBehaviorReport({
      role: req.user?.role,
      userStoreId: req.user?.storeId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      storeId: storeId as string | undefined,
      page,
      limit
    });

    return res.json({ success: true, page, limit, ...report });
  } catch (err) {
    console.error("Error getCustomerBehaviorReportHandler:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
