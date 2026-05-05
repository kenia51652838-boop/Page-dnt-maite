import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pixRouter from "./pix";
import leadsRouter from "./leads";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pixRouter);
router.use(leadsRouter);
router.use(adminRouter);

export default router;
