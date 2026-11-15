import { ApiProperty } from "@nestjs/swagger";
export class UpdateConsentDto {
  @ApiProperty({ type: String, isArray: true })
  required_terms: string[];
  @ApiProperty({ type: String, isArray: true })
  optional_terms: string[];
}
