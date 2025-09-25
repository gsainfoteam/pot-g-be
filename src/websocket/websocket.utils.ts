import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import type WebSocket from "ws";

export const customMessageParser = (
  data: string | ArrayBuffer | Buffer | Buffer[],
) => {
  const parsed = JSON.parse(data.toString());
  const wsMessage: WsBaseDto<any> = {
    type: parsed.type,
    request_id: parsed.request_id,
    body: parsed.body,
  };

  return {
    event: parsed.type,
    data: wsMessage,
  };
};

export const sendWsBaseDtoToClient = (
  client: WebSocket,
  data: WsBaseDto<any>,
) => {
  client.send(JSON.stringify(data));
};
