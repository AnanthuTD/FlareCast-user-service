import { Request, Response, NextFunction } from "express";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
import { IController } from "@/presentation/http/controllers/IController";

/**
 * Middleware to authenticate a user by calling AuthenticateUserController.
 */
export const authenticateAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authenticateAdminController = container.get<IController>(TOKENS.AuthenticateAdminController);

  const httpRequest: IHttpRequest = {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    cookies: req.cookies,
    user: req.user,
    file: req.file,
  };

  const httpResponse = await authenticateAdminController.handle(httpRequest);

  if (httpResponse.statusCode !== 200) {
    res.status(httpResponse.statusCode).json(httpResponse.body);
    return;
  }

  // Attach the authenticated user to the request object
  req.user = httpResponse.body.admin;
  next();
};
