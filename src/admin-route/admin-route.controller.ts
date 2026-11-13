import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiResponse,
} from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminRouteService } from "@src/admin-route/admin-route.service";
import { AdminRouteDto } from "@src/admin-route/dto/admin-route.dto";
import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";
import { CreateStopRequestDto } from "@src/admin-route/dto/create-stop.dto";
import { CreateRouteRequestDto } from "@src/admin-route/dto/create-route.dto";
import { UpdateStopRequestDto } from "@src/admin-route/dto/update-stop.dto";
import { UpdateRouteNameRequestDto } from "@src/admin-route/dto/update-route-name.dto";
import { UpdateRouteDeletedRequestDto } from "@src/admin-route/dto/update-route-deleted.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiBearerAuth("manager-access-token")
@ApiTags("AdminRoute")
@Controller("/api/manager/v1/route")
@UseGuards(ManagerGuard)
export class AdminRouteController {
  constructor(private readonly adminRouteService: AdminRouteService) {}

  @ApiOperation({ summary: "관리자 노선 목록 조회" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminRouteDto, isArray: true })
  @Get()
  async listRoutes(): Promise<AdminRouteDto[]> {
    return this.adminRouteService.listRoutes();
  }

  @ApiOperation({ summary: "관리자 정류장 목록 조회" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminStopDto, isArray: true })
  @Get("/stop")
  async listStops(): Promise<AdminStopDto[]> {
    return this.adminRouteService.listStops();
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "왕복 노선 생성" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: AdminRouteDto, isArray: true })
  @Post()
  async createRoute(
    @Body() req: CreateRouteRequestDto,
  ): Promise<AdminRouteDto[]> {
    return this.adminRouteService.createRoute(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "정류장 생성" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: AdminStopDto })
  @Post("/stop")
  async createStop(@Body() req: CreateStopRequestDto): Promise<AdminStopDto> {
    return this.adminRouteService.createStop(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "정류장 수정" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminStopDto })
  @Patch("/stop/:pk")
  async updateStop(
    @Param("pk", ParseUUIDPipe) pk: string,
    @Body() req: UpdateStopRequestDto,
  ): Promise<AdminStopDto> {
    return this.adminRouteService.updateStop(pk, req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "노선 삭제 상태 변경" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminRouteDto })
  @Patch("/:pk/deleted")
  async updateRouteDeleted(
    @Param("pk", ParseUUIDPipe) pk: string,
    @Body() req: UpdateRouteDeletedRequestDto,
  ): Promise<AdminRouteDto> {
    return this.adminRouteService.updateRouteDeleted(pk, req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "노선 이름 수정" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminRouteDto })
  @Patch("/:pk")
  async updateRouteName(
    @Param("pk", ParseUUIDPipe) pk: string,
    @Body() req: UpdateRouteNameRequestDto,
  ): Promise<AdminRouteDto> {
    return this.adminRouteService.updateRouteName(pk, req);
  }
}
