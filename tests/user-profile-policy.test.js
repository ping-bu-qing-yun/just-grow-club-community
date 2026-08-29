const test = require("node:test")
const assert = require("node:assert/strict")
const {
  canonicalUserId,
  containsForbiddenIdentity,
  sanitizeProfile
} = require("../cloudfunctions/userProfile/profile-policy")

test("客户端不能在任意层级指定用户身份", () => {
  assert.equal(containsForbiddenIdentity({ action: "get", openid: "other-user" }), true)
  assert.equal(containsForbiddenIdentity({ action: "save", profile: { targetOpenid: "other-user" } }), true)
  assert.equal(containsForbiddenIdentity({ action: "save", profile: { basicInfo: { name: "小恰" } } }), false)
})

test("同一微信身份总是映射到同一条确定性 users 文档", () => {
  const first = canonicalUserId("openid-a")
  assert.equal(first, canonicalUserId("openid-a"))
  assert.notEqual(first, canonicalUserId("openid-b"))
  assert.match(first, /^wx_[a-f0-9]{28}$/)
})

test("云端只接收白名单资料字段并限制危险对象键", () => {
  const profile = sanitizeProfile({
    basicInfo: { name: " 小恰 ", constructor: "bad" },
    profileTitle: "慢热观察",
    phoneNumber: "13800000000",
    openid: "other-user"
  })
  assert.equal(profile.basicInfo.name, "小恰")
  assert.equal(Object.prototype.hasOwnProperty.call(profile.basicInfo, "constructor"), false)
  assert.equal(profile.profileTitle, "慢热观察")
  assert.equal(profile.phoneNumber, undefined)
  assert.equal(profile.openid, undefined)
})
