import { ApiProperty } from "@nestjs/swagger";

export class HealthDto {
  @ApiProperty({ enum: ["ok", "error", "shutting_down"], example: "ok" })
  status: string;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    required: false,
    example: { database: { status: "up" }, memory_rss: { status: "up" } },
  })
  info?: Record<string, unknown>;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    required: false,
    example: {},
  })
  error?: Record<string, unknown>;

  @ApiProperty({ type: Object, additionalProperties: true })
  details: Record<string, unknown>;
}
