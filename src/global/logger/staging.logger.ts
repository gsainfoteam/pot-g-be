import { Logger } from "@nestjs/common";
import { createHash } from "node:crypto";

export class StagingLogger extends Logger {
  debug(message: string): void {
    if (process.env.APP_ENV === "stg") {
      super.debug(message);
    }
  }

  static tokenId(token: string): string {
    return token
      ? createHash("sha256").update(token).digest("hex").slice(0, 8)
      : "missing";
  }
}
