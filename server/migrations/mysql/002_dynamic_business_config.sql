CREATE TABLE IF NOT EXISTS activity_category_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(64) NOT NULL,
  label VARCHAR(120) NOT NULL,
  theme_key VARCHAR(32) NOT NULL DEFAULT 'other',
  icon_key VARCHAR(64) NOT NULL DEFAULT 'sparkles',
  description VARCHAR(500) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_activity_category_configs_key (config_key),
  INDEX idx_activity_category_configs_enabled (enabled,sort_order,id),
  CONSTRAINT fk_activity_category_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_category_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_activity_category_configs_enabled CHECK (enabled IN (0,1))
);

CREATE TABLE IF NOT EXISTS onboarding_question_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_key VARCHAR(160) NOT NULL,
  section_key VARCHAR(64) NOT NULL,
  prompt VARCHAR(1000) NOT NULL,
  input_type ENUM('single','multiple','text') NOT NULL,
  required_flag TINYINT(1) NOT NULL DEFAULT 1,
  max_selections SMALLINT UNSIGNED NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_onboarding_question_configs_key (question_key),
  INDEX idx_onboarding_question_configs_enabled (enabled,section_key,sort_order,id),
  CONSTRAINT fk_onboarding_question_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_onboarding_question_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_onboarding_question_configs_required CHECK (required_flag IN (0,1)),
  CONSTRAINT chk_onboarding_question_configs_enabled CHECK (enabled IN (0,1)),
  CONSTRAINT chk_onboarding_question_configs_selections CHECK (max_selections IS NULL OR max_selections >= 1)
);

CREATE TABLE IF NOT EXISTS onboarding_option_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_key VARCHAR(160) NOT NULL,
  label VARCHAR(255) NOT NULL,
  answer_value VARCHAR(500) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_onboarding_option_configs_question_key (question_id,option_key),
  INDEX idx_onboarding_option_configs_enabled (question_id,enabled,sort_order,id),
  CONSTRAINT fk_onboarding_option_configs_question FOREIGN KEY (question_id) REFERENCES onboarding_question_configs(id) ON DELETE CASCADE,
  CONSTRAINT fk_onboarding_option_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_onboarding_option_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_onboarding_option_configs_enabled CHECK (enabled IN (0,1))
);

CREATE TABLE IF NOT EXISTS profile_option_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_key VARCHAR(64) NOT NULL,
  option_key VARCHAR(160) NOT NULL,
  label VARCHAR(255) NOT NULL,
  option_value VARCHAR(500) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_profile_option_configs_group_key (group_key,option_key),
  INDEX idx_profile_option_configs_enabled (group_key,enabled,sort_order,id),
  CONSTRAINT fk_profile_option_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_profile_option_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_profile_option_configs_enabled CHECK (enabled IN (0,1))
);

CREATE TABLE IF NOT EXISTS feedback_option_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_key VARCHAR(64) NOT NULL,
  option_key VARCHAR(160) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_feedback_option_configs_group_key (group_key,option_key),
  INDEX idx_feedback_option_configs_enabled (group_key,enabled,sort_order,id),
  CONSTRAINT fk_feedback_option_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_feedback_option_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_feedback_option_configs_enabled CHECK (enabled IN (0,1))
);

CREATE TABLE IF NOT EXISTS recommendation_rule_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rule_key VARCHAR(160) NOT NULL,
  source_term VARCHAR(255) NOT NULL,
  themes_json JSON NOT NULL,
  tokens_json JSON NOT NULL,
  reason_text VARCHAR(255) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_recommendation_rule_configs_key (rule_key),
  UNIQUE KEY uq_recommendation_rule_configs_term (source_term),
  INDEX idx_recommendation_rule_configs_enabled (enabled,sort_order,id),
  CONSTRAINT fk_recommendation_rule_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_recommendation_rule_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_recommendation_rule_configs_enabled CHECK (enabled IN (0,1))
);

CREATE TABLE IF NOT EXISTS recommendation_setting_configs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(160) NOT NULL,
  value_json JSON NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_recommendation_setting_configs_key (setting_key),
  INDEX idx_recommendation_setting_configs_enabled (enabled,sort_order,id),
  CONSTRAINT fk_recommendation_setting_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_recommendation_setting_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_recommendation_setting_configs_enabled CHECK (enabled IN (0,1))
);

