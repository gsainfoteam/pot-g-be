export class WsBaseDto<T> {
  type: string;
  request_id: string;
  body: T;
}

export class WsResponseDto {
  success: boolean;
  result: any;

  static OK(type: string, request_id: string): WsBaseDto<WsResponseDto> {
    return {
      type: type,
      request_id: request_id,
      body: {
        success: true,
        result: "OK",
      },
    };
  }
}
