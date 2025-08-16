export class BaseResultDto {
  result: string;

  static OK: BaseResultDto = {
    result: "OK",
  };
}