CREATE TABLE IF NOT EXISTS config_revisions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  domain_key VARCHAR(64) NOT NULL,
  revision_no BIGINT UNSIGNED NOT NULL,
  actor_id VARCHAR(64) NULL,
  summary VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_config_revisions_domain_revision (domain_key,revision_no),
  INDEX idx_config_revisions_domain_created (domain_key,created_at,id),
  CONSTRAINT fk_config_revisions_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS config_audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  revision_id BIGINT UNSIGNED NOT NULL,
  domain_key VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_key VARCHAR(160) NOT NULL,
  action ENUM('created','updated','disabled','restored','deleted') NOT NULL,
  actor_id VARCHAR(64) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_config_audit_events_domain_created (domain_key,created_at,id),
  INDEX idx_config_audit_events_entity (entity_type,entity_key,created_at,id),
  CONSTRAINT fk_config_audit_events_revision FOREIGN KEY (revision_id) REFERENCES config_revisions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_config_audit_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE activity_feedback
  MODIFY COLUMN mood VARCHAR(160) NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME(3) NULL AFTER updated_at;

UPDATE activity_feedback SET mood='comfortable' WHERE mood='舒服自然';
UPDATE activity_feedback SET mood='nervous' WHERE mood='有点紧张';
UPDATE activity_feedback SET mood='rewarding' WHERE mood='收获很大';
UPDATE activity_feedback SET mood='neutral' WHERE mood='一般般';
UPDATE activity_feedback SET mood='not_suitable' WHERE mood='不太合适';

ALTER TABLE user_interest_tags
  ADD COLUMN IF NOT EXISTS enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at;

ALTER TABLE activity_proposals
  ADD COLUMN IF NOT EXISTS archived_at DATETIME(3) NULL AFTER review_note;

INSERT IGNORE INTO content_media (id,content_id,content_type,media_type,url,alt_text,sort_order,created_at)
SELECT CONCAT('media-',SHA2(CONCAT('activity:',id),256)),id,'activity','image',image,title,0,created_at
  FROM activities WHERE image<>'';

INSERT IGNORE INTO content_media (id,content_id,content_type,media_type,url,alt_text,sort_order,created_at)
SELECT CONCAT('media-',SHA2(CONCAT('need:',id),256)),id,'need','image',image,'',0,created_at
  FROM needs WHERE image IS NOT NULL AND image<>'';

INSERT IGNORE INTO content_media (id,content_id,content_type,media_type,url,alt_text,sort_order,created_at)
SELECT CONCAT('media-',SHA2(CONCAT('life:',id),256)),id,'life','image',image,'',0,created_at
  FROM life_posts WHERE image IS NOT NULL AND image<>'';

INSERT INTO activity_category_configs (config_key,label,theme_key,icon_key,sort_order) VALUES
  ('dinner','饭搭子','low','utensils',10),
  ('coffee','咖啡','low','coffee',20),
  ('sport','运动','other','dumbbell',30),
  ('hike','徒步','walk','footprints',40),
  ('art','看展','other','palette',50),
  ('board','桌游','other','dices',60)
ON DUPLICATE KEY UPDATE label=VALUES(label),theme_key=VALUES(theme_key),icon_key=VALUES(icon_key),sort_order=VALUES(sort_order);

UPDATE activities SET category='dinner' WHERE category='饭搭子';
UPDATE activities SET category='coffee' WHERE category='咖啡';
UPDATE activities SET category='sport' WHERE category='运动';
UPDATE activities SET category='hike' WHERE category='徒步';
UPDATE activities SET category='art' WHERE category='看展';
UPDATE activities SET category='board' WHERE category='桌游';

INSERT INTO onboarding_question_configs (question_key,section_key,prompt,input_type,required_flag,max_selections,sort_order) VALUES
  ('light:intent','light','你最近最想解决什么？','multiple',1,3,10),
  ('light:scene','light','你更容易接受哪种见面场景？','multiple',1,3,20),
  ('light:barrier','light','你最大的出门阻力是什么？','multiple',1,3,30),
  ('qa:basic:0','qa-basic','最近一次让你觉得“做自己很舒服”的时刻是什么？','text',1,NULL,10),
  ('qa:basic:1','qa-basic','你理想中的周末，通常会怎么度过？','text',1,NULL,20),
  ('qa:basic:2','qa-basic','一段关系里，你最希望被怎样理解？','text',1,NULL,30),
  ('qa:extra:0','qa-extra','你通常怎样表达在意？','text',0,NULL,10),
  ('qa:extra:1','qa-extra','什么样的聊天会让你放松？','text',0,NULL,20),
  ('qa:extra:2','qa-extra','你希望彼此保留怎样的空间？','text',0,NULL,30),
  ('qa:extra:3','qa-extra','你更看重稳定还是新鲜？','text',0,NULL,40),
  ('qa:extra:4','qa-extra','遇到分歧时你习惯怎么处理？','text',0,NULL,50),
  ('qa:extra:5','qa-extra','什么会让你愿意再见一个人？','text',0,NULL,60)
