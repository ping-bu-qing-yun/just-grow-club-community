const qaSets = {
  basic: [
    {
      dim: "自我探知",
      q: "1～10分，当下生活幸福感你会给几分？为什么？",
      sample: "我会给7分。工作和生活基本稳定，但关系这块有点停住了。我不是完全不想认识人，只是有点怕消耗。"
    },
    {
      dim: "生活共识",
      q: "你想象中恋爱里的一天是什么样子？请分别说说工作日和周末。",
      sample: "工作日希望能各自忙完后一起吃饭散步，不需要一直聊天。周末可以一起做点有意思的事，也要有各自的空间。"
    },
    {
      dim: "情感理念",
      q: "在没遇到真正心动、认定的人之前，你会坚守不将就，还是愿意试着相处、慢慢了解？",
      sample: "我不想随便将就，但也愿意慢慢了解。前提是这个过程不要太像面试，也不要一上来就很强目的。"
    }
  ],
  extra: [
    {
      dim: "自我探知",
      q: "面对重要选择，你更容易想太多而犹豫，还是相信直觉直接做决定？",
      sample: "我会先想很多，但如果现场氛围舒服，我也愿意相信直觉。"
    },
    {
      dim: "自我探知",
      q: "未来1～3年，你最想实现的一件事是什么？",
      sample: "我希望生活更稳定一点，也有几个能真正说话的人。"
    },
    {
      dim: "生活共识",
      q: "亲密关系里，你如何看待边界感与个人空间？",
      sample: "我需要个人空间，但也希望对方能理解这不是疏远。"
    },
    {
      dim: "生活共识",
      q: "你更喜欢稳定安稳，还是新鲜感与挑战？",
      sample: "我更喜欢稳定里有一点新鲜，不想每天都很耗能。"
    },
    {
      dim: "情感理念",
      q: "感情里你最需要的安全感，来自哪里？",
      sample: "来自对方说到做到，也来自我不用一直猜。"
    },
    {
      dim: "情感理念",
      q: "长期关系里，舒服安心和心动浪漫哪个更重要？",
      sample: "我现在会更看重舒服安心，但也希望保留一点心动。"
    }
  ]
}

const advancedQuestions = [
  {
    dim: "关系实践",
    q: "当你感到不舒服时，你更希望对方怎么和你沟通？",
    sample: "我希望对方直接但温和地问我发生了什么，而不是让我猜。"
  },
  {
    dim: "关系实践",
    q: "你在关系里最想练习的一件事是什么？",
    sample: "我想练习把自己的需要说得更清楚，而不是等别人猜到。"
  },
  {
    dim: "关系想象",
    q: "什么样的相处会让你觉得‘我们是在一起生活’？",
    sample: "不是每天黏在一起，而是彼此都记得对方在意的小事。"
  },
  {
    dim: "关系想象",
    q: "你希望别人如何认识真实的你？",
    sample: "先看到我慢热和认真，再看到我其实很愿意分享。"
  },
  {
    dim: "自我边界",
    q: "关系里哪些事情是你希望被尊重的边界？",
    sample: "我需要自己的工作时间，也希望争执时不要冷处理太久。"
  },
  {
    dim: "自我边界",
    q: "你愿意把怎样的真实反馈带到下一次见面里？",
    sample: "如果我觉得舒服或不舒服，我愿意更及时地说出来。"
  }
]

const qaTiers = {
  basic: [
    { q: "你更喜欢哪种规模的活动？", multi: true, options: ["6人以下私密小局", "10-20人", "20-50人", "50人以上大型派对"] },
    { q: "你能接受单次活动的最长时长是？", options: ["1-2小时", "2-4小时", "半天", "全天"] },
    { q: "参加活动时，你能接受的路程时间是？", options: ["30分钟内", "1小时内", "只要值得，距离不限"] },
    { q: "未来7天，你的可约档期是？", multi: true, options: ["工作日晚间（周一至周四19:00后）", "周五晚上（开启周末模式）", "周六白天", "周六晚上", "周日白天", "周日晚上", "最近想先线上聊聊，暂不见面"] }
  ],
  medium: [
    { q: "初次见面，怎样开始让你最舒服？", options: ["有主持人/规则，先玩个游戏再聊", "从共同兴趣聊起，不愁没话题", "慢热型，先给点独处空间", "直接来深处话题，不想浪费时间客套"] },
    { q: "在喜欢的人面前，你通常是？", options: ["主动型，喜欢就会靠近", "慢热型，熟了之后话很多", "被动型，需要对方给我信号", "状态型，感觉对了就主动"] },
    { q: "哪句话最接近你的感情观？", options: ["先看感觉，感觉对了什么都可以谈", "三观合拍比心动更重要", "关系是两个人一起修出来的，不存在天生就合适", "爱自己要优先于爱对方"] },
    { q: "你现在在感情上更接近哪种状态？", options: ["单身很久，想认真认识人但不想将就", "有目标类型，但一直没遇到对的", "刚结束一段关系，想先找回自己", "佛系随缘，碰到同频的再说", "母胎单身，需要有人带带"] }
  ],
  advanced: [
    { q: "最容易被异性哪种特质吸引？", multi: true, options: ["外在 · 长相干净舒服", "外在 · 穿搭有品味", "外在 · 气质好有辨识度", "内在 · 温柔有耐心，接得住情绪", "内在 · 幽默有趣，能接梗抛梗", "内在 · 情绪稳定，不情绪化", "处事 · 有主见，不随波逐流", "处事 · 遇事有解决问题的能力", "处事 · 有自己热爱的事，很专注"] },
    { q: "如果和一个人聊得还不错，哪些是阻碍你下一步行动的阻力？", multi: true, options: ["害怕主动", "不确定对方态度", "生活节奏忙", "担心破坏现有关系", "慢热需要时间", "对线下见面有焦虑"] },
    { q: "亲密关系里，你如何看待边界感与个人空间？哪些事你不愿被干涉？", text: true, hint: "可以打字，也可以用语音说一段。比如：我需要彼此信任，不希望被干涉消费决定、兴趣爱好、社交方式。", placeholder: "写下你的想法…" }
  ]
}

