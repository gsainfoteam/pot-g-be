INSERT INTO "stops" ("pk", "name_kor", "name_eng", "lat", "lng", "created_at", "updated_at")
VALUES (uuid_generate_v4(), '비아정류소', 'Bia Bus Stop', 35.2254974, 126.8262466, NOW(), NOW()),
       (uuid_generate_v4(), '광주공항', 'Gwangju Airport', 35.1399310, 126.8106988, NOW(), NOW());

INSERT INTO "route" ("pk", "from_stop_fk", "to_stop_fk", "short_name_kor", "short_name_eng", "created_at", "updated_at")
VALUES (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '비아정류소'),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        '비지', 'BGi',
        NOW(), NOW()),
       (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        (SELECT pk FROM stops WHERE name_kor = '비아정류소'),
        '지비', 'GiB',
        NOW(), NOW()),
       (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '광주공항'),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        '공지', 'GongGi',
        NOW(), NOW()),
       (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        (SELECT pk FROM stops WHERE name_kor = '광주공항'),
        '지공', 'GiGong',
        NOW(), NOW());