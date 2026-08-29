// 登录云函数：身份只取 cloud.getWXContext()，并把历史重复 users 记录收敛为一条。
const crypto = require("crypto")
const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const USERS = "users"

function canonicalUserId(openid) {
  return "wx_" + crypto.createHash("sha256").update(String(openid || "")).digest("hex").slice(0, 28)
}

function timeValue(value) {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : 0
}

function newestRecord(records) {
  return records.slice().sort((a, b) => timeValue(b.updatedAt) - timeValue(a.updatedAt))[0] || null
}

async function ensureUsersCollection() {
  try {
    await db.createCollection(USERS)
  } catch (error) {
    // 集合已存在时会抛错，忽略即可。
  }
}

async function removeLegacyRecords(records, canonicalId) {
  const legacy = records.filter((record) => record._id && record._id !== canonicalId)
  await Promise.all(legacy.map(async (record) => {
    try {
      await db.collection(USERS).doc(record._id).remove()
    } catch (error) {
      console.warn("[login] duplicate cleanup failed")
    }
  }))
}

async function findOrCreateUser(openid, createIfMissing) {
  const users = db.collection(USERS)
  const canonicalId = canonicalUserId(openid)
  const result = await users.where({ _openid: openid }).limit(100).get()
  const records = Array.isArray(result.data) ? result.data : []
  let user = records.find((record) => record._id === canonicalId) || null
  const latest = newestRecord(records)

  if (!user && !latest && !createIfMissing) return null

  if (!user) {
    const now = new Date()
    const seed = latest || {}
    try {
      await users.add({
        data: {
          _id: canonicalId,
          _openid: openid,
          nickname: seed.nickname || "",
          avatar: seed.avatar || "",
          profile: seed.profile && typeof seed.profile === "object" ? seed.profile : null,
          visibility: "private",
          profileSchemaVersion: Number(seed.profileSchemaVersion) || 1,
          createdAt: seed.createdAt || now,
          updatedAt: seed.updatedAt || now
        }
      })
    } catch (error) {
      // 同时到达的请求可能已创建同一确定性 _id；只在确认仍不存在时抛出。
      try {
        await users.doc(canonicalId).get()
      } catch (getError) {
        throw error
      }
    }
  } else if (createIfMissing) {
    await users.doc(canonicalId).update({ data: { updatedAt: new Date(), visibility: "private" } })
  }

  await removeLegacyRecords(records, canonicalId)
  const current = await users.doc(canonicalId).get()
  user = current && current.data ? current.data : null
  return user
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { ok: false, code: "UNAUTHENTICATED", msg: "请重新登录后再试" }

  try {
    await ensureUsersCollection()
    const user = await findOrCreateUser(OPENID, !event.silent)
    if (!user) return { ok: true, openid: OPENID, existing: false, user: null }

    return {
      ok: true,
      openid: OPENID,
      existing: true,
      user: {
        _id: user._id,
        openid: OPENID,
        nickname: user.nickname || "",
        avatar: user.avatar || ""
      }
    }
  } catch (error) {
    console.error("[login] request failed", error && error.code ? error.code : "UNKNOWN")
    return { ok: false, code: "LOGIN_FAILED", msg: "登录服务暂时不可用，请稍后重试" }
  }
}
