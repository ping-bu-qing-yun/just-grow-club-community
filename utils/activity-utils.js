const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_WEEKDAYS = {
  dinner: 5,
  ai: 5,
  walk: 6,
  workshop: 6,
  lunch: 3
}

function pad(value) {
  return String(value).padStart(2, "0")
}

function nextOccurrence(item, now = new Date()) {
  const targetWeekday = Number.isInteger(item.weekdayIndex) ? item.weekdayIndex : DEFAULT_WEEKDAYS[item.id]
  if (!Number.isInteger(targetWeekday)) return null
  const [hour, minute] = String(item.time || "00:00").split(":").map(Number)
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour || 0, minute || 0, 0, 0)
  let offset = (targetWeekday - candidate.getDay() + 7) % 7
  if (offset === 0 && candidate.getTime() <= now.getTime()) offset = 7
  candidate.setDate(candidate.getDate() + offset)
  return candidate
}

function rollActivityDates(feed, now = new Date()) {
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  return (Array.isArray(feed) ? feed : []).map((item) => {
    if (!item || item.isCustom) return item
    const date = nextOccurrence(item, now)
    if (!date) return item
    return {
      ...item,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dateRaw: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      weekday: week[date.getDay()]
    }
  })
}

function filterExploreActivities(feed, options = {}) {
  const distanceMap = options.distanceMap || {}
  const theme = options.theme || "all"
  const distance = options.distance || "all"
  const search = String(options.search || "").trim()
  return (Array.isArray(feed) ? feed : []).filter((item) => {
    const themeOk = theme === "all" || item.type === theme
    const kilometers = Number(distanceMap[item.id]) || 8
    const distanceOk = distance === "all" || distance === "sameCity" ||
      (distance === "near" && kilometers <= 3) ||
      (distance === "middle" && kilometers <= 5)
    const haystack = `${item.title || ""}${(item.tags || []).join("")}${item.location || ""}${item.subtitle || ""}`
    return themeOk && distanceOk && (!search || haystack.includes(search))
  })
}

function parseActivityCapacity(value) {
  if (Number.isInteger(value) && value > 0) return Math.min(value, 200)
  const numbers = String(value || "").match(/\d+/g)
  if (!numbers || !numbers.length) return 0
  return Math.min(Math.max(...numbers.map(Number).filter(Number.isFinite)), 200)
}

function activityDateValue(item, now = new Date()) {
  if (!item) return 0
  let year = now.getFullYear()
  let month = 0
  let day = 0
  const raw = String(item.dateRaw || "")
  const rawParts = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (rawParts) {
    year = Number(rawParts[1])
    month = Number(rawParts[2]) - 1
    day = Number(rawParts[3])
  } else {
    const parts = String(item.date || "").match(/^(\d{1,2})\/(\d{1,2})$/)
    if (!parts) return 0
    month = Number(parts[1]) - 1
    day = Number(parts[2])
  }
  const timeParts = String(item.time || "23:59").split(":").map(Number)
  const date = new Date(year, month, day, timeParts[0] || 0, timeParts[1] || 0, 0, 0)
  const value = date.getTime()
  return Number.isFinite(value) ? value : 0
}

function buildActivityHistory(registrationIds, records, feed, pendingIds, now = new Date()) {
  const activities = Array.isArray(feed) ? feed : []
  const recordList = Array.isArray(records) ? records : []
  const pending = new Set(Array.isArray(pendingIds) ? pendingIds : [])
  const ids = Array.from(new Set([
    ...(Array.isArray(registrationIds) ? registrationIds : []),
    ...recordList.map((item) => item.activityId).filter(Boolean)
  ]))
  const items = ids.map((activityId) => {
    const activity = activities.find((item) => item.id === activityId) || {}
    const record = recordList.find((item) => item.activityId === activityId) || {}
    const merged = {
      ...activity,
      ...record,
      id: activityId,
      activityId,
      title: record.title || activity.title || "活动记录",
      dateRaw: record.dateRaw || activity.dateRaw || "",
      date: record.date || activity.date || "",
      weekday: record.weekday || activity.weekday || "",
      time: record.time || activity.time || "",
      location: record.location || activity.location || "",
      capacity: parseActivityCapacity(record.capacity || activity.capacity || activity.people),
      poster: activity.poster || "",
      status: pending.has(activityId) ? "pending" : (record.status || "registered")
    }
    return { ...merged, dateValue: activityDateValue(merged, now) }
  })
  const pastStatuses = new Set(["attended", "completed", "ended"])
  const past = items
    .filter((item) => pastStatuses.has(item.status) || (item.dateValue && item.dateValue < now.getTime()))
    .sort((a, b) => b.dateValue - a.dateValue)
  const pastIds = new Set(past.map((item) => item.activityId))
  const current = items
    .filter((item) => !pastIds.has(item.activityId))
    .sort((a, b) => (a.dateValue || Number.MAX_SAFE_INTEGER) - (b.dateValue || Number.MAX_SAFE_INTEGER))
  return { current, past }
}

module.exports = {
  activityDateValue,
  buildActivityHistory,
  filterExploreActivities,
  nextOccurrence,
  parseActivityCapacity,
  rollActivityDates
}