const entryQuestions = require("./entry-questions.js")

const viewTitles = {
  wxTouch: "微信触达",
  lightQa: "认识彼此",
  deepQa: "QA 问答",
  basicInfo: "基础资料",
  profile: "我的初回画像",
  auth: "登录恰好",
  home: "恰好活动",
  activityDetail: "活动详情",
  explore: "发现活动",
  square: "需求广场",
  mine: "我的",
  accountSettings: "账号与隐私",
  partner: "主理人合作"
}

const tabViews = ["home", "square", "mine"]

const baseCards = [
  {
    id: "dinner",
    kind: "activity",
    type: "成熟活动",
    title: "周五轻聊天晚餐局",
    tags: ["想认识靠谱的人", "少人数", "怕尴尬"],
    meta: "6-8人 · KIC附近 · 周五19:30",
    desc: "流程清楚的小桌轻餐，适合第一次低压力见面。"
  },
  {
    id: "night",
    kind: "activity",
    color: "orange",
    type: "预活动",
    title: "深度对谈夜局",
    tags: ["deep talk", "价值观", "先看人"],
    meta: "6人 · 大学路 · 正在准备",
    desc: "围绕三个真实关系问题，先收集感兴趣人数。"
  },
  {
    id: "need",
    kind: "demand",
    type: "需求广场",
    title: "需求卡｜想认识靠谱的人",
    tags: ["不想尴尬交换微信", "72人共鸣"],
    meta: "38条评论 · 6人想参加",
    desc: "如果暂时没有合适活动，可以先共鸣这个需求。"
  }
]

const replacementCards = [
  {
    id: "manual",
    kind: "other",
    type: "关系工作坊",
    title: "周末关系说明书工作坊",
    tags: ["想理解关系模式", "慢热", "有结构"],
    meta: "10人 · 大学路 · 周六14:00",
    desc: "通过关系说明书练习表达自己的靠近方式。"
  },
  {
    id: "life",
    kind: "demand",
    type: "需求广场",
    title: "需求卡｜我想认识有生活感的人",
    tags: ["真实生活", "不只聊工作", "想参加"],
    meta: "48人共鸣 · 12人想参加",
    desc: "如果这个话题成局，你会收到预活动提醒。"
  }
]

const activityFeed = [
  {
    id: "dinner",
    type: "low",
    date: "8/14",
    weekday: "周五",
    time: "19:30",
    title: "周五轻聊天晚餐局",
    subtitle: "成熟活动 · 少人数 · 想认识靠谱的人",
    tags: ["低压力", "少人数"],
    coverClass: "cover-night",
    coverText: "晚餐局",
    people: "6-8人 · 高同频",
    detail: "流程清楚的小桌轻餐，适合第一次低压力见面。",
    location: "KIC / 大学路附近",
    crowd: "多为25-35岁，想认真认识、不想无效社交的人",
    matchLabel: "高同频",
    schedule: [
      { time: "19:30", title: "到场 · 小CC/主理人轻破冰，不做简历式自我介绍" },
      { time: "19:45", title: "共桌轻餐 · 围绕3个低压力话题自然聊天" },
      { time: "20:35", title: "自由换座 · 可继续聊，也可加入散步小组" },
      { time: "21:20", title: "反馈 · 写下想继续认识谁、还顾虑什么" }
    ]
  },
  {
    id: "ai",
    type: "deep",
    date: "8/14",
    weekday: "周五",
    time: "20:00",
    title: "深度对谈夜局",
    subtitle: "预活动 · 价值观 · 先看人",
    tags: ["价值观", "先看人"],
    coverClass: "cover-ai",
    coverText: "深谈",
    people: "6人 · 正在准备",
    detail: "围绕三个真实关系问题，先听彼此，再决定要不要靠近。",
    location: "大学路合作空间",
    crowd: "喜欢慢聊、愿意分享真实想法的人",
    matchLabel: "深聊向",
    schedule: [
      { time: "20:00", title: "到场 · 简单认识，确认今晚的三个问题" },
      { time: "20:15", title: "深度对谈 · 分组围绕价值观与关系体验自然聊天" },
      { time: "21:20", title: "自由交流 · 可继续聊，也可提前安静离开" },
      { time: "21:50", title: "收束 · 写下今晚印象最深的一句话" }
    ]
  },
  {
    id: "walk",
    type: "walk",
    date: "8/15",
    weekday: "周六",
    time: "19:00",
    title: "我们向月亮走去 · 周五散步局",
    subtitle: "散步 · 轻社交 · 附近 · 免费",
    tags: ["散步", "轻社交", "免费"],
    coverClass: "cover-walk",
    coverText: "月亮",
    people: "5人成行 · 免费",
    detail: "城市散步，5人成行，走到哪聊到哪。",
    location: "江湾体育场出发",
    crowd: "想慢慢认识、不喜欢室内局的人",
    matchLabel: "附近",
    schedule: [
      { time: "19:00", title: "集合 · 江湾体育场门口轻破冰，确认路线" },
      { time: "19:15", title: "边走边聊 · 两三人一组自然聊天，可随时换位" },
      { time: "20:10", title: "补给 · 找地方喝水休息，想继续的人可加一段" },
      { time: "20:30", title: "散场 · 各自离开，不强制合影或加微信" }
    ]
  },
  {
    id: "workshop",
    type: "workshop",
    date: "8/15",
    weekday: "周六",
    time: "14:00",
    title: "关系说明书工作坊",
    subtitle: "工作坊 · 关系模式 · 慢了解",
    tags: ["关系模式", "工作坊", "慢了解"],
    coverClass: "cover-workshop",
    coverText: "工作坊",
    people: "10人 · 报名中",
    detail: "用一份关系说明书，练习说出自己的靠近方式。",
    location: "大学路",
    crowd: "对关系有困惑、愿意认真练习表达的人",
    matchLabel: "练习向",
    schedule: [
      { time: "14:00", title: "开场 · 说明规则与安全边界，不做公开点名" },
      { time: "14:20", title: "个人书写 · 写下自己的关系说明书要点" },
      { time: "15:10", title: "小组共创 · 小范围分享，可选择只听不说" },
      { time: "16:30", title: "收束 · 带走一张属于自己的说明书" }
    ]
  },
  {
    id: "lunch",
    type: "low",
    date: "8/12",
    weekday: "周三",
    time: "12:30",
    title: "午间同频小桌",
    subtitle: "预活动 · 午间 · 一小时认识附近的人",
    tags: ["午间", "附近"],
    coverClass: "cover-lunch",
    coverText: "午间",
    people: "4人 · 正在准备",
    detail: "一小时，一顿饭的时间，认识附近的人。",
    location: "静安寺附近",
    crowd: "工作日想轻松认识附近人的上班族",
    matchLabel: "附近",
    schedule: [
      { time: "12:30", title: "入座 · 4人小桌，简单自我介绍一句即可" },
      { time: "12:40", title: "共餐聊天 · 围绕最近生活与周末计划自然聊" },
      { time: "13:20", title: "收束 · 想继续认识的人可自行约定" }
    ]
  }
]

