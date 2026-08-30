const test = require("node:test")
const assert = require("node:assert/strict")
const { hasRequiredBasicInfo, nextOnboardingView } = require("../utils/onboarding")

test("新用户从轻问答开始，不因 users 记录已创建而跳过注册", () => {
  assert.equal(nextOnboardingView({}), "lightQa")
})

test("注册流程按已完成进度继续", () => {
  assert.equal(nextOnboardingView({ entryDone: true }), "deepQa")
  assert.equal(nextOnboardingView({ entryDone: true, relDone: true }), "basicInfo")
})

test("只有完成问答和必填资料才进入专属页", () => {
  const complete = {
    entryDone: true,
    relDone: true,
    basicInfo: { name: "小鱼", gender: "先不答", birth: "1995-01-01", area: "上海市 杨浦区" }
  }
  assert.equal(hasRequiredBasicInfo(complete), true)
  assert.equal(nextOnboardingView(complete), "home")
})
