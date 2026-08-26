const config = require("./config.js")

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
  }
})
