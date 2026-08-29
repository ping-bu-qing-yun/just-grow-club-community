// 登录云函数：把 wx.login 的 code 换成真实用户身份（openid），并保存/更新用户档案
const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()
  console.log("[login] 收到调用", JSON.stringify({ OPENID: OPENID || "", APPID: APPID || "", silent: Boolean(event && event.silent) }))

  if (!OPENID) {
    console.error("[login] 缺少 openid")
    return { ok: false, msg: "no openid" }
  }

  // 静默模式：小程序冷启动时探测身份，只查询、不创建用户记录
  // 返回 existing = true 表示这个 openid 之前登录过（users 集合里有档案）
  if (event && event.silent) {
    try {
      const res = await db.collection("users").where({ _openid: OPENID }).limit(1).get()
      const user = res.data && res.data[0]
      console.log("[login] 静默探测:", user ? "已注册用户" : "新用户")
      if (user) {
        return {
          ok: true,
          openid: OPENID,
          existing: true,
          user: { _id: user._id, openid: OPENID, nickname: user.nickname || "", avatar: user.avatar || "" }
        }
      }
      return { ok: true, openid: OPENID, existing: false, user: null }
    } catch (e) {
      // 集合不存在或查询失败：视为新用户，走欢迎流程
      console.log("[login] 静默探测失败（按新用户处理）:", (e && e.message) || e)
      return { ok: true, openid: OPENID, existing: false, user: null }
    }
  }

  // 集合不存在时自动创建（首次部署后会执行一次）
  try {
    await db.createCollection("users")
    console.log("[login] users 集合已创建")
  } catch (e) {
    console.log("[login] users 集合创建跳过:", (e && e.message) || e)
  }

  const users = db.collection("users")
  const now = new Date()
  let user = null

  try {
    const res = await users.where({ _openid: OPENID }).limit(1).get()
    user = res.data && res.data[0]
    console.log("[login] 查询到用户:", user ? user._id : "无")
  } catch (e) {
    console.log("[login] 查询失败，走新增流程:", (e && e.message) || e)
  }

  if (!user) {
    const doc = {
      _openid: OPENID,
      nickname: "",
      avatar: "",
      createdAt: now,
      updatedAt: now
    }
    try {
      const add = await users.add({ data: doc })
      user = { _id: add._id, ...doc }
      console.log("[login] 新用户已写入:", add._id)
    } catch (e) {
      console.error("[login] 写入用户失败:", e)
      return { ok: false, msg: "add user failed: " + ((e && e.message) || e) }
    }
  } else {
    try {
      await users.doc(user._id).update({ data: { updatedAt: now } })
    } catch (e) {
      console.log("[login] 更新时间失败:", (e && e.message) || e)
    }
  }

  console.log("[login] 登录完成", JSON.stringify({ appid: APPID, openid: OPENID, userId: user._id }))
  return {
    ok: true,
    appid: APPID,
    openid: OPENID,
    user: {
      _id: user._id,
      openid: OPENID,
      nickname: user.nickname || "",
      avatar: user.avatar || ""
    }
  }
}
