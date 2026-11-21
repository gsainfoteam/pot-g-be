-- Custom SQL migration file, put your code below! --

-- 기준 시각 대비 발송 시점(분). 음수 = 전, 양수 = 후, NULL = 이벤트 발생 즉시 발송.
UPDATE public.popo_chat_msg
SET offset_minutes = CASE type
  WHEN 'popo-departure-confirm-request-v1' THEN -360
  WHEN 'popo-auto-archive-no-departure-confirm-v1' THEN 0
  WHEN 'popo-reminder-taxi-call-v1' THEN -5
  WHEN 'popo-accounting-reminder-v1' THEN 120
  WHEN 'popo-auto-archive-v1' THEN 10
  ELSE NULL
END;
--> statement-breakpoint

-- delay_check_policy 의 값을 popo_chat_msg 로 옮긴다. (테이블은 다음 마이그레이션에서 삭제)
UPDATE public.popo_chat_msg AS msg
SET enabled = policy.enabled,
    offset_minutes = -policy.minutes_before_departure
FROM public.delay_check_policy AS policy
WHERE msg.type = 'popo-delay-check-request-v1'
  AND policy.key = 'default';
--> statement-breakpoint

-- delay_check_policy 행이 없었던 경우를 위한 기본값 (비활성, 출발 10분 전).
UPDATE public.popo_chat_msg
SET enabled = false,
    offset_minutes = -10
WHERE type = 'popo-delay-check-request-v1'
  AND offset_minutes IS NULL;
