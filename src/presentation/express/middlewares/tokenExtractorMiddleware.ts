import { NextFunction, Request, Response } from "express";

export const tokenExtractorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.accessToken;

  if (accessToken) {
    req.headers["authorization"] = `Bearer ${accessToken}`;
  } else {
    console.warn("No accessToken found in cookies");
  }

  next();
};