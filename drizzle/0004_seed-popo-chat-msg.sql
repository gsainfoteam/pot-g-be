-- Custom SQL migration file, put your code below! --

INSERT INTO public.popo_chat_msg (type, action_btns, message)
VALUES ('popo-departure-confirm-request-v1', ARRAY['departure-confirm-btn']::popo_action_btn_type[],
        '**출발 시간을 확정해주세요!**
{departureTimeEndsAt} 이전까지 출발 시간이 확정되지 않으면 팟은 자동 해산 됩니다.
빠르게 출발 시간을 확정해주세요'),
       ('popo-departure-confirmed-v1', ARRAY[]::popo_action_btn_type[],
        '**출발 시간이 확정되었어요!**
출발 일시 : {departureTimeEndsAt}
출발 시간이 확정된 이후 부터는 입장/퇴장/강퇴가 불가능해요'),
       ('popo-reminder-taxi-call-v1', ARRAY['taxi-call-btn']::popo_action_btn_type[],
        '**만나기로 약속한 시간까지 **{remainDepartureTime}**분 남았어요!**
목적지까지 늦지 않도록 지금 택시를 호출해 보세요.'),
       ('popo-accounting-reminder-v1', ARRAY['accounting-request-btn']::popo_action_btn_type[],
        '**결제자는 정산을 요청해주세요!**
택시 이용이 끝나셨나요?
결제자는 아래 버튼을 클릭하여 택시비를 입력한 후 정산을 요청해주세요'),
       ('popo-accounting-request-v1', ARRAY['accounting-info-check-btn',
        'accounting-process-btn']::popo_action_btn_type[],
        '**우리 정산해요!**
요청 인원: {totalNum}명
총 금액: {totalCost}원
1인당 금액: {costPerUser}원
결제자에게 택시비를 송금해주세요'),
       ('popo-auto-archive-no-departure-confirm-v1', ARRAY[]::popo_action_btn_type[],
        '**팟이 자동으로 해산되어요!!**
출발 시간이 확정되지 않아 팟이 자동으로 해산되었습니다.'),
       ('popo-auto-archive-accounting-fin-v1', ARRAY[]::popo_action_btn_type[],
        '**정산이 모두 완료되었어요!**
10분 후 팟은 자동으로 해산됩니다.'),
       ('popo-auto-archive-v1', ARRAY[]::popo_action_btn_type[],
        '**팟이 자동으로 해산됩니다!**
팟쥐와 함께 만족스러운 여정 되셨나요?
새로운 팟으로 다시 만나요:)');