ON DUPLICATE KEY UPDATE section_key=VALUES(section_key),prompt=VALUES(prompt),input_type=VALUES(input_type),required_flag=VALUES(required_flag),max_selections=VALUES(max_selections),sort_order=VALUES(sort_order);

INSERT IGNORE INTO user_onboarding_answers (user_id,question_key,answer_order,answer_value,updated_at)
SELECT user_id,'light:intent',answer_order,answer_value,updated_at FROM user_onboarding_answers WHERE question_key='light:0';
INSERT IGNORE INTO user_onboarding_answers (user_id,question_key,answer_order,answer_value,updated_at)
SELECT user_id,'light:scene',answer_order,answer_value,updated_at FROM user_onboarding_answers WHERE question_key='light:1';
INSERT IGNORE INTO user_onboarding_answers (user_id,question_key,answer_order,answer_value,updated_at)
SELECT user_id,'light:barrier',answer_order,answer_value,updated_at FROM user_onboarding_answers WHERE question_key='light:2';
DELETE FROM user_onboarding_answers WHERE question_key IN ('light:0','light:1','light:2');

INSERT INTO onboarding_option_configs (question_id,option_key,label,answer_value,sort_order)
SELECT q.id,seed.option_key,seed.label,seed.answer_value,seed.sort_order
FROM onboarding_question_configs q
JOIN (
  SELECT 'light:intent' question_key,'meet_reliable' option_key,'想认识靠谱的人' label,'想认识靠谱的人' answer_value,10 sort_order UNION ALL
  SELECT 'light:intent','natural_relationship','想自然一点脱单','想自然一点脱单',20 UNION ALL
  SELECT 'light:intent','deep_conversation','想找能深聊的人','想找能深聊的人',30 UNION ALL
  SELECT 'light:intent','offline_circle','想扩大线下社交圈','想扩大线下社交圈',40 UNION ALL
  SELECT 'light:intent','relationship_pattern','想理解关系模式','想理解关系模式',50 UNION ALL
  SELECT 'light:intent','uncertain','暂时不确定','暂时不确定',60 UNION ALL
  SELECT 'light:scene','small_dinner','少人数饭局','少人数饭局',10 UNION ALL
  SELECT 'light:scene','casual_walk','轻松散步','轻松散步',20 UNION ALL
  SELECT 'light:scene','deep_talk','主题 deep talk','主题 deep talk',30 UNION ALL
  SELECT 'light:scene','shared_interest','共同兴趣活动','共同兴趣活动',40 UNION ALL
  SELECT 'light:scene','relationship_workshop','关系工作坊','关系工作坊',50 UNION ALL
  SELECT 'light:scene','small_group_match','小组匹配','小组匹配',60 UNION ALL
  SELECT 'light:barrier','awkward','怕尴尬','怕尴尬',10 UNION ALL
  SELECT 'light:barrier','crowded','怕人多','怕人多',20 UNION ALL
  SELECT 'light:barrier','blind_date','怕太像相亲','怕太像相亲',30 UNION ALL
  SELECT 'light:barrier','no_topic','怕聊不起来','怕聊不起来',40 UNION ALL
  SELECT 'light:barrier','far_away','地点太远','地点太远',50 UNION ALL
  SELECT 'light:barrier','unknown_people','不知道来的人怎样','不知道来的人怎样',60
) seed ON seed.question_key=q.question_key
ON DUPLICATE KEY UPDATE label=VALUES(label),answer_value=VALUES(answer_value),sort_order=VALUES(sort_order);

INSERT INTO profile_option_configs (group_key,option_key,label,option_value,sort_order) VALUES
  ('gender','female','女','女',10),('gender','male','男','男',20),('gender','undisclosed','不透露','不透露',30),('gender','custom','自定义','自定义',40),
  ('education','bachelor','本科','本科',10),('education','master','硕士','硕士',20),('education','doctor','博士','博士',30),('education','other','其他','其他',40),
  ('relationship','single','单身','单身',10),('relationship','looking','正在寻觅','正在寻觅',20),('relationship','dating','正在了解一段关系','正在了解一段关系',30),('relationship','private','不透露','不透露',40),
  ('profile_tag','deep_chat','喜欢深聊','喜欢深聊',10),('profile_tag','weekend_walk','周末散步','周末散步',20),('profile_tag','slow_warm','慢热','慢热',30),
  ('preference','coffee','喝杯咖啡','喝杯咖啡',10),('preference','art','看展','看展',20),('preference','outdoor','户外运动','户外运动',30)
