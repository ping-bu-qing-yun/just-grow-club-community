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

module.exports = {
  filterExploreActivities,
  nextOccurrence,
  rollActivityDates
}
