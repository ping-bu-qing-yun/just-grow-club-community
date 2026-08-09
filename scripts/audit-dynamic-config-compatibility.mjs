import mysql from 'mysql2/promise';

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`缺少 ${name} 数据库配置`);
  return value;
}

async function main() {
  const connection = await mysql.createConnection({
    host: required('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: required('MYSQL_USER'),
    password: required('MYSQL_PASSWORD'),
    database: required('MYSQL_DATABASE'),
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
    dateStrings: true,
  });
  try {
    await connection.query('SET SESSION TRANSACTION READ ONLY');
    await connection.beginTransaction();
    const queries = {
      activityCategories: 'SELECT category AS value,COUNT(*) AS rows_count FROM activities GROUP BY category ORDER BY category',
      profileGender: "SELECT COALESCE(NULLIF(gender,''),'(empty)') AS value,COUNT(*) AS rows_count FROM user_profiles GROUP BY value ORDER BY value",
      profileEducation: "SELECT COALESCE(NULLIF(education,''),'(empty)') AS value,COUNT(*) AS rows_count FROM user_profiles GROUP BY value ORDER BY value",
      profileRelationship: "SELECT COALESCE(NULLIF(relationship_status,''),'(empty)') AS value,COUNT(*) AS rows_count FROM user_profiles GROUP BY value ORDER BY value",
      interestTags: 'SELECT tag_kind AS kind,label AS value,COUNT(*) AS rows_count FROM user_interest_tags GROUP BY tag_kind,label ORDER BY tag_kind,label',
      onboardingAnswers: 'SELECT question_key AS questionKey,answer_value AS value,COUNT(*) AS rows_count FROM user_onboarding_answers GROUP BY question_key,answer_value ORDER BY question_key,answer_value',
      feedbackMoods: 'SELECT mood AS value,COUNT(*) AS rows_count FROM activity_feedback GROUP BY mood ORDER BY mood',
      participationStatuses: 'SELECT status AS value,COUNT(*) AS rows_count FROM activity_members GROUP BY status ORDER BY status',
      mediaUrls: `SELECT
        SUM(CASE WHEN image IS NOT NULL AND image<>'' THEN 1 ELSE 0 END) AS total,
        SUM(CASE WHEN image LIKE 'https://%' OR image LIKE '/assets/%' OR image IS NULL OR image='' THEN 0 ELSE 1 END) AS incompatible
        FROM (SELECT image FROM activities UNION ALL SELECT image FROM needs UNION ALL SELECT image FROM life_posts) media`,
    };
    const report = {};
    for (const [key, sql] of Object.entries(queries)) {
      const [rows] = await connection.query(sql);
      report[key] = rows;
    }
    await connection.rollback();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '动态配置兼容性核对失败');
  process.exitCode = 1;
});
