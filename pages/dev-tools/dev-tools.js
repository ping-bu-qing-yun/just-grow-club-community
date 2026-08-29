Page({
  data: {
    running: false,
    finished: false,
    checks: []
  },

  onLoad(options = {}) {
    if (options.autorun === "1") this.runChecks()
  },

  callFunction(name, data) {
    return new Promise((resolve) => {
      if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
        resolve({ ok: false, message: "当前环境没有云开发能力" })
        return
      }
      wx.cloud.callFunction({
        name,
        data,
        success: (response) => resolve(response && response.result ? response.result : { ok: false }),
        fail: () => resolve({ ok: false, message: "云函数调用失败" })
      })
    })
  },

  async runChecks() {
    if (this.data.running) return
    this.setData({ running: true, finished: false, checks: [] })

    const login = await this.callFunction("login", { silent: true })
    const profile = await this.callFunction("userProfile", { action: "get" })
    const registrations = await this.callFunction("activityData", { action: "listMine" })
    const checks = [
      {
        name: "微信身份",
        passed: Boolean(login && login.ok),
        detail: login && login.ok ? "云上下文可用" : "登录云函数未就绪"
      },
      {
        name: "本人资料读取",
        passed: Boolean(profile && profile.ok),
        detail: profile && profile.ok
          ? (profile.existing ? "本人资料已找到" : "本人尚无云端资料")
          : "资料云函数未就绪"
      },
      {
        name: "报名数据链路",
        passed: Boolean(registrations && registrations.ok),
        detail: registrations && registrations.ok
          ? `云端报名记录 ${registrations.count || 0} 条`
          : "报名云函数未就绪"
      },
      {
        name: "隐私返回",
        passed: Boolean(profile && profile.ok && profile.visibility === "private"),
        detail: profile && profile.visibility === "private" ? "默认私密" : "需检查云函数或权限"
      }
    ]
    this.setData({ running: false, finished: true, checks })
  }
})
