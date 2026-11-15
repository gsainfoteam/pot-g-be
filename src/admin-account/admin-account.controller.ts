import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { SuperAdminGuard } from "@src/auth/guard/super-admin.guard";
import { AdminAccountService } from "@src/admin-account/admin-account.service";
import { AdminAccountDto } from "@src/admin-account/dto/admin-account.dto";
import { CreateAdminAccountRequestDto } from "@src/admin-account/dto/create-admin-account.dto";
import { UpdateAdminAccountRoleRequestDto } from "@src/admin-account/dto/update-admin-account-role.dto";
import { GetManager } from "@src/global/decorator/get-manager.decorator";
import { ManagerContext } from "@src/auth/context/manager-context.entity";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiBearerAuth("manager-access-token")
@ApiTags("AdminAccount")
@Controller("/api/manager/v1/admin-account")
@UseGuards(ManagerGuard)
export class AdminAccountController {
  constructor(private readonly adminAccountService: AdminAccountService) {}

  @ApiOperation({ summary: "관리자 계정 목록 조회" })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: AdminAccountDto, isArray: true })
  @Get()
  async list(): Promise<AdminAccountDto[]> {
    return this.adminAccountService.list();
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 409,
    type: HttpErrorDto,
    description: "이미 등록된 관리자 이메일",
  })
  @ApiOperation({
    summary: "관리자 계정 생성",
    description: "superadmin 권한이 필요합니다.",
  })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiForbiddenResponse({
    type: HttpErrorDto,
    description: "superadmin 권한이 필요합니다.",
  })
  @ApiResponse({ status: 201, type: AdminAccountDto })
  @Post()
  @UseGuards(SuperAdminGuard)
  async create(
    @Body() req: CreateAdminAccountRequestDto,
  ): Promise<AdminAccountDto> {
    return this.adminAccountService.create(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 404,
    type: HttpErrorDto,
    description: "대상을 찾을 수 없음",
  })
  @ApiOperation({
    summary: "관리자 권한 변경",
    description: "superadmin 권한이 필요합니다.",
  })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiForbiddenResponse({
    type: HttpErrorDto,
    description: "superadmin 권한이 필요합니다.",
  })
  @ApiResponse({ status: 200, type: AdminAccountDto })
  @Patch("/:pk")
  @UseGuards(SuperAdminGuard)
  async updateRole(
    @Param("pk", ParseUUIDPipe) adminPk: string,
    @Body() req: UpdateAdminAccountRoleRequestDto,
    @GetManager() managerCtx: ManagerContext,
  ): Promise<AdminAccountDto> {
    return this.adminAccountService.updateRole(adminPk, req, managerCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 404,
    type: HttpErrorDto,
    description: "대상을 찾을 수 없음",
  })
  @ApiOperation({
    summary: "관리자 계정 삭제",
    description: "superadmin 권한이 필요합니다.",
  })
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiForbiddenResponse({
    type: HttpErrorDto,
    description: "superadmin 권한이 필요합니다.",
  })
  @ApiResponse({ status: 200, type: BaseResultDto })
  @Delete("/:pk")
  @UseGuards(SuperAdminGuard)
  async remove(
    @Param("pk", ParseUUIDPipe) adminPk: string,
    @GetManager() managerCtx: ManagerContext,
  ): Promise<BaseResultDto> {
    await this.adminAccountService.remove(adminPk, managerCtx);
    return BaseResultDto.OK;
  }
}
