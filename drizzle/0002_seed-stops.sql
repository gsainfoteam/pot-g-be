-- Custom SQL migration file, put your code below! --

-- Sample data for stops table
INSERT INTO "stops" ("pk", "name_kor", "name_eng", "lat", "lng", "created_at", "updated_at")
VALUES (uuid_generate_v4(), '지스트', 'GIST', 35.2293323, 126.8476869, NOW(), NOW()),
       (uuid_generate_v4(), '광주(유•스퀘어)', 'U-Square(or Gwangju Bus Terminal)', 35.1612826, 126.8798817, NOW(), NOW()),
       (uuid_generate_v4(), '광주송정역', 'Gwangju Songjeong', 35.1375814, 126.7909189, NOW(), NOW());
