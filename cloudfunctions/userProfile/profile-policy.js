const crypto = require("crypto")

const FORBIDDEN_IDENTITY_KEYS = new Set(["openid", "_openid", "userid", "user_id", "targetopenid", "target_openid"])
const PROFILE_FIELDS = new Set([
  "basicInfo", "profileDetails", "avatarUrl",
  "entryAnswers", "entryIndex", "entryDone",
  "relAnswers", "relIndex", "relDone",
  "qaAnswers", "qaSelections", "qaTexts", "qaStarted", "qaMode", "qaIndex", "qaKey", "qaTotal", "activeQa",
  "qaBasicDone", "qaMediumDone", "qaExtraAnswered",
  "quickVoiceText", "quickVoiceDone",
  "profileTitle", "profileDims", "profilePills", "profileInsight", "behaviorTags",
  "letterTopic", "letterMode", "letterDone", "letterSaved"
])

function canonicalUserId(openid) {
  return "wx_" + crypto.createHash("sha256").update(String(openid || "")).digest("hex").slice(0, 28)
}

function containsForbiddenIdentity(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 8) return false
  return Object.keys(value).some((key) => {
    if (FORBIDDEN_IDENTITY_KEYS.has(key.toLowerCase())) return true
    return containsForbiddenIdentity(value[key], depth + 1)
  })
}

function sanitizeValue(value, depth = 0) {
  if (depth > 8 || value === undefined || typeof value === "function") return undefined
  if (value === null || typeof value === "boolean") return value
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") return value.trim().slice(0, 2000)
  if (Array.isArray(value)) {
    return value.slice(0, 80).map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== undefined)
  }
  if (typeof value === "object") {
    return Object.keys(value).slice(0, 100).reduce((result, key) => {
      if (["__proto__", "prototype", "constructor"].includes(key)) return result
      const sanitized = sanitizeValue(value[key], depth + 1)
      if (sanitized !== undefined) result[key.slice(0, 80)] = sanitized
      return result
    }, {})
  }
  return undefined
}

function sanitizeProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {}
  const raw = JSON.stringify(input)
  if (Buffer.byteLength(raw, "utf8") > 120 * 1024) {
    const error = new Error("profile too large")
    error.code = "PROFILE_TOO_LARGE"
    throw error
  }
  return Object.keys(input).reduce((result, field) => {
    if (!PROFILE_FIELDS.has(field)) return result
    const sanitized = sanitizeValue(input[field])
    if (field === "avatarUrl" && sanitized && !/^(cloud|https):\/\//.test(sanitized)) return result
    if (sanitized !== undefined) result[field] = sanitized
    return result
  }, {})
}

module.exports = {
  canonicalUserId,
  containsForbiddenIdentity,
  sanitizeProfile
}
