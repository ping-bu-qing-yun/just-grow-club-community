const test = require("node:test")
const assert = require("node:assert/strict")
const { sanitizeActivity } = require("../cloudfunctions/activityCatalog/activity-policy")

// 复刻 pages/index/index.js publishActivity 构造的活动对象（含本次修复的 dateRaw）
function buildPublishPayload(overrides = {}) {
  return {
    id: `pub-${Date.now()}`,
    type: "low",
    dateRaw: "2026-09-11",
    date: "9/11",
    weekday: "周五",
    time: "19:30",
    title: "周五轻聊天晚餐局",
    subtitle: "流程清楚的小桌轻餐",
    category: "低压力",
    tags: ["低压力", "少人数"],
    people: "8人",
    capacity: 8,
    fee: "¥99",
    groups: [{ key: "g1", people: "8", price: "¥99" }],
    location: "KIC / 大学路附近",
    crowd: "想认真认识一个人的人",
    matchLabel: "低压力",
    schedule: [{ time: "19:30", title: "到场" }],
    ...overrides
  }
}

test("发布活动携带 dateRaw 时通过云端字段校验", () => {
  const activity = sanitizeActivity(buildPublishPayload())
  assert.equal(activity.dateRaw, "2026-09-11")
  assert.equal(activity.capacity, 8)
})

test("发布活动缺少 dateRaw 会被云端拒绝（回归本次修复）", () => {
  const payload = buildPublishPayload()
  delete payload.dateRaw
  assert.throws(() => sanitizeActivity(payload), (error) => error.code === "DATE_REQUIRED")
})

test("dateRaw 格式非法时同样被拒绝", () => {
  assert.throws(
    () => sanitizeActivity(buildPublishPayload({ dateRaw: "9/11" })),
    (error) => error.code === "DATE_REQUIRED"
  )
})

test("只有日期、没有分组名额时按容量上限字段兜底", () => {
  const activity = sanitizeActivity(buildPublishPayload({ groups: [], capacity: 6 }))
  assert.equal(activity.capacity, 6)
})
