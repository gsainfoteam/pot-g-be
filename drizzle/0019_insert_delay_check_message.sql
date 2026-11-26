-- Custom SQL migration file, put your code below! --
INSERT INTO public.popo_chat_msg (
  type,
  action_btns,
  message
)
VALUES (
  'popo-delay-check-request-v1',
  ARRAY['delay-check-btn']::public.popo_action_btn_type[],
  '{stationName}에 도착할 시간을 확인해주세요!
차량이 지연되었다면 알려주세요.'
)
ON CONFLICT (type) DO NOTHING;
