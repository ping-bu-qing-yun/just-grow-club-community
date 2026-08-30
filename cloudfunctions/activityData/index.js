// 活动报名云函数：身份只取 cloud.getWXContext()，容量与报名人数由云端统一判断。
const crypto = require("crypto")
const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const REGISTRATIONS = "registrations"
const MAX_LIST = 200
const STATIC_CAPACITIES = Object.freeze({
  dinner: 8,
  ai: 6,
  walk: 12,
  workshop: 10,
  lunch: 4
})

function canonicalUserId(openid) {
  return "wx_" + crypto.createHash("sha256").update(String(openid || "")).digest("hex").slice(0, 28)
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

function cleanCapacity(value) {
  const capacity = Number(value)
  if (!Number.isInteger(capacity) || capacity < 1) return 0
  return Math.min(capacity, 200)
}

async function ensureRegistrationsCollection() {
  try {
    await db.createCollection(REGISTRATIONS)
  } catch (error) {
    // 集合已存在时会抛错，忽略即可。
  }
}

async function activityRecords(activityId) {
  const result = await db.collection(REGISTRATIONS)
    .where({ activityId, status: "registered" })
    .limit(MAX_LIST)
    .get()
  return Array.isArray(result.data) ? result.data : []
}

function resolveCapacity(activityId, requestedCapacity, records) {
  if (STATIC_CAPACITIES[activityId]) return STATIC_CAPACITIES[activityId]
  const stored = (records || []).map((record) => cleanCapacity(record.capacity)).find(Boolean)
  return stored || cleanCapacity(requestedCapacity)
}

async function availability(activityId, requestedCapacity) {
  const records = await activityRecords(activityId)
  const capacity = resolveCapacity(activityId, requestedCapacity, records)
  const registeredCount = records.length
  return {
    capacity,
    registeredCount,
    remaining: capacity ? Math.max(0, capacity - registeredCount) : 0,
    isFull: Boolean(capacity && registeredCount >= capacity)
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
      dateRaw: record.dateRaw || "",
      date: record.date || "",
      weekday: record.weekday || "",
      time: record.time || "",
      location: record.location || "",
      capacity: cleanCapacity(record.capacity),
      createdAt: record.createdAt && record.createdAt instanceof Date ? record.createdAt.getTime() : 0
    }))
}

exports.main = async (event = {}) => {
  const allowedActions = ["register", "listMine", "cancel", "availability"]
  const action = allowedActions.includes(event.action) ? event.action : ""
  if (!action) return { ok: false, code: "INVALID_ACTION", msg: "不支持的报名操作" }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { ok: false, code: "UNAUTHENTICATED", msg: "请重新登录后再试" }

  try {
    await ensureRegistrationsCollection()
    const userId = canonicalUserId(OPENID)
    const activityId = cleanText(event.activityId, 80)
    if (action !== "listMine" && !activityId) {
      return { ok: false, code: "INVALID_ACTIVITY", msg: "缺少活动信息" }
    }

    if (action === "availability") {
      const current = await availability(activityId, event.capacity)
      return { ok: true, activityId, ...current }
    }

    if (action === "register") {
      const now = new Date()
      const docId = `${userId}_${activityId}`
      try {
        await db.collection(REGISTRATIONS).doc(docId).get()
        const current = await availability(activityId, event.capacity)
        return { ok: true, registered: true, activityId, ...current }
      } catch (error) {
        // 本人尚未报名，继续做容量判断。
      }

      const current = await availability(activityId, event.capacity)
      if (!current.capacity) {
        return { ok: false, code: "CAPACITY_REQUIRED", msg: "活动尚未设置报名人数" }
      }
      if (current.isFull) {
        return { ok: false, code: "ACTIVITY_FULL", msg: "活动已满员", activityId, ...current }
      }

      try {
        await db.collection(REGISTRATIONS).add({
          data: {
            _id: docId,
            userId,
            _openid: OPENID,
            activityId,
            title: cleanText(event.title, 120),
            dateRaw: cleanText(event.dateRaw, 10),
            date: cleanText(event.date, 16),
            weekday: cleanText(event.weekday, 8),
            time: cleanText(event.time, 10),
            location: cleanText(event.location, 120),
            capacity: current.capacity,
            status: "registered",
            createdAt: now,
            updatedAt: now
          }
        })
      } catch (error) {
        // 同一用户重复点击时确定性 _id 保证只有一条记录。
        try {
          await db.collection(REGISTRATIONS).doc(docId).get()
        } catch (getError) {
          throw error
        }
      }
      const updated = await availability(activityId, current.capacity)
      return { ok: true, registered: true, activityId, ...updated }
    }

    if (action === "cancel") {
      const docId = `${userId}_${activityId}`
      try {
        await db.collection(REGISTRATIONS).doc(docId).remove()
      } catch (error) {
        // 记录不存在时视为已取消。
      }
      const current = await availability(activityId, event.capacity)
      return { ok: true, registered: false, activityId, ...current }
    }

    const items = await listMine(OPENID)
    return { ok: true, items, count: items.length }
  } catch (error) {
    console.error("[activityData] request failed")
    return { ok: false, code: "ACTIVITY_FAILED", msg: "报名服务暂时不可用，请稍后重试" }
  }
}