const defaultCommunityNeeds = [
  { id: "reliable", title: "想认识靠谱的人", detail: "不想尴尬交换微信，但想认真认识人。希望有一个流程自然、人数不多、可以先观察再靠近的场景。", stats: "72人共鸣 · 38条评论 · 6人想参加", comments: ["我也希望有一场不急着交换联系方式的活动。", "如果是 6-8 人，我会更愿意参加。"], user: false },
  { id: "heart", title: "30岁后难心动", detail: "不是不想恋爱，是越来越难进入关系。想和同样认真生活的人聊聊这种变化。", stats: "45人共鸣 · 22条评论 · 4人想参加", comments: ["以前会着急，现在更想先认识自己。"], user: false },
  { id: "talk", title: "想找能聊价值观的人", detail: "想找能聊价值观的人，而不是只聊工作。希望活动有一点结构，但不要像答题或面试。", stats: "28人共鸣 · 8人想参加 · 2位主理人关注", comments: ["有结构但不端着，我会愿意参加。"], user: false },
  { id: "host", title: "主理人响应", detail: "如果你有适合这些需求的空间、主题或活动经验，可以从真实需求出发发起一场活动。", stats: "3个需求待响应", comments: ["我有一个适合小组交流的空间。"], user: false }
]

const recorderManager = wx.getRecorderManager()
let recordTimer = null
let innerAudioContext = null
let cancelRecording = false

