// 报名数据云函数：报名记录写入 registrations 集合，身份只取 cloud.getWXContext()。
// 设计要点：
// 1. 幂等：_id = 调用者确定性 ID + 活动 ID，重复报名不会产生第二条记录；
// 2. 隔离：任何人只能写/读/取消自己的报名记录；
// 3. 安全：客户端传入的字符串字段做长度与类型清洗，不接受对象/数组。
const crypto = require("crypto")
const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const REGISTRATIONS = "registrations"
const MAX_LIST = 200

function canonicalUserId(openid) {
  return "wx_" + crypto.createHash("sha256").update(String(openid || "")).digest("hex").slice(0, 28)
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

async function ensureRegistrationsCollection() {
  try {
    await db.createCollection(REGISTRATIONS)
  } catch (error) {
    // 集合已存在时会抛错，忽略即可。
  }
}

async function listMine(openid) {
  const result = await db.collection(REGISTRATIONS).where({ _openid: openid }).limit(MAX_LIST).get()
  const records = Array.isArray(result.data) ? result.data : []
  return records
    .filter((record) => record.activityId)
    .map((record) => ({
      activityId: record.activityId,
      title: record.title || "",
      status: record.status || "registered",
      createdAt: record.createdAt && record.createdAt instanceof Date ? record.createdAt.getTime() : 0
    }))
}

exports.main = async (event = {}) => {
  const action = event.action === "register" || event.action === "listMine" || event.action === "cancel" ? event.action : ""
  if (!action) return { ok: false, code: "INVALID_ACTION", msg: "不支持的报名操作" }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { ok: false, code: "UNAUTHENTICATED", msg: "请重新登录后再试" }

  try {
    await ensureRegistrationsCollection()
    const userId = canonicalUserId(OPENID)
    const activityId = cleanText(event.activityId, 80)
    if ((action === "register" || action === "cancel") && !activityId) {
      return { ok: false, code: "INVALID_ACTIVITY", msg: "缺少活动信息" }
    }

    if (action === "register") {
      const now = new Date()
      const docId = `${userId}_${activityId}`
      try {
        await db.collection(REGISTRATIONS).add({
          data: {
            _id: docId,
            userId,
            _openid: OPENID,
            activityId,
            title: cleanText(event.title, 120),
            status: "registered",
            createdAt: now,
            updatedAt: now
          }
        })
      } catch (error) {
        // 同时到达的请求可能已写入同一确定性 _id；只有确实不存在时才抛错。
        try {
          await db.collection(REGISTRATIONS).doc(docId).get()
        } catch (getError) {
          throw error
        }
      }
      return { ok: true, registered: true, activityId }
    }

    if (action === "cancel") {
      const docId = `${userId}_${activityId}`
      try {
        await db.collection(REGISTRATIONS).doc(docId).remove()
      } catch (error) {
        // 记录不存在时视为已取消。
      }
      return { ok: true, registered: false, activityId }
    }

    const items = await listMine(OPENID)
    return { ok: true, items, count: items.length }
  } catch (error) {
    console.error("[activityData] request failed")
    return { ok: false, code: "ACTIVITY_FAILED", msg: "报名服务暂时不可用，请稍后重试" }
  }
}
