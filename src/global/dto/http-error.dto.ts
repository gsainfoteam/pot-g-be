import { ApiProperty } from "@nestjs/swagger";

/** AllExceptionsFilter가 반환하는 HTTP 오류 형식입니다. */
export class HttpErrorDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: "Authentication failed" })
  message: string;
}