ON DUPLICATE KEY UPDATE label=VALUES(label),option_value=VALUES(option_value),sort_order=VALUES(sort_order);

INSERT INTO feedback_option_configs (group_key,option_key,label,sort_order) VALUES
  ('activity_mood','comfortable','舒服自然',10),('activity_mood','nervous','有点紧张',20),('activity_mood','rewarding','收获很大',30),('activity_mood','neutral','一般般',40),('activity_mood','not_suitable','不太合适',50),
  ('activity_dislike_reason','want_attendees','想看看来的人',10),('activity_dislike_reason','too_blind_date','怕太像相亲',20),('activity_dislike_reason','time_conflict','时间不合适',30),('activity_dislike_reason','too_far','地点有点远',40),('activity_dislike_reason','group_size','人数有顾虑',50),('activity_dislike_reason','topic_mismatch','话题没击中',60)
ON DUPLICATE KEY UPDATE label=VALUES(label),sort_order=VALUES(sort_order);

INSERT INTO recommendation_rule_configs (rule_key,source_term,themes_json,tokens_json,reason_text,sort_order) VALUES
  ('intent:meet_reliable','想认识靠谱的人',JSON_ARRAY('low'),JSON_ARRAY('想认识靠谱的人','低压力','少人数','自然聊天','靠谱'),'更贴近你想认识靠谱伙伴的期待',10),
  ('intent:natural_relationship','想自然一点脱单',JSON_ARRAY('low','deep'),JSON_ARRAY('自然','不强相亲','慢了解','脱单','关系'),'关系推进方式更自然',20),
  ('intent:deep_conversation','想找能深聊的人',JSON_ARRAY('deep'),JSON_ARRAY('想找能深聊的人','deep talk','价值观','深聊','夜谈'),'更容易发生认真交流',30),
  ('intent:offline_circle','想扩大线下社交圈',JSON_ARRAY('low','walk','other'),JSON_ARRAY('轻社交','社交','附近','散步','看展'),'适合轻松扩展线下社交圈',40),
  ('intent:relationship_pattern','想理解关系模式',JSON_ARRAY('workshop','deep'),JSON_ARRAY('想理解关系模式','关系模式','工作坊','关系'),'包含关系理解与练习',50),
  ('intent:uncertain','暂时不确定',JSON_ARRAY('low'),JSON_ARRAY('低压力','轻社交','少人数'),'适合从低压力场景开始',60),
  ('scene:small_dinner','少人数饭局',JSON_ARRAY('low'),JSON_ARRAY('少人数','低压力','饭','晚餐','轻餐','小桌'),'少人数场景更容易放松',70),
  ('scene:casual_walk','轻松散步',JSON_ARRAY('walk'),JSON_ARRAY('散步','轻社交','户外','走'),'边走边聊更自然',80),
  ('scene:deep_talk','主题 deep talk',JSON_ARRAY('deep'),JSON_ARRAY('deep talk','价值观','深聊','对谈'),'主题与深聊偏好相符',90),
  ('scene:shared_interest','共同兴趣活动',JSON_ARRAY('other','walk'),JSON_ARRAY('看展','文艺','兴趣','骑行','运动'),'共同兴趣可以降低破冰压力',100),
  ('scene:relationship_workshop','关系工作坊',JSON_ARRAY('workshop'),JSON_ARRAY('工作坊','关系模式','练习'),'有结构的关系练习更匹配',110),
  ('scene:small_group_match','小组匹配',JSON_ARRAY('low','workshop'),JSON_ARRAY('少人数','小组','匹配','低压力'),'小组形式与偏好相符',120),
  ('barrier:awkward','怕尴尬',JSON_ARRAY('low'),JSON_ARRAY('怕尴尬','低压力','少人数','自然聊天'),'流程和人数有助于降低尴尬',130),
  ('barrier:crowded','怕人多',JSON_ARRAY('low','deep'),JSON_ARRAY('少人数','低压力','小桌','5人','6人','4人'),'人数规模更可控',140),
  ('barrier:blind_date','怕太像相亲',JSON_ARRAY('low','deep','walk'),JSON_ARRAY('不强相亲','低压力','自然','轻社交'),'不强调配对和关系定义',150),
  ('barrier:no_topic','怕聊不起来',JSON_ARRAY('low','workshop'),JSON_ARRAY('低压力','流程','破冰','少人数'),'结构化流程能降低冷场风险',160),
  ('barrier:far_away','地点太远',JSON_ARRAY(),JSON_ARRAY('附近','午间'),'地点信号更贴近你的顾虑',170),
  ('barrier:unknown_people','不知道来的人怎样',JSON_ARRAY('low','workshop'),JSON_ARRAY('低压力','边界','少人数','靠谱'),'参与边界和人群描述更清楚',180),
  ('profile:deep_chat','喜欢深聊',JSON_ARRAY('deep'),JSON_ARRAY('deep talk','深聊','价值观','慢聊'),'符合你的深聊偏好',190),
  ('profile:weekend_walk','周末散步',JSON_ARRAY('walk'),JSON_ARRAY('散步','周末','户外','轻社交'),'符合周末散步偏好',200),
  ('profile:slow_warm','慢热',JSON_ARRAY('low','deep'),JSON_ARRAY('低压力','慢了解','慢聊','少人数'),'节奏更适合慢热的人',210),
  ('preference:coffee','喝杯咖啡',JSON_ARRAY('low','other'),JSON_ARRAY('咖啡','轻社交','慢聊'),'符合咖啡见面的偏好',220),
  ('preference:art','看展',JSON_ARRAY('other'),JSON_ARRAY('看展','文艺'),'符合看展兴趣',230),
  ('preference:outdoor','户外运动',JSON_ARRAY('walk'),JSON_ARRAY('户外','骑行','轻运动','散步'),'符合户外活动偏好',240),
  ('profile:nearby','附近',JSON_ARRAY(),JSON_ARRAY('附近'),'包含附近地点信号',250),
  ('profile:natural_chat','自然聊天',JSON_ARRAY('low'),JSON_ARRAY('自然聊天','低压力','少人数'),'聊天氛围更自然',260)
