const test = require("node:test")
const assert = require("node:assert/strict")
const profileSync = require("../utils/profile-sync")

test("云端优先合并，同时保留云端尚无的本地字段", () => {
  const cloud = {
    basicInfo: { name: "云端名字", area: "上海" },
    entryAnswers: { q1: { 0: true } },
    profileTitle: "云端画像"
  }
  const local = {
    basicInfo: { name: "旧本地名字", occupation: "设计师" },
    entryAnswers: { q2: { 1: true } },
    profileInsight: "本地补充"
  }
  const merged = profileSync.mergeProfiles(cloud, local)
  assert.equal(merged.basicInfo.name, "云端名字")
  assert.equal(merged.basicInfo.occupation, "设计师")
  assert.deepEqual(merged.entryAnswers.q1, { 0: true })
  assert.deepEqual(merged.entryAnswers.q2, { 1: true })
  assert.equal(merged.profileInsight, "本地补充")
})

test("待同步的本地版本可以覆盖旧云端版本", () => {
  const merged = profileSync.mergeProfiles(
    { basicInfo: { name: "本地最新" }, profileTitle: "最新画像" },
    { basicInfo: { name: "云端旧值", area: "上海" }, profileTitle: "旧画像" }
  )
  assert.equal(merged.basicInfo.name, "本地最新")
  assert.equal(merged.basicInfo.area, "上海")
  assert.equal(merged.profileTitle, "最新画像")
})

test("本地头像路径不上传云端，云文件和 https 地址允许上传", () => {
  assert.equal(profileSync.buildCloudProfile({ avatarUrl: "wxfile://tmp/avatar.jpg" }).avatarUrl, undefined)
  assert.equal(profileSync.buildCloudProfile({ avatarUrl: "cloud://env/avatar.jpg" }).avatarUrl, "cloud://env/avatar.jpg")
  assert.equal(profileSync.buildCloudProfile({ avatarUrl: "https://example.com/avatar.jpg" }).avatarUrl, "https://example.com/avatar.jpg")
})

test("旧本地问答可识别为需要迁移的有效资料", () => {
  assert.equal(profileSync.hasMeaningfulProfile({ entryAnswers: { q1: { 0: true } } }), true)
  assert.equal(profileSync.hasMeaningfulProfile({ profileTitle: "默认画像" }), false)
})
