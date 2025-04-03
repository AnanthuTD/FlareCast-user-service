import { TOKENS } from '@/app/tokens';
import container from '@/infra/di-container';
import { expressAdapter } from '@/presentation/adapters/express';
import { IController } from '@/presentation/http/controllers/IController';
import { Router, Request, Response } from 'express';


const reportRoutes = Router();

// Resolve controllers from container
const salesSummaryController = container.get<IController>(TOKENS.SalesSummaryController);
const planGroupController = container.get<IController>(TOKENS.PlanGroupController);
const freePlanUsageController = container.get<IController>(TOKENS.FreePlanUsageController);
const revenueByPeriodController = container.get<IController>(TOKENS.RevenueByPeriodController);
const statusDistributionController = container.get<IController>(TOKENS.StatusDistributionController);

// Routes
reportRoutes.get(
  "/summary",
  async (req: Request, res: Response) => {
    const adapter = await expressAdapter(req, salesSummaryController);
    res.status(adapter.statusCode).json(adapter.body);
  }
);

reportRoutes.get(
  "/plan-group",
  async (req: Request, res: Response) => {
    const adapter = await expressAdapter(req, planGroupController);
    res.status(adapter.statusCode).json(adapter.body);
  }
);

reportRoutes.get(
  "/free-plan",
  async (req: Request, res: Response) => {
    const adapter = await expressAdapter(req, freePlanUsageController);
    res.status(adapter.statusCode).json(adapter.body);
  }
);

reportRoutes.get(
  "/revenue-by-period",
  async (req: Request, res: Response) => {
    const adapter = await expressAdapter(req, revenueByPeriodController);
    res.status(adapter.statusCode).json(adapter.body);
  }
);

reportRoutes.get(
  "/status-distribution",
  async (req: Request, res: Response) => {
    const adapter = await expressAdapter(req, statusDistributionController);
    res.status(adapter.statusCode).json(adapter.body);
  }
);

export default reportRoutes;