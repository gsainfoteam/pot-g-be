import { BaseResultDto } from "@src/global/dto/base-result.dto";

export class PotEventError extends Error {
  baseResultDto: BaseResultDto;

  constructor(baseResultDto: BaseResultDto) {
    super(baseResultDto.result);
    this.baseResultDto = baseResultDto;
  }
}