ON DUPLICATE KEY UPDATE source_term=VALUES(source_term),themes_json=VALUES(themes_json),tokens_json=VALUES(tokens_json),reason_text=VALUES(reason_text),sort_order=VALUES(sort_order);

INSERT INTO recommendation_setting_configs (setting_key,value_json,description,sort_order) VALUES
  ('weights',JSON_OBJECT('intent',35,'scene',30,'profile',15,'theme',8,'formal',10,'pre',4,'city',3,'joinedPenalty',18),'推荐评分权重',10),
  ('cold_start',JSON_OBJECT('formal',50,'pre',42),'无画像信号时的安全默认分',20),
  ('thresholds',JSON_ARRAY(JSON_OBJECT('min',80,'label','很适合你'),JSON_OBJECT('min',60,'label','值得看看'),JSON_OBJECT('min',0,'label','可以了解')),'推荐等级阈值，按 min 降序',30),
  ('summary_rules',JSON_ARRAY(
    JSON_OBJECT('terms',JSON_ARRAY('怕尴尬','少人数饭局'),'label','你更适合，慢一点、少一点人的见面'),
    JSON_OBJECT('terms',JSON_ARRAY('想找能深聊的人','主题 deep talk'),'label','你更适合，能认真聊几句的小局'),
    JSON_OBJECT('terms',JSON_ARRAY('轻松散步','想扩大线下社交圈'),'label','你更适合，边走边认识的轻松场景'),
    JSON_OBJECT('terms',JSON_ARRAY('想理解关系模式','关系工作坊'),'label','你更适合，有一点结构的关系练习'),
    JSON_OBJECT('terms',JSON_ARRAY('怕太像相亲'),'label','你更适合，不强定义关系的自然场景')
  ),'画像摘要规则',40)
ON DUPLICATE KEY UPDATE value_json=VALUES(value_json),description=VALUES(description),sort_order=VALUES(sort_order);

INSERT INTO config_revisions (domain_key,revision_no,summary) VALUES
  ('activity-categories',1,'系统初始化活动分类'),
  ('onboarding',1,'系统初始化入门问卷'),
  ('profile-options',1,'系统初始化资料选项'),
  ('feedback-options',1,'系统初始化反馈选项'),
  ('recommendation',1,'系统初始化推荐规则')
ON DUPLICATE KEY UPDATE summary=VALUES(summary);
