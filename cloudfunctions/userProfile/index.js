const cloud = require("wx-server-sdk")
const { canonicalUserId, containsForbiddenIdentity, sanitizeProfile } = require("./profile-policy")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const USERS = "users"

function timeValue(value) {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : 0
}

function newestRecord(records) {
  return records.slice().sort((a, b) => timeValue(b.updatedAt) - timeValue(a.updatedAt))[0] || null
}

function publicProfile(record) {
  if (!record) return null
  return record.profile && typeof record.profile === "object" ? record.profile : null
}

async function ensureUsersCollection() {
  try {
    await db.createCollection(USERS)
  } catch (error) {
    // 已存在时会抛错；无需把数据库原始错误或用户身份写进日志。
  }
}

async function removeLegacyRecords(records, canonicalId) {
  const legacy = records.filter((record) => record._id && record._id !== canonicalId)
  await Promise.all(legacy.map(async (record) => {
    try {
      await db.collection(USERS).doc(record._id).remove()
    } catch (error) {
      console.warn("[userProfile] duplicate cleanup failed")
    }
  }))
}

async function ensureCanonicalUser(openid, createIfMissing) {
  const users = db.collection(USERS)
  const canonicalId = canonicalUserId(openid)
  const result = await users.where({ _openid: openid }).limit(100).get()
  const records = Array.isArray(result.data) ? result.data : []
  const canonical = records.find((record) => record._id === canonicalId)
  const latest = newestRecord(records)

  if (!canonical && !latest && !createIfMissing) return null

  if (!canonical) {
    const now = new Date()
    const seed = latest || {}
    try {
      await users.add({
        data: {
          _id: canonicalId,
          _openid: openid,
          nickname: seed.nickname || "",
          avatar: seed.avatar || "",
          profile: publicProfile(seed),
          visibility: "private",
          profileSchemaVersion: Number(seed.profileSchemaVersion) || 1,
          createdAt: seed.createdAt || now,
          updatedAt: seed.updatedAt || now
        }
      })
    } catch (error) {
      try {
        await users.doc(canonicalId).get()
      } catch (getError) {
        throw error
      }
    }
  }

  await removeLegacyRecords(records, canonicalId)
  const current = await users.doc(canonicalId).get()
  return current && current.data ? current.data : null
}

exports.main = async (event = {}) => {
  const action = event.action === "save" ? "save" : event.action === "get" ? "get" : ""
  if (!action) return { ok: false, code: "INVALID_ACTION", msg: "不支持的资料操作" }

  // 身份只能来自微信云环境，任何客户端身份参数都直接拒绝。
  // 注意：真机调用时平台会向 event 自动注入 userInfo（含 openId）等系统字段，
  // 这不是客户端可控数据，必须先剥离，否则会把系统注入误判为越权。
  const { userInfo, ...clientEvent } = event
  if (containsForbiddenIdentity(clientEvent)) {
    return { ok: false, code: "IDENTITY_NOT_ALLOWED", msg: "身份参数不被允许" }
  }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { ok: false, code: "UNAUTHENTICATED", msg: "请重新登录后再试" }

  try {
    await ensureUsersCollection()
    const users = db.collection(USERS)
    const canonicalId = canonicalUserId(OPENID)

    if (action === "get") {
      const user = await ensureCanonicalUser(OPENID, false)
      return {
        ok: true,
        existing: Boolean(user),
        profile: publicProfile(user),
        updatedAt: user ? timeValue(user.updatedAt) : 0,
        visibility: "private"
      }
    }

    const incomingProfile = sanitizeProfile(event.profile)
    const currentUser = await ensureCanonicalUser(OPENID, true)
    // 客户端会刻意省略不能跨设备的本地头像路径；省略字段保留云端旧值。
    const profile = { ...(publicProfile(currentUser) || {}), ...incomingProfile }
    const now = new Date()
    const nickname = profile.basicInfo && profile.basicInfo.name ? profile.basicInfo.name : ""
    const avatar = profile.avatarUrl || ""
    await users.doc(canonicalId).update({
      data: {
        profile,
        nickname,
        avatar,
        visibility: "private",
        profileSchemaVersion: 1,
        updatedAt: now
      }
    })
    // 再收敛一次，处理登录与保存同时发生时遗留的旧随机文档。
    await ensureCanonicalUser(OPENID, true)
    return { ok: true, updatedAt: now.getTime(), visibility: "private" }
  } catch (error) {
    console.error("[userProfile] request failed", action, error && error.code ? error.code : "UNKNOWN")
    return {
      ok: false,
      code: error && error.code ? error.code : "PROFILE_REQUEST_FAILED",
      msg: error && error.code === "PROFILE_TOO_LARGE" ? "资料内容过长，请精简后再试" : "云端暂时不可用，内容已保留在本机"
    }
  }
}
