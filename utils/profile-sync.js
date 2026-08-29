const PROFILE_SCHEMA_VERSION = 1

const PROFILE_FIELDS = [
  "basicInfo",
  "profileDetails",
  "avatarUrl",
  "entryAnswers",
  "entryIndex",
  "entryDone",
  "relAnswers",
  "relIndex",
  "relDone",
  "qaAnswers",
  "qaSelections",
  "qaTexts",
  "qaStarted",
  "qaMode",
  "qaIndex",
  "qaKey",
  "qaTotal",
  "activeQa",
  "qaBasicDone",
  "qaMediumDone",
  "qaExtraAnswered",
  "quickVoiceText",
  "quickVoiceDone",
  "profileTitle",
  "profileDims",
  "profilePills",
  "profileInsight",
  "behaviorTags",
  "letterTopic",
  "letterMode",
  "letterDone",
  "letterSaved"
]

function clone(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function pickProfile(source) {
  const profile = {}
  const data = source && typeof source === "object" ? source : {}
  PROFILE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined) {
      profile[field] = clone(data[field])
    }
  })
  return profile
}

function buildCloudProfile(source) {
  const profile = pickProfile(source)
  // 本地持久路径不能跨设备使用；头像进入云端前必须先成为 cloud:// 或 https:// 地址。
  if (profile.avatarUrl && !/^(cloud|https):\/\//.test(profile.avatarUrl)) {
    delete profile.avatarUrl
  }
  return profile
}

function mergeObjects(primary, fallback) {
  if (!primary || typeof primary !== "object" || Array.isArray(primary)) return clone(primary)
  const secondary = fallback && typeof fallback === "object" && !Array.isArray(fallback) ? fallback : {}
  const result = clone(secondary) || {}
  Object.keys(primary).forEach((key) => {
    const value = primary[key]
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = mergeObjects(value, secondary[key])
    } else {
      result[key] = clone(value)
    }
  })
  return result
}

function mergeProfiles(primary, fallback) {
  const preferred = pickProfile(primary)
  const secondary = pickProfile(fallback)
  const merged = {}
  PROFILE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(preferred, field)) {
      const value = preferred[field]
      merged[field] = value && typeof value === "object" && !Array.isArray(value)
        ? mergeObjects(value, secondary[field])
        : clone(value)
    } else if (Object.prototype.hasOwnProperty.call(secondary, field)) {
      merged[field] = clone(secondary[field])
    }
  })
  return merged
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key])
      return result
    }, {})
  }
  return value
}

function fingerprint(source) {
  return JSON.stringify(stableValue(pickProfile(source)))
}

function hasAnswers(answerMap) {
  if (!answerMap || typeof answerMap !== "object") return false
  return Object.keys(answerMap).some((key) => {
    const answer = answerMap[key]
    if (Array.isArray(answer)) return answer.length > 0
    if (answer && typeof answer === "object") return Object.keys(answer).length > 0
    return Boolean(answer)
  })
}

function hasMeaningfulProfile(source) {
  const data = source && typeof source === "object" ? source : {}
  const basic = data.basicInfo && typeof data.basicInfo === "object" ? data.basicInfo : {}
  return Object.keys(basic).some((key) => Boolean(basic[key] && basic[key].length !== 0)) ||
    Boolean(data.entryDone || data.relDone || data.qaBasicDone || data.qaMediumDone) ||
    hasAnswers(data.entryAnswers) || hasAnswers(data.relAnswers) || hasAnswers(data.qaAnswers)
}

module.exports = {
  PROFILE_FIELDS,
  PROFILE_SCHEMA_VERSION,
  buildCloudProfile,
  fingerprint,
  hasMeaningfulProfile,
  mergeProfiles,
  pickProfile
}
