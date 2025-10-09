export class PushMessageDto {
  /** FCM 토큰 (필수) */
  fcmToken: string;

  /** 푸시 제목 (필수) */
  title: string;

  /** 푸시 내용 (필수) */
  body: string;

  /** 액션 버튼 텍스트 (옵셔널) */
  actionButtonText?: string;

  /** 딥링크 URL (옵셔널) */
  deepLink?: string;

  /** 이미지 URL (옵셔널) */
  imageUrl?: string;

  /** 푸시 아이콘 (옵셔널) */
  icon?: string;

  /** 푸시 색상 (옵셔널) */
  color?: string;

  /** 푸시 태그 (옵셔널) */
  tag?: string;
}

export class BulkPushMessageDto {
  /** FCM 토큰 배열 (필수) */
  fcmTokens: string[];

  /** 푸시 제목 (필수) */
  title: string;

  /** 푸시 내용 (필수) */
  body: string;

  /** 액션 버튼 텍스트 (옵셔널) */
  actionButtonText?: string;

  /** 딥링크 URL (옵셔널) */
  deepLink?: string;

  /** 이미지 URL (옵셔널) */
  imageUrl?: string;

  /** 푸시 아이콘 (옵셔널) */
  icon?: string;

  /** 푸시 색상 (옵셔널) */
  color?: string;

  /** 푸시 태그 (옵셔널) */
  tag?: string;
}