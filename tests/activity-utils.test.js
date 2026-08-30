const test = require("node:test")
const assert = require("node:assert/strict")
const { buildActivityHistory, filterExploreActivities, parseActivityCapacity, rollActivityDates } = require("../utils/activity-utils")

test("演示活动滚动到未来最近一次对应星期，不展示过期日期", () => {
  const now = new Date(2026, 7, 29, 22, 0)
  const rolled = rollActivityDates([
    { id: "dinner", time: "19:30" },
    { id: "walk", time: "19:00" }
  ], now)
  assert.equal(rolled[0].dateRaw, "2026-09-04")
  assert.equal(rolled[0].weekday, "周五")
  assert.equal(rolled[1].dateRaw, "2026-09-05")
  assert.equal(rolled[1].weekday, "周六")
})

test("同城可达保留同城活动，而不是返回空列表", () => {
  const feed = [
    { id: "near", type: "low", title: "附近晚餐", location: "杨浦" },
    { id: "far", type: "deep", title: "城市深谈", location: "徐汇" }
  ]
  const result = filterExploreActivities(feed, {
    distance: "sameCity",
    distanceMap: { near: 2, far: 12 }
  })
  assert.deepEqual(result.map((item) => item.id), ["near", "far"])
})

test("主题、距离和搜索可以组合筛选", () => {
  const feed = [
    { id: "a", type: "low", title: "轻聊天", location: "杨浦", tags: ["少人数"] },
    { id: "b", type: "deep", title: "深度对谈", location: "徐汇", tags: ["价值观"] }
  ]
  const result = filterExploreActivities(feed, {
    theme: "deep",
    distance: "middle",
    search: "价值观",
    distanceMap: { a: 2, b: 4 }
  })
  assert.deepEqual(result.map((item) => item.id), ["b"])
})

test("活动人数支持纯数字和区间文本，并取报名上限", () => {
  assert.equal(parseActivityCapacity(8), 8)
  assert.equal(parseActivityCapacity("6-8人"), 8)
  assert.equal(parseActivityCapacity(""), 0)
})

test("参与活动按未来报名和过去参与拆分，并保留待同步状态", () => {
  const now = new Date(2026, 7, 30, 12, 0)
  const result = buildActivityHistory(
    ["future", "past"],
    [{ activityId: "past", title: "过去的小桌", dateRaw: "2026-08-20", time: "19:00", status: "registered" }],
    [
      { id: "future", title: "未来散步", dateRaw: "2026-09-05", time: "19:00" },
      { id: "past", title: "过去活动" }
    ],
    ["future"],
    now
  )
  assert.equal(result.current.length, 1)
  assert.equal(result.current[0].status, "pending")
  assert.equal(result.past.length, 1)
  assert.equal(result.past[0].title, "过去的小桌")
})
