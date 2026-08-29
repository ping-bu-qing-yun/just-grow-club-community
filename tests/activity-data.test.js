const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")

function loadCloudFunction() {
  const records = new Map()
  let currentOpenid = "openid-a"

  const collection = {
    where(query) {
      return {
        limit() {
          return {
            async get() {
              return { data: [...records.values()].filter((record) => record._openid === query._openid) }
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
        async remove() {
          if (!records.has(id)) throw new Error("not found")
          records.delete(id)
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
          assert.equal(name, "registrations")
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
  const modulePath = require.resolve("../cloudfunctions/activityData/index")
  delete require.cache[modulePath]
  const cloudFunction = require(modulePath)
  Module._load = originalLoad

  return {
    main: cloudFunction.main,
    records,
    setOpenid(openid) { currentOpenid = openid }
  }
}

test("报名写入 registrations 集合并按本人隔离读取", async () => {
  const harness = loadCloudFunction()

  const registered = await harness.main({ action: "register", activityId: "act-1", title: "周五晚桌游局" })
  assert.equal(registered.ok, true)
  assert.equal(registered.registered, true)
  assert.equal(harness.records.size, 1)

  const mine = await harness.main({ action: "listMine" })
  assert.equal(mine.ok, true)
  assert.equal(mine.count, 1)
  assert.equal(mine.items[0].activityId, "act-1")
  assert.equal(mine.items[0].title, "周五晚桌游局")

  harness.setOpenid("openid-b")
  const others = await harness.main({ action: "listMine" })
  assert.equal(others.count, 0)
})

test("重复报名幂等：同一用户同一活动只有一条记录", async () => {
  const harness = loadCloudFunction()
  await harness.main({ action: "register", activityId: "act-1", title: "散步局" })
  const again = await harness.main({ action: "register", activityId: "act-1", title: "散步局" })
  assert.equal(again.ok, true)
  assert.equal(harness.records.size, 1)

  // 同一用户另一场活动是独立记录
  await harness.main({ action: "register", activityId: "act-2", title: "深聊局" })
  assert.equal(harness.records.size, 2)
})

test("取消报名后可重新报名，他人记录不受影响", async () => {
  const harness = loadCloudFunction()
  await harness.main({ action: "register", activityId: "act-1", title: "A局" })
  harness.setOpenid("openid-b")
  await harness.main({ action: "register", activityId: "act-1", title: "A局" })
  assert.equal(harness.records.size, 2)

  harness.setOpenid("openid-a")
  const cancelled = await harness.main({ action: "cancel", activityId: "act-1" })
  assert.equal(cancelled.ok, true)
  assert.equal(harness.records.size, 1)

  // 取消后再报名成功
  const re = await harness.main({ action: "register", activityId: "act-1", title: "A局" })
  assert.equal(re.ok, true)
  assert.equal(harness.records.size, 2)
})

test("非法 action 与缺失活动 ID 被拒绝，不写库", async () => {
  const harness = loadCloudFunction()
  const badAction = await harness.main({ action: "deleteAll" })
  assert.equal(badAction.code, "INVALID_ACTION")

  const noActivity = await harness.main({ action: "register", title: "没有活动ID" })
  assert.equal(noActivity.code, "INVALID_ACTIVITY")

  // 非字符串 activityId 清洗为空，同样拒绝
  const weird = await harness.main({ action: "register", activityId: { hack: 1 } })
  assert.equal(weird.code, "INVALID_ACTIVITY")
  assert.equal(harness.records.size, 0)
})
