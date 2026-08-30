const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")

function loadCloudFunction() {
  const records = new Map()
  const catalogRecords = new Map()
  let currentOpenid = "openid-a"

  const registrationCollection = {
    where(query) {
      return {
        limit() {
          return {
            async get() {
              return {
                data: [...records.values()].filter((record) => Object.keys(query).every((key) => record[key] === query[key]))
              }
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

  const activityCollection = {
    doc(id) {
      return {
        async get() {
          if (!catalogRecords.has(id)) throw new Error("not found")
          return { data: catalogRecords.get(id) }
        }
      }
    }
  }

  const fakeCloud = {
    DYNAMIC_CURRENT_ENV: "test",
    init() {},
    database() {
      return {
        async createCollection() {},
        collection(name) {
          if (name === "registrations") return registrationCollection
          if (name === "activities") return activityCollection
          throw new Error(`unexpected collection: ${name}`)
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
    catalogRecords,
    setOpenid(openid) { currentOpenid = openid }
  }
}

test("报名写入 registrations 集合并按本人隔离读取", async () => {
  const harness = loadCloudFunction()

  const registered = await harness.main({ action: "register", activityId: "act-1", title: "周五晚桌游局", capacity: 8 })
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

test("客户端指定他人 openid 不会改变报名归属", async () => {
  const harness = loadCloudFunction()
  await harness.main({
    action: "register",
    activityId: "act-secure",
    title: "身份隔离测试",
    capacity: 4,
    openid: "openid-victim",
    _openid: "openid-victim"
  })
  const stored = [...harness.records.values()][0]
  assert.equal(stored._openid, "openid-a")

  harness.setOpenid("openid-victim")
  const victim = await harness.main({ action: "listMine" })
  assert.equal(victim.count, 0)
})

test("重复报名幂等：同一用户同一活动只有一条记录", async () => {
  const harness = loadCloudFunction()
  await harness.main({ action: "register", activityId: "act-1", title: "散步局", capacity: 8 })
  const again = await harness.main({ action: "register", activityId: "act-1", title: "散步局", capacity: 8 })
  assert.equal(again.ok, true)
  assert.equal(harness.records.size, 1)

  // 同一用户另一场活动是独立记录
  await harness.main({ action: "register", activityId: "act-2", title: "深聊局", capacity: 6 })
  assert.equal(harness.records.size, 2)
})

test("取消报名后可重新报名，他人记录不受影响", async () => {
  const harness = loadCloudFunction()
  await harness.main({ action: "register", activityId: "act-1", title: "A局", capacity: 2 })
  harness.setOpenid("openid-b")
  await harness.main({ action: "register", activityId: "act-1", title: "A局", capacity: 2 })
  assert.equal(harness.records.size, 2)

  harness.setOpenid("openid-a")
  const cancelled = await harness.main({ action: "cancel", activityId: "act-1" })
  assert.equal(cancelled.ok, true)
  assert.equal(harness.records.size, 1)

  // 取消后再报名成功
  const re = await harness.main({ action: "register", activityId: "act-1", title: "A局", capacity: 2 })
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

test("达到活动人数上限后拒绝继续报名，取消后释放名额", async () => {
  const harness = loadCloudFunction()
  await harness.main({ action: "register", activityId: "pub-capacity", title: "两人小桌", capacity: 2 })
  harness.setOpenid("openid-b")
  const second = await harness.main({ action: "register", activityId: "pub-capacity", title: "两人小桌", capacity: 2 })
  assert.equal(second.ok, true)
  assert.equal(second.isFull, true)
  assert.equal(second.registeredCount, 2)

  harness.setOpenid("openid-c")
  const full = await harness.main({ action: "register", activityId: "pub-capacity", title: "两人小桌", capacity: 2 })
  assert.equal(full.ok, false)
  assert.equal(full.code, "ACTIVITY_FULL")
  assert.equal(harness.records.size, 2)

  harness.setOpenid("openid-a")
  await harness.main({ action: "cancel", activityId: "pub-capacity", capacity: 2 })
  harness.setOpenid("openid-c")
  const reopened = await harness.main({ action: "register", activityId: "pub-capacity", title: "两人小桌", capacity: 2 })
  assert.equal(reopened.ok, true)
  assert.equal(harness.records.size, 2)
})

test("availability 返回云端真实人数，不接受静态活动的伪造上限", async () => {
  const harness = loadCloudFunction()
  await harness.main({ action: "register", activityId: "dinner", title: "晚餐局", capacity: 1 })
  const result = await harness.main({ action: "availability", activityId: "dinner", capacity: 1 })
  assert.equal(result.ok, true)
  assert.equal(result.capacity, 8)
  assert.equal(result.registeredCount, 1)
  assert.equal(result.isFull, false)
})

test("公开活动人数上限以 activities 云端记录为准", async () => {
  const harness = loadCloudFunction()
  harness.catalogRecords.set("act_public", {
    _id: "act_public",
    status: "published",
    visibility: "public",
    capacity: 3
  })
  const result = await harness.main({ action: "register", activityId: "act_public", title: "公开活动", capacity: 99 })
  assert.equal(result.ok, true)
  assert.equal(result.capacity, 3)
})

test("公开活动下架后不能通过客户端人数参数继续报名", async () => {
  const harness = loadCloudFunction()
  harness.catalogRecords.set("act_closed", {
    _id: "act_closed",
    status: "unpublished",
    visibility: "public",
    capacity: 3
  })
  const result = await harness.main({ action: "register", activityId: "act_closed", title: "已下架活动", capacity: 99 })
  assert.equal(result.ok, false)
  assert.equal(result.code, "ACTIVITY_UNAVAILABLE")
  assert.equal(harness.records.size, 0)
})
