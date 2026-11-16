import { Logger } from "@nestjs/common";
import { createHash } from "node:crypto";

export class StagingLogger extends Logger {
  debug(message: any, ...optionalParams: any[]): void {
    if (process.env.APP_ENV === "stg") {
      super.debug(message, ...optionalParams);
    }
  }

  static debug(message: any, ...optionalParams: any[]): void {
    if (process.env.APP_ENV === "stg") {
      super.debug(message, ...optionalParams);
    }
  }

  static tokenId(token: string): string {
    return token
      ? createHash("sha256").update(token).digest("hex").slice(0, 8)
      : "missing";
  }
}
