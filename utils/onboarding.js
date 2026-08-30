function hasRequiredBasicInfo(source) {
  const basic = source && source.basicInfo && typeof source.basicInfo === "object" ? source.basicInfo : {}
  return ["name", "gender", "birth", "area"].every((field) => Boolean(String(basic[field] || "").trim()))
}

function nextOnboardingView(source) {
  const data = source && typeof source === "object" ? source : {}
  if (!data.entryDone) return "lightQa"
  if (!data.relDone) return "deepQa"
  if (!hasRequiredBasicInfo(data)) return "basicInfo"
  return "home"
}

module.exports = {
  hasRequiredBasicInfo,
  nextOnboardingView
}
