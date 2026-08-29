const config = require("./config.js")
const { getDevLaunchConfig, isLaunchConfigActive } = require("./utils/devLaunchConfig.js")

App({
  globalData: {
    openid: "",
    user: null
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: config.cloudEnv || undefined,
        traceUser: true
      })
    }
    const devLaunch = getDevLaunchConfig()
    if (isLaunchConfigActive(devLaunch) && typeof wx.reLaunch === "function") {
      setTimeout(() => wx.reLaunch({ url: devLaunch.path }), devLaunch.waitMs)
    }
  }
})
