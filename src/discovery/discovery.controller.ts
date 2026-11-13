import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { Controller, Get, Query } from "@nestjs/common";
import { PotGDiscoveryService } from "@src/discovery/discovery.service";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";
import { PaginationDto } from "@src/global/dto/pagination.dto";
import { PotDto } from "@src/discovery/dto/pot.dto";
import { PotSearchDto } from "@src/discovery/dto/pot-search.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiTags("Discovery")
@Controller("/api/v1/discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: PotGDiscoveryService) {}

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "팟 검색" })
  @ApiExtraModels(PaginationDto, PotDto)
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginationDto) },
        {
          properties: {
            list: { type: "array", items: { $ref: getSchemaPath(PotDto) } },
          },
        },
      ],
    },
  })
  @Get("/list")
  async searchPotList(
    @Query() req: PotSearchDto,
  ): Promise<PaginationDto<PotDto>> {
    return await this.discoveryService.searchPotList(req);
  }

  @ApiOperation({ summary: "노선 목록 조회" })
  @ApiResponse({ status: 200, type: RouteDto, isArray: true })
  @Get("/route")
  async getRoutes(): Promise<RouteDto[]> {
    return await this.discoveryService.getRoutes();
  }

  @ApiOperation({ summary: "정류장 목록 조회" })
  @ApiResponse({ status: 200, type: StopDto, isArray: true })
  @Get("/stop")
  async getStops(): Promise<StopDto[]> {
    return this.discoveryService.getStops();
  }
}
