import { IHttpSuccess } from "../IHttpSuccess";
import { IHttpResponse } from "../IHttpResponse";
import { Service } from "typedi";
import { injectable } from "inversify";

/**
 * Implementation of the IHttpSuccess interface for generating HTTP success responses.
 */

@injectable()
export class HttpSuccess implements IHttpSuccess {
  ok(data?: any): IHttpResponse {
    return { statusCode: 200, body: data || { message: "OK" } };
  }

  created(data?: any): IHttpResponse {
    return { statusCode: 201, body: data || { message: "Created" } };
  }

  accepted(data?: any): IHttpResponse {
    return { statusCode: 202, body: data || { message: "Accepted" } };
  }

  noContent(data?: any): IHttpResponse {
    return { statusCode: 204, body: data || null };
  }

  partialContent(data?: any): IHttpResponse {
    return { statusCode: 206, body: data || { message: "Partial Content" } };
  }
}