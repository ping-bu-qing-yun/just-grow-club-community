const FORBIDDEN_IDENTITY_KEYS = new Set(["openid", "_openid", "userid", "user_id", "targetopenid", "target_openid"])
const ACTIVITY_TYPES = new Set(["low", "deep", "walk", "workshop", "lunch"])

function containsForbiddenIdentity(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 8) return false
  return Object.keys(value).some((key) => {
    if (FORBIDDEN_IDENTITY_KEYS.has(key.toLowerCase())) return true
    return containsForbiddenIdentity(value[key], depth + 1)
  })
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

function cleanCapacity(value) {
  const capacity = Number(value)
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) return 0
  return capacity
}

function validDate(raw) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false
  const [year, month, day] = raw.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function validPoster(value) {
  return /^(\/pages\/|cloud:\/\/|https:\/\/)/.test(value)
}

function activityError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function sanitizeActivity(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {}
  const title = cleanText(source.title, 40)
  const dateRaw = cleanText(source.dateRaw, 10)
  const time = cleanText(source.time, 5)
  const location = cleanText(source.location, 80)
  if (!title) throw activityError("TITLE_REQUIRED", "请填写活动标题")
  if (!validDate(dateRaw)) throw activityError("DATE_REQUIRED", "请选择有效的活动日期")
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw activityError("TIME_REQUIRED", "请选择有效的开始时间")
  if (!location) throw activityError("LOCATION_REQUIRED", "请填写活动地点")

  const groups = (Array.isArray(source.groups) ? source.groups : []).slice(0, 4).map((group, index) => ({
    key: cleanText(group && group.key, 40) || `g${index + 1}`,
    people: cleanCapacity(group && group.people),
    price: cleanText(group && group.price, 30)
  })).filter((group) => group.people || group.price)
  const groupCapacity = groups.reduce((sum, group) => sum + group.people, 0)
  if (groupCapacity > 200) throw activityError("CAPACITY_INVALID", "报名人数上限不能超过200人")
  const capacity = groupCapacity || cleanCapacity(source.capacity)
  if (!capacity) throw activityError("CAPACITY_REQUIRED", "请设置1到200人的报名上限")

  const poster = cleanText(source.poster, 500)
  const tags = (Array.isArray(source.tags) ? source.tags : [])
    .map((tag) => cleanText(tag, 20))
    .filter(Boolean)
    .slice(0, 4)
  const schedule = (Array.isArray(source.schedule) ? source.schedule : [])
    .slice(0, 6)
    .map((step) => ({
      time: cleanText(step && step.time, 10),
      title: cleanText(step && step.title, 120)
    }))
    .filter((step) => step.time || step.title)

  return {
    type: ACTIVITY_TYPES.has(source.type) ? source.type : "low",
    title,
    subtitle: cleanText(source.subtitle, 500),
    category: cleanText(source.category, 20),
    dateRaw,
    date: cleanText(source.date, 16),
    weekday: cleanText(source.weekday, 8),
    time,
    location,
    capacity,
    people: `${capacity}人`,
    fee: cleanText(source.fee, 30) || "待定",
    groups,
    tags,
    poster: validPoster(poster) ? poster : "/pages/index/images/posters/poster-dinner.jpg",
    detail: cleanText(source.detail || source.subtitle, 500),
    crowd: cleanText(source.crowd, 300) || "想认真认识、不想无效社交的人",
    matchLabel: cleanText(source.matchLabel || source.category, 30) || "恰好场",
    schedule,
    slogan: cleanText(source.slogan, 300),
    status: "published",
    isCustom: true,
    visibility: "public"
  }
}

module.exports = {
  cleanCapacity,
  containsForbiddenIdentity,
  sanitizeActivity
}
