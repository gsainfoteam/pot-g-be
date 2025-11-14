-- Custom SQL migration file, put your code below! --

-- Sample data for route table
INSERT INTO "route" ("pk", "from_stop_fk", "to_stop_fk", "short_name_kor", "short_name_eng", "created_at", "updated_at")
VALUES (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        (SELECT pk FROM stops WHERE name_kor = '광주송정역'),
        '지송', 'GiSong',
        NOW(), NOW()),
       (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        (SELECT pk FROM stops WHERE name_kor = '광주(유•스퀘어)'),
        '지유', 'GiU',
        NOW(), NOW()),
       (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '광주송정역'),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        '송지', 'SongGi',
        NOW(), NOW()),
       (uuid_generate_v4(),
        (SELECT pk FROM stops WHERE name_kor = '광주(유•스퀘어)'),
        (SELECT pk FROM stops WHERE name_kor = '지스트'),
        '유지', 'UGi',
        NOW(), NOW());