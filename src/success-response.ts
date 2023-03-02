import { Expose } from "class-transformer";

export class SuccessResponse {
  @Expose()
  statusCode: number;

  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  totalCount: any;

  @Expose()
  result: object;

  constructor(partial: Partial<SuccessResponse>) {
    Object.assign(this, partial);
  }
}
