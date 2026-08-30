const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")
const { sanitizeActivity } = require("../cloudfunctions/activityCatalog/activity-policy")

function sampleActivity(overrides = {}) {
  return {
    type: "low",
    title: "周五认真认识小桌",
    subtitle: "少人数，先一起吃饭再慢慢聊。",
    dateRaw: "2026-09-11",
    date: "9/11",
    weekday: "周五",
    time: "19:30",
    location: "大学路附近",
    groups: [{ key: "g1", people: 8, price: "¥99" }],
    capacity: 8,
    fee: "¥99",
    tags: ["少人数", "低压力"],
    poster: "/pages/index/images/posters/poster-dinner.jpg",
    ...overrides
  }
}

function loadCloudFunction() {
  const records = new Map()
  let currentOpenid = "openid-a"

  const collection = {
    where(query) {
      return {
        limit() {
          return {
            async get() {
              return { data: [...records.values()].filter((record) => Object.keys(query).every((key) => record[key] === query[key])) }
            }
          }
        }
      }
    },
    doc(id) {
      return {
        async get() {
          if (!records.has(id)) throw new Error("not found")
          return { data: records.get(id) }
        },
        async update({ data }) {
          if (!records.has(id)) throw new Error("not found")
          records.set(id, { ...records.get(id), ...data })
        }
      }
    },
    async add({ data }) {
      if (records.has(data._id)) throw new Error("duplicate")
      records.set(data._id, { ...data })
      return { _id: data._id }
    }
  }

  const fakeCloud = {
    DYNAMIC_CURRENT_ENV: "test",
    init() {},
    database() {
      return {
        async createCollection() {},
        collection(name) {
          assert.equal(name, "activities")
          return collection
        }
      }
    },
    getWXContext() {
      return { OPENID: currentOpenid }
    }
  }

  const originalLoad = Module._load
  Module._load = function load(request, parent, isMain) {
    if (request === "wx-server-sdk") return fakeCloud
    return originalLoad.call(this, request, parent, isMain)
  }
  const modulePath = require.resolve("../cloudfunctions/activityCatalog/index")
  delete require.cache[modulePath]
  const cloudFunction = require(modulePath)
  Module._load = originalLoad

  return {
    main: cloudFunction.main,
    records,
    setOpenid(openid) { currentOpenid = openid }
  }
}

test("公开活动只保留白名单字段并校验人数", () => {
  const result = sanitizeActivity(sampleActivity({ secret: "不可公开", groups: [{ people: 6, price: "免费" }] }))
  assert.equal(result.title, "周五认真认识小桌")
  assert.equal(result.capacity, 6)
  assert.equal(result.visibility, "public")
  assert.equal(result.secret, undefined)
  assert.throws(() => sanitizeActivity(sampleActivity({ groups: [{ people: 0, price: "" }], capacity: 0 })), /报名上限/)
})

test("发布后所有登录用户可见，但公开结果不包含发布者 openid", async () => {
  const harness = loadCloudFunction()
  const published = await harness.main({ action: "publish", activity: sampleActivity(), userInfo: { openId: "platform-value" } })
  assert.equal(published.ok, true)
  assert.equal(published.item.mine, true)
  assert.equal(Object.prototype.hasOwnProperty.call(published.item, "_openid"), false)

  harness.setOpenid("openid-b")
  const list = await harness.main({ action: "listPublic" })
  assert.equal(list.count, 1)
  assert.equal(list.items[0].mine, false)
  assert.equal(JSON.stringify(list.items).includes("openid-a"), false)
})

test("客户端不能指定身份，且只有发布者可以下架", async () => {
  const harness = loadCloudFunction()
  const rejected = await harness.main({ action: "publish", openid: "openid-b", activity: sampleActivity() })
  assert.equal(rejected.code, "IDENTITY_NOT_ALLOWED")

  const published = await harness.main({ action: "publish", activity: sampleActivity() })
  harness.setOpenid("openid-b")
  const forbidden = await harness.main({ action: "unpublish", activityId: published.item.id })
  assert.equal(forbidden.code, "FORBIDDEN")

  harness.setOpenid("openid-a")
  const removed = await harness.main({ action: "unpublish", activityId: published.item.id })
  assert.equal(removed.ok, true)
  const list = await harness.main({ action: "listPublic" })
  assert.equal(list.count, 0)
})
