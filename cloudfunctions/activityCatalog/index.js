// 公开活动目录：发布者身份只取云上下文，公开列表不返回 openid 等私密字段。
const crypto = require("crypto")
const cloud = require("wx-server-sdk")
const { containsForbiddenIdentity, sanitizeActivity } = require("./activity-policy")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const ACTIVITIES = "activities"
const MAX_LIST = 100

function cleanId(value) {
  return typeof value === "string" ? value.trim().slice(0, 80) : ""
}

function timeValue(value) {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : 0
}

function publicActivity(record, openid) {
  return {
    id: record._id,
    type: record.type || "low",
    title: record.title || "活动",
    subtitle: record.subtitle || "",
    category: record.category || "",
    dateRaw: record.dateRaw || "",
    date: record.date || "",
    weekday: record.weekday || "",
    time: record.time || "",
    location: record.location || "",
    capacity: Number(record.capacity) || 0,
    people: record.people || "",
    fee: record.fee || "待定",
    groups: Array.isArray(record.groups) ? record.groups : [],
    tags: Array.isArray(record.tags) ? record.tags : [],
    poster: record.poster || "",
    detail: record.detail || "",
    crowd: record.crowd || "",
    matchLabel: record.matchLabel || "恰好场",
    schedule: Array.isArray(record.schedule) ? record.schedule : [],
    slogan: record.slogan || "",
    status: "招募中",
    publicationStatus: record.status || "published",
    isCustom: true,
    visibility: "public",
    mine: Boolean(openid && record._openid === openid),
    createdAt: timeValue(record.createdAt)
  }
}

async function ensureCollection() {
  try {
    await db.createCollection(ACTIVITIES)
  } catch (error) {
    // 集合已存在时会抛错。
  }
}

async function listPublic(openid) {
  const result = await db.collection(ACTIVITIES).where({ status: "published" }).limit(MAX_LIST).get()
  const records = (Array.isArray(result.data) ? result.data : []).filter((record) => record.visibility === "public")
  const items = records
    .map((record) => publicActivity(record, openid))
    .sort((a, b) => `${a.dateRaw} ${a.time}`.localeCompare(`${b.dateRaw} ${b.time}`))
  return { items, mine: items.filter((item) => item.mine) }
}

exports.main = async (event = {}) => {
  const allowedActions = ["publish", "listPublic", "unpublish"]
  const action = allowedActions.includes(event.action) ? event.action : ""
  if (!action) return { ok: false, code: "INVALID_ACTION", msg: "不支持的活动操作" }

  const { userInfo, ...clientEvent } = event
  if (containsForbiddenIdentity(clientEvent)) {
    return { ok: false, code: "IDENTITY_NOT_ALLOWED", msg: "身份参数不被允许" }
  }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { ok: false, code: "UNAUTHENTICATED", msg: "请重新登录后再试" }

  try {
    await ensureCollection()
    const activities = db.collection(ACTIVITIES)

    if (action === "listPublic") {
      const result = await listPublic(OPENID)
      return { ok: true, ...result, count: result.items.length }
    }

    if (action === "publish") {
      const activity = sanitizeActivity(event.activity)
      const now = new Date()
      const token = crypto.createHash("sha256")
        .update(`${OPENID}:${now.getTime()}:${crypto.randomBytes(8).toString("hex")}`)
        .digest("hex")
        .slice(0, 12)
      const activityId = `act_${now.getTime().toString(36)}_${token}`
      await activities.add({
        data: {
          _id: activityId,
          _openid: OPENID,
          ...activity,
          createdAt: now,
          updatedAt: now
        }
      })
      const created = await activities.doc(activityId).get()
      return { ok: true, item: publicActivity(created.data, OPENID) }
    }

    const activityId = cleanId(event.activityId)
    if (!activityId) return { ok: false, code: "INVALID_ACTIVITY", msg: "缺少活动信息" }
    const current = await activities.doc(activityId).get()
    if (!current.data || current.data._openid !== OPENID) {
      return { ok: false, code: "FORBIDDEN", msg: "只能下架自己发布的活动" }
    }
    await activities.doc(activityId).update({ data: { status: "unpublished", updatedAt: new Date() } })
    return { ok: true, activityId }
  } catch (error) {
    const known = ["TITLE_REQUIRED", "DATE_REQUIRED", "TIME_REQUIRED", "LOCATION_REQUIRED", "CAPACITY_INVALID", "CAPACITY_REQUIRED"]
    if (known.includes(error && error.code)) return { ok: false, code: error.code, msg: error.message }
    console.error("[activityCatalog] request failed", action, error && error.code ? error.code : "UNKNOWN")
    return { ok: false, code: "ACTIVITY_CATALOG_FAILED", msg: "活动库暂时不可用，请稍后重试" }
  }
}
