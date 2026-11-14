export class AdminUserDeviceDto {
  pk: string;
  os: string;
  version: string;
  logged_in: boolean;
  has_fcm_token: boolean;
  push_setting: {
    chat_push: boolean;
    marketing_push: boolean;
    pot_in_out_push: boolean;
  } | null;
}

export class AdminUserDetailDto {
  pk: string;
  idp_sub: string;
  name: string | null;
  email: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  devices: AdminUserDeviceDto[];
}