Page({
  data: {
    view: "intro",
    tabs: tabViews,
    viewHistory: [],
    screenTitle: "",
    showAppHeader: false,
    canGoBack: false,
    loggedIn: false,
    accountName: "小Z",
    authMode: "wechat",
    phoneNumber: "",
    verificationCode: "",
    entryQuestions,
    entryIndex: 0,
    entryDone: false,
    entryAnswers: { q1: {}, q2: {}, q3: {}, q4: {}, q5: {}, q6: {} },
    basicInfo: {
      birth: "1997-08-12",
      gender: "女",
      education: "本科",
      occupation: "品牌策划"
    },
    profileDetails: {
      idealType: "情绪稳定、愿意沟通，也有自己的生活节奏",
      relationshipExperience: "经历过几段关系，现在更想慢一点认识彼此",
      lifeRhythm: "轻运动、咖啡、城市散步，周末不喜欢排太满",
      relationshipNeed: "想认识靠谱的人，但不想一开始就条件交换"
    },
    mineTab: "profile",
    qaMode: "basic",
    qaIndex: 0,
    qaKey: "basic-0",
    qaTotal: 4,
    qaSelections: {},
    qaTexts: {},
    qaHasTranscript: false,
    activeTranscript: "",
    qaAnswers: {},
    recording: false,
    recordSeconds: 0,
    voiceFilePath: "",
    recordHint: "按住说话",
    recordTarget: "qa",
    quickVoiceText: "",
    quickVoiceDone: false,
    avatarUrl: "",
    qaBasicDone: false,
    qaMediumDone: false,
    qaExtraAnswered: {},
    activeQa: qaTiers.basic[0],
    extraQuestions: qaSets.extra,
    advancedQuestions,
    profileTitle: "低压力线下重启型",
    profilePills: ["想认识靠谱的人", "拒绝条件交换", "适合少人数", "需要自然话题"],
    profileInsight: "你不是不想见人，而是需要一个可以慢慢观察、不会被催促、也不用马上交换微信的场景。",
    recommendCards: baseCards,
    showReasonModal: false,
    showTab: false,
    reasonOptions: ["想看看来的人", "怕无效社交", "时间不合适", "地点有点远", "人数有顾虑", "话题没击中"],
    showDemandDetail: false,
    activeDemand: null,
    demandFlipped: false,
    demandComment: "",
    demandVoiceText: "",
    myNeedDraft: "",
    showNeedComposer: false,
    registeredActivities: [],
    hostForm: { title: "", description: "" },
    hostSubmitted: false,
    qaStarted: false,
    communityNeeds: defaultCommunityNeeds,
    demandComments: defaultCommunityNeeds[0].comments,
    demandHistory: [
      { id: "history-1", title: "想认识靠谱的人", date: "2026年7月提出", status: "待探索", activity: "周五轻聊天晚餐局" },
      { id: "history-2", title: "想找能聊价值观的人", date: "2026年6月提出", status: "已解决", activity: "深度对谈夜局" }
    ],
    filter: "all",
    activities: [
      { type: "low", short: "轻聊", title: "周五轻聊天晚餐局", tags: ["低压力", "少人数"], meta: "6-8人 · KIC · 周五晚" },
      { type: "deep", short: "深谈", title: "深度对谈夜局", tags: ["deep talk", "价值观"], meta: "6人 · 大学路 · 预活动" },
      { type: "walk", short: "月亮", title: "我们向月亮走去", tags: ["散步", "轻社交"], meta: "5人成行 · 江湾体育场" },
      { type: "workshop", short: "工作", title: "关系说明书工作坊", tags: ["关系模式", "工作坊"], meta: "10人 · 周六下午" },
      { type: "pre", short: "午间", title: "午间同频小桌", tags: ["预活动", "附近"], meta: "4人 · 正在准备" }
    ],
    activityFeed,
    filteredActivityFeed: activityFeed,
    activeActivity: activityFeed[0],
    activeActivityRegistered: false,
    activityGroupJoined: false,
    filteredActivities: []
  },

  onLoad(options = {}) {
    const saved = wx.getStorageSync("qiahaoDraft") || {}
    const rawEntry = saved.entryAnswers && typeof saved.entryAnswers === "object" ? saved.entryAnswers : {}
    const entryAnswers = {
      q1: rawEntry.q1 && typeof rawEntry.q1 === "object" ? rawEntry.q1 : {},
      q2: rawEntry.q2 && typeof rawEntry.q2 === "object" ? rawEntry.q2 : {},
      q3: rawEntry.q3 && typeof rawEntry.q3 === "object" ? rawEntry.q3 : {},
      q4: rawEntry.q4 && typeof rawEntry.q4 === "object" ? rawEntry.q4 : {},
      q5: rawEntry.q5 && typeof rawEntry.q5 === "object" ? rawEntry.q5 : {},
      q6: rawEntry.q6 && typeof rawEntry.q6 === "object" ? rawEntry.q6 : {}
    }
    this.introTimer = setTimeout(() => this.setView(options.activity ? "activityDetail" : "welcome", { push: false, resetHistory: true }), 1400)
    recorderManager.onStart(() => {
      this.setData({ recording: true, recordHint: "正在听你说，松开发送" })
    })
    recorderManager.onStop((res) => {
      clearInterval(recordTimer)
      if (cancelRecording) {
        cancelRecording = false
        return
      }
      const duration = Math.max(1, Math.round((res.duration || 1000) / 1000))
      const transcript = this.data.recordTarget === "demand"
        ? "我希望有一个不急着交换联系方式、可以自然认识人的活动。"
        : this.data.recordTarget === "quick"
          ? "我最近希望认识靠谱的人，也希望见面的氛围轻松一点。"
          : this.data.activeQa.sample
      this.setData({
        recording: false,
        recordSeconds: duration,
        voiceFilePath: res.tempFilePath || "",
        qaHasTranscript: this.data.recordTarget === "qa" ? true : this.data.qaHasTranscript,
        activeTranscript: this.data.recordTarget === "qa" ? transcript : this.data.activeTranscript,
        quickVoiceText: this.data.recordTarget === "quick" ? transcript : this.data.quickVoiceText,
        demandVoiceText: this.data.recordTarget === "demand" ? transcript : this.data.demandVoiceText,
        recordHint: "已生成文字，请确认后发送"
      })
      wx.showToast({ title: "录音完成", icon: "success" })
    })
    recorderManager.onError(() => {
      clearInterval(recordTimer)
      this.setData({ recording: false, recordHint: "录音失败，请重试" })
      wx.showToast({ title: "请检查麦克风权限", icon: "none" })
    })
    this.setData({
      filteredActivities: this.data.activities,
      loggedIn: Boolean(saved.loggedIn),
      accountName: saved.accountName || "小Z",
      authMode: saved.authMode || "wechat",
      phoneNumber: saved.phoneNumber || "",
      verificationCode: saved.verificationCode || "",
      basicInfo: saved.basicInfo || this.data.basicInfo,
      profileDetails: saved.profileDetails || this.data.profileDetails,
      mineTab: saved.mineTab || "profile",
      avatarUrl: saved.avatarUrl || "",
      entryAnswers,
      entryIndex: saved.entryIndex || 0,
      entryDone: Boolean(saved.entryDone),
      quickVoiceText: saved.quickVoiceText || "",
      quickVoiceDone: Boolean(saved.quickVoiceDone),
      qaAnswers: saved.qaAnswers || {},
      qaMode: saved.qaMode || "basic",
      qaIndex: Number.isInteger(saved.qaIndex) ? saved.qaIndex : 0,
      qaKey: saved.qaKey || "basic-0",
      qaTotal: saved.qaTotal || 4,
      qaSelections: saved.qaSelections || {},
      qaTexts: saved.qaTexts || {},
      activeQa: saved.activeQa && saved.activeQa.options ? saved.activeQa : this.data.activeQa,
      activeTranscript: saved.activeTranscript || "",
      qaHasTranscript: Boolean(saved.activeTranscript),
      qaStarted: Boolean(saved.qaStarted),
      qaBasicDone: Boolean(saved.qaBasicDone),
      qaMediumDone: Boolean(saved.qaMediumDone),
      qaExtraAnswered: saved.qaExtraAnswered || {},
      hostForm: saved.hostForm || this.data.hostForm,
      hostSubmitted: Boolean(saved.hostSubmitted),
      demandHistory: saved.demandHistory || this.data.demandHistory,
      registeredActivities: saved.registeredActivities || [],
      myNeedDraft: saved.myNeedDraft || "",
      demandComment: saved.demandComment || "",
      demandVoiceText: saved.demandVoiceText || "",
      demandComments: saved.demandComments || this.data.demandComments
    })
    const savedNeeds = saved.communityNeeds || this.data.communityNeeds
    this.setData({
      communityNeeds: savedNeeds,
      activeActivity: saved.activeActivity || this.data.activeActivity,
      activeActivityRegistered: Boolean(saved.registeredActivities && saved.activeActivity && saved.registeredActivities.includes(saved.activeActivity.id)),
      activityGroupJoined: Boolean(saved.activityGroupJoined),
      filter: saved.filter || "all",
      filteredActivityFeed: this.filterActivities(saved.filter || "all")
    })
    if (options.activity) {
      this.openActivity({ currentTarget: { dataset: { id: options.activity } } })
    }
  },

  onHide() {
    this.persistDraft()
  },

  onUnload() {
    clearInterval(recordTimer)
    clearTimeout(this.introTimer)
    if (innerAudioContext) innerAudioContext.destroy()
  },

  isTab(view) {
    return this.data.tabs.includes(view)
  },

  filterActivities(filter) {
    return filter === "all" ? this.data.activityFeed : this.data.activityFeed.filter(item => item.type === filter)
  },

  setView(view, options = {}) {
    const current = this.data.view
    const push = options.push !== false
    const resetHistory = options.resetHistory === true
    const history = Array.isArray(options.history)
      ? options.history
      : resetHistory
      ? []
      : push && current && current !== view && current !== "intro"
        ? [...this.data.viewHistory, current]
        : [...this.data.viewHistory]
    const showTab = this.isTab(view)
    this.setData({
      view,
      viewHistory: history,
      showTab,
      screenTitle: viewTitles[view] || "",
      showAppHeader: Boolean(viewTitles[view]) && view !== "welcome" && view !== "intro"
    })
  },

  go(e) {
    const view = e.currentTarget.dataset.view
    const current = this.data.view
    if (view === "deepQa" && current === "lightQa") {
      this.resetQa()
    }
    if (view === "home") {
      this.refreshRecommendations()
      this.setView(view, { push: false, resetHistory: true })
      return
    }
    if (view === "profile") this.generateProfile()
    if (this.isTab(view)) {
      this.setView(view, { push: false, resetHistory: true })
      return
    }
    this.setView(view)
  },

  switchAuthMode(e) {
    const authMode = e.currentTarget.dataset.mode
    this.setData({ authMode })
    this.persistDraft()
  },

  updateAuthField(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({ [field]: e.detail.value })
    this.persistDraft()
  },

  loginUser() {
    if (this.data.authMode === "phone" && this.data.phoneNumber.trim().length < 6) {
      wx.showToast({ title: "请先填写手机号", icon: "none" })
      return
    }
    const finishLogin = () => {
      this.setData({ loggedIn: true, accountName: "小Z" })
      this.persistDraft()
      this.setView("lightQa")
    }
    if (this.data.authMode === "wechat" && typeof wx.login === "function") {
      wx.login({ success: finishLogin, fail: finishLogin })
      return
    }
    finishLogin()
  },

  back() {
    if (this.data.showDemandDetail) {
      this.closeDemandDetail()
      return
    }
    if (this.data.showReasonModal) {
      this.setData({ showReasonModal: false })
      return
    }
    const view = this.data.view
    const history = [...this.data.viewHistory]
    const previous = history.pop()
    if (!previous) {
      if (view !== "welcome" && view !== "intro") this.setView("welcome", { push: false, resetHistory: true })
      return
    }
    this.setView(previous, { push: false, history })
  },

  toggleEntryOption(e) {
    const qid = e.currentTarget.dataset.qid
    const oi = e.currentTarget.dataset.oi
    const q = entryQuestions[this.data.entryIndex]
    if (!q || q.id !== qid) return
    const map = { ...(this.data.entryAnswers[qid] || {}) }
    if (q.multi) {
      if (map[oi]) delete map[oi]
      else map[oi] = true
      this.setData({ [`entryAnswers.${qid}`]: map })
    } else {
      const next = {}
      if (!map[oi]) next[oi] = true
      this.setData({ [`entryAnswers.${qid}`]: next })
    }
    this.persistDraft()
  },

  entryNext() {
    if (this.data.entryIndex < entryQuestions.length - 1) {
      this.setData({ entryIndex: this.data.entryIndex + 1 })
    } else {
      this.setData({ entryDone: true })
      this.setView("deepQa")
    }
    this.persistDraft()
  },

  entryPrev() {
    if (this.data.entryIndex > 0) {
      this.setData({ entryIndex: this.data.entryIndex - 1 })
      this.persistDraft()
    }
  },

  updateBasicField(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({ [`basicInfo.${field}`]: e.detail.value })
    this.persistDraft()
  },

  setMineTab(e) {
    const mineTab = e.currentTarget.dataset.tab
    this.setData({ mineTab })
    this.persistDraft()
  },

  updateProfileDetail(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`profileDetails.${field}`]: e.detail.value })
    this.persistDraft()
  },

  saveProfileDetails() {
    this.persistDraft()
    wx.showToast({ title: "画像资料已更新", icon: "success" })
  },

  resetQa() {
    this.setData({
      qaMode: "basic",
      qaIndex: 0,
      qaKey: "basic-0",
      qaTotal: qaTiers.basic.length,
      qaSelections: {},
      qaTexts: {},
      qaStarted: true,
      activeQa: qaTiers.basic[0]
    })
  },

  switchQaMode(e) {
    const mode = e.currentTarget.dataset.mode
    const tier = qaTiers[mode]
    if (!tier) return
    this.setData({ qaMode: mode, qaIndex: 0, qaKey: `${mode}-0`, qaTotal: tier.length, activeQa: tier[0] })
  },

  toggleQaOption(e) {
    const option = e.currentTarget.dataset.option
    if (!option) return
    const key = this.data.qaKey
    const current = this.data.qaSelections[key] || []
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option]
    this.setData({ [`qaSelections.${key}`]: next })
    this.persistDraft()
  },

  updateQaText(e) {
    this.setData({ [`qaTexts.${this.data.qaKey}`]: e.detail.value })
    this.persistDraft()
  },

  nextQa() {
    const { qaMode, qaIndex, qaTotal } = this.data
    const tier = qaTiers[qaMode]
    const nextIndex = qaIndex + 1
    if (nextIndex < qaTotal) {
      this.setData({ qaIndex: nextIndex, qaKey: `${qaMode}-${nextIndex}`, activeQa: tier[nextIndex] })
      return
    }
    wx.showToast({ title: "回答已保存", icon: "success" })
    this.setView("basicInfo")
  },

  startRecordQa() {
    this.setData({ recordTarget: "qa" })
    this.requestRecord()
  },

  startRecordQuick() {
    this.setData({ recordTarget: "quick" })
    this.requestRecord()
  },

  startRecordDemand() {
    this.setData({ recordTarget: "demand" })
    this.requestRecord()
  },

  requestRecord() {
    if (this.data.recording) return
    wx.getSetting({
      success: (settings) => {
        if (settings.authSetting && settings.authSetting["scope.record"] === false) {
          wx.showModal({
            title: "需要麦克风权限",
            content: "语音回答只会用于生成你的文字回答，不会公开播放。请在设置中打开麦克风权限。",
            confirmText: "去设置",
            success: (modal) => {
              if (modal.confirm) wx.openSetting()
            }
          })
          return
        }
        wx.authorize({
          scope: "scope.record",
          success: () => this.beginRecord(),
          fail: () => wx.showToast({ title: "请允许使用麦克风", icon: "none" })
        })
      },
      fail: () => wx.showToast({ title: "暂时无法读取麦克风权限", icon: "none" })
    })
  },

  beginRecord() {
    cancelRecording = false
    this.setData({
      recording: true,
      recordSeconds: 0,
      voiceFilePath: "",
      qaHasTranscript: false,
      activeTranscript: "",
      recordHint: "正在听你说，松开发送"
    })
    clearInterval(recordTimer)
    recordTimer = setInterval(() => {
      const seconds = this.data.recordSeconds + 1
      if (seconds >= 60) this.stopRecordQa()
      else this.setData({ recordSeconds: seconds })
    }, 1000)
    recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: "mp3"
    })
  },

  stopRecordQa() {
    if (!this.data.recording) return
    recorderManager.stop()
  },

  cancelRecordQa() {
    if (!this.data.recording) return
    clearInterval(recordTimer)
    cancelRecording = true
    recorderManager.stop()
    this.setData({ recording: false, qaHasTranscript: false, activeTranscript: "", voiceFilePath: "", recordHint: "已取消，请按住说话" })
  },

  updateActiveTranscript(e) {
    this.setData({ activeTranscript: e.detail.value, qaHasTranscript: Boolean(e.detail.value.trim()) })
    this.persistDraft()
  },

  updateQuickVoice(e) {
    this.setData({ quickVoiceText: e.detail.value })
    this.persistDraft()
  },

  updateDemandVoice(e) {
    this.setData({ demandVoiceText: e.detail.value })
    this.persistDraft()
  },

  submitQuickVoice() {
    if (!this.data.quickVoiceText.trim()) {
      wx.showToast({ title: "可以先说一句你的期待", icon: "none" })
      return
    }
    this.setData({ quickVoiceDone: true })
    this.persistDraft()
    wx.showToast({ title: "已收进纸杯记忆库", icon: "success" })
  },

  playVoice() {
    if (!this.data.voiceFilePath) return
    if (!innerAudioContext) innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.src = this.data.voiceFilePath
    innerAudioContext.play()
    wx.showToast({ title: "正在播放录音", icon: "none" })
  },

  sendQa() {
    const { qaMode, qaIndex, qaExtraAnswered } = this.data
    const answerText = (this.data.activeTranscript || "").trim()
    if (!answerText) {
      wx.showToast({ title: "先输入或录一段回答", icon: "none" })
      return
    }
    const answerKey = `${qaMode}-${qaIndex}`
    const qaAnswers = { ...this.data.qaAnswers, [answerKey]: answerText }
    if (qaMode === "extra") {
      qaExtraAnswered[qaIndex] = true
      this.setData({
        qaMode: "basic",
        qaIndex: qaSets.basic.length,
        qaHasTranscript: false,
        activeTranscript: "",
        voiceFilePath: "",
        qaMediumDone: Object.keys(qaExtraAnswered).length >= qaSets.extra.length,
        qaAnswers,
        qaExtraAnswered
      })
      this.persistDraft()
      return
    }
    if (qaMode === "advanced") {
      this.setData({
        qaMode: "basic",
        qaIndex: qaSets.basic.length,
        qaHasTranscript: false,
        activeTranscript: "",
        voiceFilePath: "",
        qaAnswers
      })
      this.persistDraft()
      return
    }
    const nextIndex = qaIndex + 1
    if (nextIndex >= qaSets.basic.length) {
      this.setData({ qaBasicDone: true, qaIndex: nextIndex, qaHasTranscript: false, activeTranscript: "", voiceFilePath: "", qaAnswers })
      this.persistDraft()
      return
    }
    this.setData({ qaIndex: nextIndex, activeQa: qaSets.basic[nextIndex], qaHasTranscript: false, activeTranscript: "", voiceFilePath: "", recordHint: "按住说话", qaAnswers })
    this.persistDraft()
  },

  pickExtra(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      qaMode: "extra",
      qaIndex: index,
      activeQa: qaSets.extra[index],
      qaHasTranscript: false,
      activeTranscript: "",
      voiceFilePath: "",
      recordHint: "按住说话"
    })
  },

  pickAdvanced(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      qaMode: "advanced",
      qaIndex: index,
      activeQa: advancedQuestions[index],
      qaHasTranscript: false,
      activeTranscript: "",
      voiceFilePath: "",
      recordHint: "按住说话"
    })
  },

  openActivity(e) {
    const id = e.currentTarget.dataset.id
    const aliases = { night: "ai", manual: "workshop", life: "walk" }
    const activeActivity = this.data.activityFeed.find(item => item.id === id || item.id === aliases[id]) || this.data.activityFeed[0]
    this.setData({ activeActivity, activeActivityRegistered: this.data.registeredActivities.includes(activeActivity.id), activityGroupJoined: false })
    this.persistDraft()
    this.setView("activityDetail")
  },

  persistDraft() {
    wx.setStorageSync("qiahaoDraft", {
      basicInfo: this.data.basicInfo,
      loggedIn: this.data.loggedIn,
      accountName: this.data.accountName,
      authMode: this.data.authMode,
      phoneNumber: this.data.phoneNumber,
      verificationCode: this.data.verificationCode,
      profileDetails: this.data.profileDetails,
      mineTab: this.data.mineTab,
      avatarUrl: this.data.avatarUrl,
      entryAnswers: this.data.entryAnswers,
      entryIndex: this.data.entryIndex,
      entryDone: this.data.entryDone,
      quickVoiceText: this.data.quickVoiceText,
      quickVoiceDone: this.data.quickVoiceDone,
      qaStarted: this.data.qaStarted,
      qaAnswers: this.data.qaAnswers,
      qaMode: this.data.qaMode,
      qaIndex: this.data.qaIndex,
      qaKey: this.data.qaKey,
      qaTotal: this.data.qaTotal,
      qaSelections: this.data.qaSelections,
      qaTexts: this.data.qaTexts,
      activeQa: this.data.activeQa,
      activeTranscript: this.data.activeTranscript,
      qaBasicDone: this.data.qaBasicDone,
      qaMediumDone: this.data.qaMediumDone,
      qaExtraAnswered: this.data.qaExtraAnswered,
      hostForm: this.data.hostForm,
      hostSubmitted: this.data.hostSubmitted,
      demandHistory: this.data.demandHistory,
      registeredActivities: this.data.registeredActivities,
      myNeedDraft: this.data.myNeedDraft,
      demandComment: this.data.demandComment,
      demandVoiceText: this.data.demandVoiceText,
      demandComments: this.data.demandComments,
      communityNeeds: this.data.communityNeeds,
      activeActivity: this.data.activeActivity,
      activityGroupJoined: this.data.activityGroupJoined,
      filter: this.data.filter
    })
  },

  generateProfile() {
    const a = this.data.entryAnswers
    const texts = (qid) => Object.keys(a[qid] || {}).map(i => entryQuestions.find(q => q.id === qid).options[Number(i)].text)
    const q1 = texts("q1")
    const q2 = texts("q2")
    const q3 = texts("q3")
    const q6 = texts("q6").join("")
    const j1 = q1.join("")
    const j2 = q2.join("")
    const j3 = q3.join("")
    const pills = []
    if (q2.some(t => t.includes("散步"))) pills.push("轻量起步")
    if (q1.some(t => t.includes("认真认识")) || q1.some(t => t.includes("真实环境"))) pills.push("认真认识")
    if (q2.some(t => t.includes("工作坊")) || q1.some(t => t.includes("练习表达")) || q1.some(t => t.includes("关系困惑"))) pills.push("想练习")
    if (q3.some(t => t.includes("人多"))) pills.push("怕人多")
    if (j3.includes("条件对条件")) pills.push("拒绝条件交换")
    if (j3.includes("无效社交") || j1.includes("无效社交")) pills.push("拒绝无效社交")
    if (q3.some(t => t.includes("没人接"))) pills.push("怕没人接住")
    if (q3.some(t => t.includes("加微信"))) pills.push("怕强目的")
    const finalPills = pills.length ? pills.slice(0, 4) : ["认真认识", "轻量起步", "拒绝无效社交"]
    let title
    if (j2.includes("工作坊")) title = "关系练习型"
    else if (j2.includes("同频") && !j2.includes("午间")) title = "认真深聊型"
    else if (j2.includes("散步") || q6.includes("有点累")) title = "轻量见面型"
    else title = "自然认识型"
    let insight
    if (j3.includes("条件对条件") || j3.includes("无效社交")) {
      insight = "你不想把认识变成条件交换。恰好这里只做一件事：在真实环境里，把彼此看得更立体。"
    } else if (q6.includes("有点累")) {
      insight = "今天先不给自己压力，从最轻的一场开始，舒服地出现在人群里就好。"
    } else {
      insight = "你愿意认真认识人。这里会优先给你少人数、流程清楚、来的人画像明确的活动。"
    }
    this.setData({ profileTitle: title, profilePills: finalPills, profileInsight: insight })
  },

  openDemandDetail(e) {
    const id = e.currentTarget.dataset.id
    const activeDemand = this.data.communityNeeds.find(item => item.id === id) || this.data.communityNeeds[0]
    this.setData({ activeDemand, showDemandDetail: true, demandFlipped: true, demandVoiceText: "", demandComment: "" })
  },

  closeDemandDetail() {
    this.setData({ showDemandDetail: false, activeDemand: null, demandFlipped: false })
  },

  flipDemand() {
    this.setData({ demandFlipped: !this.data.demandFlipped })
  },

  updateDemandComment(e) {
    this.setData({ demandComment: e.detail.value })
    this.persistDraft()
  },

  updateNeedDraft(e) {
    this.setData({ myNeedDraft: e.detail.value })
    this.persistDraft()
  },

  openNeedComposer() {
    this.setData({ showNeedComposer: true })
  },

  cancelNeedComposer() {
    this.setData({ showNeedComposer: false })
  },

  publishNeed() {
    const content = this.data.myNeedDraft.trim()
    if (!content) {
      wx.showToast({ title: "先写下你最近的需求", icon: "none" })
      return
    }
    const id = `need-${Date.now()}`
    const newNeed = { id, title: content, detail: content, stats: "刚刚发布 · 等待更多人回应", comments: [], user: true }
    const demandHistory = [{ id: `history-${Date.now()}`, title: content, date: "刚刚提出", status: "待探索", activity: "等待对应活动" }, ...this.data.demandHistory]
    this.setData({ communityNeeds: [newNeed, ...this.data.communityNeeds], demandHistory, myNeedDraft: "", showNeedComposer: false })
    this.persistDraft()
    wx.showToast({ title: "需求卡已发布", icon: "success" })
  },

  addDemandComment() {
    const comment = this.data.demandComment.trim()
    if (!comment) {
      wx.showToast({ title: "先写下一句你的想法", icon: "none" })
      return
    }
    const comments = [comment, ...(this.data.activeDemand.comments || [])]
    const communityNeeds = this.data.communityNeeds.map(item => item.id === this.data.activeDemand.id ? { ...item, comments } : item)
    this.setData({ demandComments: comments, communityNeeds, activeDemand: { ...this.data.activeDemand, comments }, demandComment: "" })
    this.persistDraft()
    wx.showToast({ title: "已发布评论", icon: "success" })
  },

  submitDemandVoice() {
    const text = this.data.demandVoiceText.trim()
    if (!text) {
      wx.showToast({ title: "先说一句你的想法", icon: "none" })
      return
    }
    const comments = [text, ...(this.data.activeDemand.comments || [])]
    const communityNeeds = this.data.communityNeeds.map(item => item.id === this.data.activeDemand.id ? { ...item, comments } : item)
    this.setData({ demandComments: comments, communityNeeds, activeDemand: { ...this.data.activeDemand, comments }, demandVoiceText: "" })
    this.persistDraft()
    wx.showToast({ title: "语音回答已收录", icon: "success" })
  },

  markDemandResolved(e) {
    const index = Number(e.currentTarget.dataset.index)
    const demandHistory = this.data.demandHistory.map((item, i) => i === index ? { ...item, status: "已解决" } : item)
    this.setData({ demandHistory })
    this.persistDraft()
    wx.showToast({ title: "已记录这次变化", icon: "success" })
  },

  hideDemand(e) {
    const index = Number(e.currentTarget.dataset.index)
    const demandHistory = this.data.demandHistory.map((item, i) => i === index ? { ...item, hidden: true } : item)
    this.setData({ demandHistory })
    this.persistDraft()
    wx.showToast({ title: "已从页面隐藏", icon: "none" })
  },

  registerActivity() {
    const activityId = this.data.activeActivity.id
    if (this.data.registeredActivities.includes(activityId)) {
      wx.showToast({ title: "你已经报名过这场活动", icon: "none" })
      return
    }
    this.setData({ registeredActivities: [...this.data.registeredActivities, activityId], activeActivityRegistered: true })
    this.persistDraft()
    wx.showModal({ title: "报名意愿已记录", content: "小CC会在活动成行后通知你确认具体席位。", showCancel: false, confirmText: "知道了" })
  },

  openActivityGroup() {
    if (!this.data.activeActivityRegistered) {
      wx.showToast({ title: "报名后开放活动群聊", icon: "none" })
      return
    }
    this.setData({ activityGroupJoined: true })
    wx.showModal({ title: "活动群聊", content: "活动成行后，小CC会把你加入本场活动群。", showCancel: false, confirmText: "知道了" })
  },

  openAccountSettings() {
    this.setView("accountSettings")
  },

  logoutUser() {
    wx.showModal({
      title: "退出当前账号？",
      content: "你的测试草稿和画像会保留在本机，下次可以继续体验。",
      confirmText: "退出",
      confirmColor: "#b65a37",
      success: (res) => {
        if (!res.confirm) return
        this.setData({ loggedIn: false, viewHistory: [] })
        this.persistDraft()
        this.setView("welcome", { push: false, resetHistory: true })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: `${this.data.activeActivity.title}｜恰好俱乐部`,
      path: "/pages/index/index?activity=" + this.data.activeActivity.id
    }
  },

  updateHostField(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`hostForm.${field}`]: e.detail.value })
    this.persistDraft()
  },

  submitHostActivity() {
    if (!this.data.hostForm.title.trim() || !this.data.hostForm.description.trim()) {
      wx.showToast({ title: "请补充活动主题和想解决的需求", icon: "none" })
      return
    }
    this.setData({ hostSubmitted: true })
    this.persistDraft()
    wx.showModal({ title: "已提交给小CC", content: "活动会先进入审核，审核通过后将展示关联需求标签。", showCancel: false, confirmText: "好的" })
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (file && file.tempFilePath) {
          this.setData({ avatarUrl: file.tempFilePath })
          this.persistDraft()
        }
      }
    })
  },

  removeAvatar() {
    this.setData({ avatarUrl: "" })
    this.persistDraft()
  },

  skipQa() {
    this.setView("basicInfo")
  },

  refreshRecommendations() {
    this.setData({ recommendCards: baseCards })
  },

  dismissCard(e) {
    const id = e.currentTarget.dataset.id
    const current = this.data.recommendCards.filter(card => card.id !== id)
    const usedIds = new Set(current.map(card => card.id))
    const next = replacementCards.find(card => !usedIds.has(card.id))
    if (next) current.push(next)
    this.setData({ recommendCards: current.slice(0, 3) })
    wx.showToast({ title: "已换一张推荐", icon: "none" })
  },

  openReason() {
    this.setData({ showReasonModal: true })
  },

  closeReason(e) {
    const reason = e.currentTarget.dataset.reason || "已收藏"
    this.setData({ showReasonModal: false })
    wx.showToast({ title: reason, icon: "none" })
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    const filteredActivities = filter === "all"
      ? this.data.activities
      : this.data.activities.filter(item => item.type === filter)
    this.setData({ filter, filteredActivities, filteredActivityFeed: this.filterActivities(filter) })
    this.persistDraft()
  },

  toast(e) {
    wx.showToast({ title: e.currentTarget.dataset.text, icon: "none" })
  },

  noop() {
  }
})
