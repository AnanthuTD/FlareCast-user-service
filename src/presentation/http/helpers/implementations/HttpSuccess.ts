import { IHttpSuccess } from "../IHttpSuccess";
import { IHttpResponse } from "../IHttpResponse";
import { Service } from "typedi";

/**
 * Implementation of the IHttpSuccess interface for generating HTTP success responses.
 */
@Service()
export class HttpSuccess implements IHttpSuccess {
  success_200(data?: any): IHttpResponse {
    return { statusCode: 200, body: data || { message: "OK" } };
  }

  success_201(data?: any): IHttpResponse {
    return { statusCode: 201, body: data || { message: "Created" } };
  }

  success_202(data?: any): IHttpResponse {
    return { statusCode: 202, body: data || { message: "Accepted" } };
  }

  success_204(data?: any): IHttpResponse {
    return { statusCode: 204, body: data || null };
  }

  success_206(data?: any): IHttpResponse {
    return { statusCode: 206, body: data || { message: "Partial Content" } };
  }
}