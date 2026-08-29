const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")

function loadCloudFunction() {
  const records = new Map()
  let currentOpenid = "openid-a"

  const users = {
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
        async update({ data }) {
          if (!records.has(id)) throw new Error("not found")
          records.set(id, { ...records.get(id), ...data })
        },
        async remove() {
          records.delete(id)
        }
      }
    },
    async add({ data }) {
      const id = data._id || `random-${records.size + 1}`
      if (records.has(id)) throw new Error("duplicate")
      records.set(id, { ...data, _id: id })
      return { _id: id }
    }
  }

  const fakeCloud = {
    DYNAMIC_CURRENT_ENV: "test",
    init() {},
    database() {
      return {
        async createCollection() {},
        collection(name) {
          assert.equal(name, "users")
          return users
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
  const modulePath = require.resolve("../cloudfunctions/userProfile/index")
  delete require.cache[modulePath]
  const cloudFunction = require(modulePath)
  Module._load = originalLoad

  return {
    main: cloudFunction.main,
    records,
    setOpenid(openid) { currentOpenid = openid }
  }
}

test("平台自动注入的 userInfo（含 openId）不触发身份拒绝，客户端伪造的身份仍然被拒", async () => {
  const harness = loadCloudFunction()
  // 真机上 wx.cloud.callFunction 会向 event 注入 userInfo 系统字段，不应误判为越权。
  const injected = await harness.main({
    action: "get",
    userInfo: { appId: "wx-app", openId: "openid-a" }
  })
  assert.equal(injected.ok, true)

  const injectedSave = await harness.main({
    action: "save",
    userInfo: { appId: "wx-app", openId: "openid-a" },
    profile: { basicInfo: { name: "系统注入不应拦截" } }
  })
  assert.equal(injectedSave.ok, true)

  // 客户端自己传的 openid（无论放在哪一层）仍然必须被拒绝。
  const forged = await harness.main({ action: "save", openid: "openid-b", profile: { basicInfo: { name: "越权" } } })
  assert.equal(forged.code, "IDENTITY_NOT_ALLOWED")
})

test("资料云函数拒绝指定身份，并只返回调用者自己的资料", async () => {
  const harness = loadCloudFunction()
  const rejected = await harness.main({ action: "save", openid: "openid-b", profile: { basicInfo: { name: "越权" } } })
  assert.equal(rejected.code, "IDENTITY_NOT_ALLOWED")
  assert.equal(harness.records.size, 0)

  const saved = await harness.main({ action: "save", profile: { basicInfo: { name: "用户A" }, profileTitle: "慢热观察" } })
  assert.equal(saved.ok, true)
  assert.equal(harness.records.size, 1)

  harness.setOpenid("openid-b")
  const otherUser = await harness.main({ action: "get" })
  assert.equal(otherUser.ok, true)
  assert.equal(otherUser.existing, false)
  assert.equal(otherUser.profile, null)

  harness.setOpenid("openid-a")
  const owner = await harness.main({ action: "get" })
  assert.equal(owner.profile.basicInfo.name, "用户A")
})

test("保存资料会把同一 openid 的旧随机 users 文档收敛为一条", async () => {
  const harness = loadCloudFunction()
  harness.records.set("legacy-1", { _id: "legacy-1", _openid: "openid-a", nickname: "旧用户", updatedAt: new Date(1) })
  harness.records.set("legacy-2", { _id: "legacy-2", _openid: "openid-a", nickname: "旧用户", updatedAt: new Date(2) })

  const result = await harness.main({ action: "save", profile: { basicInfo: { name: "最新名字" } } })
  assert.equal(result.ok, true)
  const ownRecords = [...harness.records.values()].filter((record) => record._openid === "openid-a")
  assert.equal(ownRecords.length, 1)
  assert.match(ownRecords[0]._id, /^wx_[a-f0-9]{28}$/)
  assert.equal(ownRecords[0].profile.basicInfo.name, "最新名字")
  assert.equal(ownRecords[0].visibility, "private")
})
