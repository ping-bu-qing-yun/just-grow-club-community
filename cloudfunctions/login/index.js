// 登录云函数：把 wx.login 的 code 换成真实用户身份（openid），并保存/更新用户档案
const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()

  if (!OPENID) {
    return { ok: false, msg: "no openid" }
  }

  // 集合不存在时自动创建（首次部署后会执行一次）
  try {
    await db.createCollection("users")
  } catch (e) {
    // 已存在则忽略
  }

  const users = db.collection("users")
  const now = new Date()
  let user = null

  try {
    const res = await users.where({ _openid: OPENID }).limit(1).get()
    user = res.data && res.data[0]
  } catch (e) {
    // 集合刚创建或权限未就绪时可能查询失败，走新增流程
  }

  if (!user) {
    const doc = {
      _openid: OPENID,
      nickname: "",
      avatar: "",
      createdAt: now,
      updatedAt: now
    }
    const add = await users.add({ data: doc })
    user = { _id: add._id, ...doc }
  } else {
    try {
      await users.doc(user._id).update({ data: { updatedAt: now } })
    } catch (e) {
      // 忽略更新时间失败
    }
  }

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
