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
const relationshipQuestions = require("./relationship-questions.js")

const viewTitles = {
  wxTouch: "微信触达",
  lightQa: "认识彼此",
  deepQa: "情感与交友",
  basicInfo: "基础资料",
  profile: "我的初回画像",
  auth: "登录恰好",
  home: "恰好是你",
  activityDetail: "活动详情",
  explore: "发现活动",
  square: "需求广场",
  mine: "我的",
  accountSettings: "账号与隐私",
  partner: "主理人合作"
}

const tabViews = ["home", "explore", "square", "mine"]

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

const activityPosters = {
  dinner: "/pages/index/images/posters/poster-dinner.jpg",
  ai: "/pages/index/images/posters/poster-deep.jpg",
  walk: "/pages/index/images/posters/poster-walk.jpg",
  workshop: "/pages/index/images/posters/poster-workshop.jpg",
  lunch: "/pages/index/images/posters/poster-lunch.jpg"
}

const activityFee = { dinner: "¥99", ai: "¥89", walk: "免费", workshop: "¥129", lunch: "¥39" }

// 「听你们的」续场去处池：散场后推荐给用户，KIC 步行 10 分钟内。
// energy: low=有点累 / mid=一般 / high=有能量；style: walk=慢热散步 / deep=深聊 / task=共同任务 / chat=边吃边聊
// time: night=19:00 后散场 / day=白天散场。perk 为商户权益占位文案，正式上线前需小CC与商户确认。
const afterPartySpots = [
  { id: "yakitori", cat: "深夜食堂", name: "大学路炭火烧鸟", walk: "步行 8 分钟", open: "营业至 24:00", vibe: ["烟火气", "适合继续聊"], energy: ["low", "mid"], style: ["chat", "walk"], time: ["night"], line: "坐下就有话聊，慢慢吃就是相处。", perk: "恰好用户：散场饮品 9 折" },
  { id: "catcoffee", cat: "猫咖", name: "大学路猫咖·夜读角", walk: "步行 6 分钟", open: "营业至 22:30", vibe: ["安静", "低压力"], energy: ["low"], style: ["walk", "deep"], time: ["night"], line: "不想说话也没关系，猫会替你们暖场。" },
  { id: "cinema", cat: "夜间电影", name: "五角场影院·末场", walk: "步行 12 分钟", open: "末场 22:40", vibe: ["不用硬聊", "散场有话题"], energy: ["low", "mid"], style: ["deep", "chat"], time: ["night"], line: "看完电影，散场路上正好聊刚才那一段。", perk: "恰好用户：双人票 8 折" },
  { id: "ktv", cat: "KTV", name: "五角场 KTV·小包厢", walk: "步行 10 分钟", open: "营业至 02:00", vibe: ["热闹", "一起释放"], energy: ["high"], style: ["task", "chat"], time: ["night"], line: "一起唱两首，比干聊更容易熟起来。" },
  { id: "escape", cat: "密室逃脱", name: "密室逃脱·双人线", walk: "步行 9 分钟", open: "预约至 23:00", vibe: ["共同任务", "有点刺激"], energy: ["mid", "high"], style: ["task"], time: ["night"], line: "一起解一道题，比自我介绍更快认识彼此。" },
  { id: "craftbar", cat: "清吧", name: "精酿清吧·角落位", walk: "步行 7 分钟", open: "营业至 01:00", vibe: ["慢慢聊", "灯光刚好"], energy: ["mid"], style: ["deep", "chat"], time: ["night"], line: "一人一杯，话题自然往深处走。" },
  { id: "nightrun", cat: "夜跑散步", name: "江湾体育场夜跑道", walk: "步行 5 分钟", open: "开放至 22:00", vibe: ["轻运动", "并肩走"], energy: ["mid", "high"], style: ["walk", "task"], time: ["night"], line: "并肩走几圈，比面对面坐着更松弛。" },
  { id: "boardgame", cat: "桌游", name: "桌游吧·2 人小桌", walk: "步行 8 分钟", open: "营业至 24:00", vibe: ["有游戏不冷场"], energy: ["mid", "high"], style: ["task", "chat"], time: ["night"], line: "一局小游戏，输赢都能笑一场。" },
  { id: "bookstore", cat: "深夜书店", name: "24h 书店·深夜共读", walk: "步行 10 分钟", open: "24 小时", vibe: ["安静", "各自有位置"], energy: ["low"], style: ["deep", "walk"], time: ["night"], line: "各自挑一本书，坐同一张桌，想聊再聊。" },
  { id: "nightmarket", cat: "小吃街", name: "大学路小吃街", walk: "步行 4 分钟", open: "营业至 23:00", vibe: ["边走边吃", "轻松"], energy: ["low", "mid"], style: ["walk", "chat"], time: ["night"], line: "从街头吃到街尾，话题不会断。" },
  { id: "coffee", cat: "咖啡馆", name: "大学路咖啡馆·续聊", walk: "步行 6 分钟", open: "下午营业", vibe: ["安静", "想接着聊"], energy: ["low", "mid"], style: ["deep", "chat"], time: ["day"], line: "意犹未尽的话，换一家咖啡店继续坐。", perk: "恰好用户：续聊咖啡 8 折" },
  { id: "handcraft", cat: "手作", name: "手作工作室·双人体验", walk: "步行 11 分钟", open: "下午场 14:00-17:00", vibe: ["一起做点什么"], energy: ["mid", "high"], style: ["task"], time: ["day"], line: "一起做一件小东西，带回家就是纪念。" },
  { id: "picnic", cat: "草坪野餐", name: "江湾草坪·午间野餐", walk: "步行 5 分钟", open: "白天", vibe: ["阳光", "轻松"], energy: ["low", "mid"], style: ["walk"], time: ["day"], line: "买杯咖啡坐草坪上，晒晒太阳聊聊天。" },
  { id: "gallery", cat: "看展", name: "大学路美术馆·双人看展", walk: "步行 9 分钟", open: "营业至 18:00", vibe: ["有共同话题", "不着急"], energy: ["low", "mid"], style: ["deep", "walk"], time: ["day"], line: "看展不用一直说话，想到什么说什么。" }
]

const needCommentsPool = [
  "我也在找这种不需要硬破冰的认识方式。",
  "如果人数少一点、地点近一点，我会很愿意参加。",
  "这个想法很具体，期待后续的活动回应。",
  "先从轻松聊天开始，感觉会更自然。",
  "谢谢分享，刚好说中了我最近的感受。",
  "已经收藏，想继续关注大家的建议。"
]

const homeQuestions = [
  { q: "你上一次觉得“要是有人一起就好了”，是在哪里？", opts: ["下班路上", "一个人吃饭", "好看的晚霞", "想去的地方没人陪"] },
  { q: "周末下午，你更愿意怎么过？", opts: ["出门走走", "在家发呆", "约人吃饭", "尝试新东西"] },
  { q: "最近有件小事，你想说给谁听？", opts: ["工作琐事", "一个新爱好", "最近的困惑", "开心的事"] },
  { q: "今晚如果有空，你更想？", opts: ["安静散步", "小桌聊天", "看场电影", "运动一下"] },
  { q: "你希望新朋友先了解你哪一面？", opts: ["我的爱好", "生活节奏", "关系想法", "最近状态"] },
  { q: "什么小事会让你觉得“这人不错”？", opts: ["认真倾听", "记得细节", "共同爱好", "让人放松"] },
  { q: "如果恰好有场活动，你希望是？", opts: ["少人小局", "有话题晚餐", "一起做点事", "随便走走"] }
]
const todayHomeQuestion = homeQuestions[Math.floor(Date.now() / 86400000) % homeQuestions.length]

const coverPool = [
  { id: "walk", name: "月亮散步", src: "/pages/index/images/posters/poster-walk.jpg", keys: ["散步", "月亮", "晚霞", "夜跑", "遛狗", "走走", "逛"] },
  { id: "deep", name: "深夜深聊", src: "/pages/index/images/posters/poster-deep.jpg", keys: ["深夜", "深聊", "价值观", "夜谈", "心事", "聊"] },
  { id: "dinner", name: "晚餐烟火", src: "/pages/index/images/posters/poster-dinner.jpg", keys: ["晚餐", "饭", "咖啡", "吃", "烟火", "美食"] },
  { id: "lunch", name: "午间轻餐", src: "/pages/index/images/posters/poster-lunch.jpg", keys: ["午间", "中午", "午饭", "午休"] },
  { id: "cat", name: "猫", src: "/pages/index/images/posters/cat-stretch.png", keys: ["猫", "宠物", "撸猫"] },
  { id: "d1", name: "低压力认识", src: "/pages/index/images/posters/need-d1.jpg", keys: ["尴尬", "低压力", "紧张", "怕", "轻松"] },
  { id: "d2", name: "关系松弛", src: "/pages/index/images/posters/need-d2.jpg", keys: ["恋爱", "关系", "心动", "感情"] },
  { id: "d3", name: "同频深聊", src: "/pages/index/images/posters/need-d3.jpg", keys: ["同频", "价值观", "深聊", "认真"] },
  { id: "d4", name: "附近散步", src: "/pages/index/images/posters/need-d4.jpg", keys: ["附近", "周末", "散步", "小区"] },
  { id: "d5", name: "慢慢认识", src: "/pages/index/images/posters/need-d5.jpg", keys: ["慢慢", "微信", "第一次"] },
  { id: "d6", name: "看展文艺", src: "/pages/index/images/posters/need-d6.jpg", keys: ["看展", "艺术", "电影", "文艺", "展"] }
]

const needTopics = [
  { cat: "哲学", color: "#8b7fb8", text: "如果人生是一本书，你希望现在翻到哪一章？", tags: ["#认真认识", "#同频"] },
  { cat: "哲学", color: "#8b7fb8", text: "你觉得「自由」对你来说意味着什么？", tags: ["#自我探索", "#同频"] },
  { cat: "哲学", color: "#8b7fb8", text: "你相信人和人之间真的有「同频」这件事吗？", tags: ["#同频", "#慢慢来"] },
  { cat: "情感", color: "#d98a8a", text: "你上一次觉得「被人接住」，是什么时候？", tags: ["#被看见", "#认真认识"] },
  { cat: "情感", color: "#d98a8a", text: "有没有一个人，让你想起时心里会变软？", tags: ["#情感", "#被看见"] },
  { cat: "情感", color: "#d98a8a", text: "你觉得一段关系里，最珍贵的是什么？", tags: ["#关系", "#认真认识"] },
  { cat: "自我探知", color: "#6f9fc0", text: "最近你对自己有什么新的发现？", tags: ["#自我探索", "#慢热"] },
  { cat: "自我探知", color: "#6f9fc0", text: "如果完全不考虑别人怎么看，你最想成为什么样的人？", tags: ["#自我探索", "#被看见"] },
  { cat: "自我探知", color: "#6f9fc0", text: "你最近一次为自己骄傲，是因为什么？", tags: ["#认真认识", "#生活感"] },
  { cat: "生活感悟", color: "#7fae7f", text: "最近有没有一件小事，让你觉得生活还不错？", tags: ["#生活感", "#附近"] },
  { cat: "生活感悟", color: "#7fae7f", text: "如果明天完全自由，你会怎么过？", tags: ["#周末", "#散步"] },
  { cat: "生活感悟", color: "#7fae7f", text: "你希望生活里多点什么，少点什么？", tags: ["#生活感", "#轻松"] }
]

const needKeywordTags = [
  { k: ["散步", "月亮", "晚霞", "遛狗", "走", "逛"], t: "#散步" },
  { k: ["深聊", "价值观", "同频", "认真", "心事", "夜谈", "接住"], t: "#同频" },
  { k: ["晚餐", "饭", "吃", "咖啡"], t: "#晚餐" },
  { k: ["周末", "附近", "小区"], t: "#附近" },
  { k: ["猫", "宠物"], t: "#养猫" },
  { k: ["看展", "电影", "艺术"], t: "#看展" },
  { k: ["慢慢", "不着急", "第一次", "慢热"], t: "#慢慢来" },
  { k: ["尴尬", "紧张", "怕", "轻松", "低压力"], t: "#低压力" },
  { k: ["被看见", "理解", "接住"], t: "#被看见" }
]

const defaultCommunityNeeds = [
  { id: "d1", author: "林 · 2小时前", subtitle: "正在寻找低压力的认识方式", tags: ["想认识靠谱的人", "少人数"], title: "不想尴尬交换微信，但想认真认识人", copy: "如果有一个中间场域，我会更愿意出来。先轻松认识，不急着定义关系。", image: "/pages/index/images/posters/need-d1.jpg", resonance: 72, commentsCount: 38, response: "主理人正在准备低压力小桌局", similar: true, stats: "72人共鸣 · 38条评论", comments: needCommentsPool.slice(0, 3), user: false },
  { id: "d2", author: "Mei · 昨天", subtitle: "想重新感受到关系里的松弛", tags: ["关系困惑", "慢慢了解"], title: "不是不想恋爱，是越来越难进入关系", copy: "希望有一场聊“心动变难”的局，不急着定义关系。", image: "/pages/index/images/posters/need-d2.jpg", resonance: 45, commentsCount: 22, response: "关系主题预活动准备中", similar: false, stats: "45人共鸣 · 22条评论", comments: needCommentsPool.slice(2, 5), user: false },
  { id: "d3", author: "阿南 · 3天前", subtitle: "想找到能认真聊天的同频朋友", tags: ["deep talk", "价值观"], title: "想找能聊价值观的人，而不是只聊工作", copy: "6个人的小型夜谈，可能比一场大活动更适合认真认识。", image: "/pages/index/images/posters/need-d3.jpg", resonance: 28, commentsCount: 8, response: "深度对谈预活动收集中", similar: false, stats: "28人共鸣 · 8条评论", comments: needCommentsPool.slice(1, 4), user: false },
  { id: "d4", author: "小满 · 6小时前", subtitle: "住同一片，却从没聊过天", tags: ["附近", "周末", "散步"], title: "周末想找同小区附近的人，一起散步遛狗", copy: "住得近，却从没好好说过话。想先从散步开始认识。", image: "/pages/index/images/posters/need-d4.jpg", resonance: 33, commentsCount: 12, response: "散步局已有3人感兴趣", similar: true, stats: "33人共鸣 · 12条评论", comments: needCommentsPool.slice(3, 6), user: false },
  { id: "d5", author: "圆圆 · 昨天", subtitle: "怕尴尬、想慢慢来", tags: ["怕尴尬", "少人数"], title: "第一次见面能不能不交换微信", copy: "先认识，不急着留联系方式，舒服了再交换。", image: "/pages/index/images/posters/need-d5.jpg", resonance: 51, commentsCount: 20, response: "低压力小桌局回应中", similar: true, stats: "51人共鸣 · 20条评论", comments: needCommentsPool.slice(0, 3), user: false },
  { id: "d6", author: "阿May · 今天", subtitle: "喜欢看展、慢节奏", tags: ["看展", "文艺", "轻社交"], title: "想找人一起看展，然后随便聊聊", copy: "看完展不用硬聊，舒服就好。", image: "/pages/index/images/posters/need-d6.jpg", resonance: 17, commentsCount: 5, response: "看展局已有2人报名", similar: false, stats: "17人共鸣 · 5条评论", comments: needCommentsPool.slice(2, 5), user: false }
]

const recorderManager = wx.getRecorderManager()
let recordTimer = null
let innerAudioContext = null
let cancelRecording = false
const isIOS = (wx.getSystemInfoSync().platform || "").toLowerCase() === "ios"

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
    relQuestions: relationshipQuestions,
    relIndex: 0,
    relDone: false,
    relAnswers: { q7: {}, q8: {}, q9: {}, q10: {}, q11: {}, q12: {} },
    profileDims: [
      { name: "认识节奏", key: "自然开场", tags: ["看现场氛围", "慢慢来"] },
      { name: "表达方式", key: "随缘表达", tags: ["看心情", "不勉强"] },
      { name: "安全感与边界", key: "边界清晰", tags: ["需要空间", "讨厌被催"] },
      { name: "活动偏好", key: "自然型", tags: ["慢慢来", "看活动"] }
    ],
    homeComplete: 42,
    homeSummary: "",
    homeTags: [],
    homeCards: [],
    posterIndex: 0,
    homeQuestion: todayHomeQuestion.q,
    homeQuestionOpts: todayHomeQuestion.opts,
    myNeedSel: "",
    myNeedOther: "",
    myNeed: "",
    myNeedQuestion: "",
    myNeedId: "",
    needAsked: false,
    genderOptions: ["女生", "男生", "先不答"],
    educationOptions: ["高中及以下", "大专", "本科", "硕士", "博士", "其他"],
    basicInfo: {
      name: "",
      birth: "",
      gender: "",
      height: "",
      education: "",
      hometown: "",
      hometownRegion: [],
      area: "",
      region: [],
      occupation: "",
      scene: ""
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
    behaviorTags: [],
    dislikedActivityIds: {},
    considerReasons: [],
    savedNeedsList: [],
    showDemandDetail: false,
    activeDemand: null,
    demandComment: "",
    demandVoiceText: "",
    myNeedDraft: "",
    myNeedTitle: "",
    needTopic: "最近有没有一件小事，让你觉得生活还不错？",
    needTopicCat: "生活感悟",
    needTopicColor: "#7fae7f",
    needTopicMode: "ask",
    needHint: "围绕这个话题说点什么，恰好会帮你整理成需求卡",
    needTagOptions: [],
    needManualTag: "",
    canPublishNeed: false,
    showNeedComposer: false,
    selectedNeedFragMap: {},
    needCoverPreview: "",
    needCoverName: "",
    needKeyboardHeight: 0,
    needSort: "latest",
    registeredActivities: [],
    hostForm: { title: "", description: "" },
    hostSubmitted: false,
    qaStarted: false,
    communityNeeds: defaultCommunityNeeds,
    demandComments: defaultCommunityNeeds[0].comments,
    displayedNeeds: defaultCommunityNeeds,
    resonatedNeedIds: {},
    savedNeedIds: {},
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
    exploreSearch: "",
    exploreFilter: "all",
    exploreDist: "all",
    exploreList: [],
    myNeedCount: 0,
    savedNeedCount: 0,
    savedActivityCount: 0,
    activeActivity: activityFeed[0],
    matchReason: "",
    activeActivityRegistered: false,
    activityGroupJoined: false,
    afterPartySpots: [],
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
    const rawRel = saved.relAnswers && typeof saved.relAnswers === "object" ? saved.relAnswers : {}
    const relAnswers = {
      q7: rawRel.q7 && typeof rawRel.q7 === "object" ? rawRel.q7 : {},
      q8: rawRel.q8 && typeof rawRel.q8 === "object" ? rawRel.q8 : {},
      q9: rawRel.q9 && typeof rawRel.q9 === "object" ? rawRel.q9 : {},
      q10: rawRel.q10 && typeof rawRel.q10 === "object" ? rawRel.q10 : {},
      q11: rawRel.q11 && typeof rawRel.q11 === "object" ? rawRel.q11 : {},
      q12: rawRel.q12 && typeof rawRel.q12 === "object" ? rawRel.q12 : {}
    }
    this.introTimer = setTimeout(() => {
      if (this.data.loggedIn) {
        this.enterHome()
      } else if (!options.activity) {
        this.setView("welcome", { push: false, resetHistory: true })
      }
    }, 1400)
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
      relAnswers,
      relIndex: saved.relIndex || 0,
      relDone: Boolean(saved.relDone),
      myNeedSel: saved.myNeedSel || "",
      myNeedOther: saved.myNeedOther || "",
      myNeed: saved.myNeed || "",
      myNeedQuestion: saved.myNeedQuestion || "",
      myNeedId: saved.myNeedId || "",
      needAsked: Boolean(saved.needAsked),
      resonatedNeedIds: saved.resonatedNeedIds || {},
      savedNeedIds: saved.savedNeedIds || {},
      behaviorTags: saved.behaviorTags || [],
      dislikedActivityIds: saved.dislikedActivityIds || {},
      considerReasons: saved.considerReasons || [],
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
    this.refreshNeeds()
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
      canGoBack: history.length > 0,
      showTab,
      screenTitle: viewTitles[view] || "",
      showAppHeader: Boolean(viewTitles[view]) && !["welcome", "intro", "home", "explore", "square", "mine"].includes(view)
    })
  },

  enterHome() {
    this.refreshRecommendations()
    this.prepareHome()
    this.setView("home")
  },

  prepareHome() {
    const dims = this.data.profileDims || []
    const feed = this.data.activityFeed || []
    const typeMap = { dinner: "晚餐局", ai: "深谈局", walk: "散步局", workshop: "工作坊", lunch: "午间小桌" }
    const now = new Date()
    const tom = new Date(now.getTime() + 86400000)
    const dateLabel = (item) => {
      const parts = (item.date || "").split("/").map(Number)
      const isToday = parts[0] === now.getMonth() + 1 && parts[1] === now.getDate()
      const isTom = parts[0] === tom.getMonth() + 1 && parts[1] === tom.getDate()
      const tag = isToday ? "今天" : isTom ? "明天" : item.weekday || ""
      return `${item.date} ${tag} ${item.time || ""}`.trim()
    }
    const cards = feed.slice(0, 4).map(item => ({
      id: item.id,
      poster: activityPosters[item.id] || "",
      dateLabel: dateLabel(item),
      title: item.title,
      location: item.location,
      type: typeMap[item.id] || "活动"
    }))
    const summary = dims.length >= 2 ? dims[0].key + " · " + dims[1].key : (this.data.profileTitle || "认识你一点点")
    const tags = []
    if (dims[2]) tags.push(dims[2].key)
    if (dims[3]) tags.push(dims[3].key)
    if (this.data.basicInfo.area) tags.push(this.data.basicInfo.area)
    const seen = [];
    [...tags, ...(this.data.behaviorTags || [])].forEach(t => { if (t && seen.indexOf(t) === -1) seen.push(t) })
    this.setData({
      homeCards: cards,
      homeSummary: summary,
      homeTags: seen.slice(0, 6)
    })
  },

  mergeBehaviorTags(tags) {
    if (!tags || !tags.length) return
    const merged = [...(this.data.behaviorTags || [])]
    tags.forEach(t => { if (t && merged.indexOf(t) === -1) merged.push(t) })
    this.setData({ behaviorTags: merged.slice(0, 8) })
    this.prepareHome()
    this.persistDraft()
  },

  tapCat() {
    wx.showToast({ title: "喵～", icon: "none" })
  },

  onSwiperChange(e) {
    this.setData({ posterIndex: e.detail.current })
  },

  toggleNeedOption(e) {
    this.setData({ myNeedSel: e.currentTarget.dataset.val })
  },

  updateNeedOther(e) {
    this.setData({ myNeedOther: e.detail.value })
  },

  submitHomeNeed() {
    const sel = this.data.myNeedSel
    const other = (this.data.myNeedOther || "").trim()
    const content = sel && other ? sel + "，" + other : sel || other
    if (!content) {
      wx.showToast({ title: "先选一个，或写下来", icon: "none" })
      return
    }
    const q = this.data.homeQuestion
    let communityNeeds = [...this.data.communityNeeds]
    if (this.data.myNeedId) {
      communityNeeds = communityNeeds.map(n => n.id === this.data.myNeedId ? { ...n, question: q, answer: content, title: content.slice(0, 14), copy: content, image: this.pickCoverForText(content), stats: "刚刚发布 · 等待更多人回应" } : n)
    } else {
      const id = `need-home-${Date.now()}`
      communityNeeds = [{ id, author: "我 · 刚刚", subtitle: "来自小CC的提问", tags: [], question: q, answer: content, title: content.slice(0, 14), copy: content, image: this.pickCoverForText(content), resonance: 0, commentsCount: 0, response: "等待同频的人回应", similar: true, stats: "刚刚发布 · 等待更多人回应", comments: [], user: true }, ...communityNeeds]
      this.setData({ myNeedId: id })
    }
    this.setData({ myNeed: content, myNeedQuestion: q, needAsked: true, communityNeeds })
    this.refreshNeeds()
    this.persistDraft()
    wx.showToast({ title: "收到，小CC记下了", icon: "success" })
  },

  pickCoverForText(text) {
    const t = (text || "").toLowerCase()
    const matched = coverPool.filter(c => c.keys.some(k => t.indexOf(k) > -1))
    const pool = matched.length ? matched : coverPool
    return pool[Math.floor(Math.random() * pool.length)].src
  },

  editMyNeed() {
    this.setData({ needAsked: false })
  },

  refreshNeeds() {
    const list = [...this.data.communityNeeds]
    if (this.data.needSort === "hot") {
      list.sort((a, b) => (b.resonance || 0) - (a.resonance || 0))
    }
    this.setData({ displayedNeeds: list })
  },

  switchNeedSort(e) {
    this.setData({ needSort: e.currentTarget.dataset.sort })
    this.refreshNeeds()
  },

  toggleNeedResonance(e) {
    const id = e.currentTarget.dataset.id
    const map = { ...this.data.resonatedNeedIds }
    const isOn = !map[id]
    if (map[id]) delete map[id]
    else map[id] = true
    const need = this.data.communityNeeds.find(n => n.id === id)
    if (isOn && need && need.tags) this.mergeBehaviorTags(need.tags)
    this.setData({ resonatedNeedIds: map })
    this.persistDraft()
  },

  toggleNeedSave(e) {
    const id = e.currentTarget.dataset.id
    const map = { ...this.data.savedNeedIds }
    const isOn = !map[id]
    if (map[id]) delete map[id]
    else map[id] = true
    const need = this.data.communityNeeds.find(n => n.id === id)
    if (isOn && need && need.tags) this.mergeBehaviorTags(need.tags)
    this.setData({ savedNeedIds: map })
    this.persistDraft()
  },

  go(e) {
    const view = e.currentTarget.dataset.view
    const current = this.data.view
    if (view === "deepQa" && current === "lightQa") {
      this.resetQa()
    }
    if (view === "home") {
      this.refreshRecommendations()
      this.prepareHome()
      this.setView(view, { push: false, resetHistory: true })
      return
    }
    if (view === "explore") this.computeExplore()
    if (view === "mine") this.refreshMine()
    if (view === "profile") this.generateProfile()
    if (view === "savedNeeds") {
      const savedIds = this.data.savedNeedIds || {}
      const list = this.data.communityNeeds.filter(n => savedIds[n.id])
      this.setData({ savedNeedsList: list })
    }
    if (this.isTab(view)) {
      this.setView(view, { push: false, resetHistory: true })
      return
    }
    this.setView(view)
  },

  editProfile() {
    this.setView("basicInfo")
  },

  mineToast(e) {
    wx.showToast({ title: e.currentTarget.dataset.text || "功能开发中，先看看这里吧", icon: "none" })
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
      const saved = wx.getStorageSync("qiahaoDraft") || {}
      const hasProfile = Boolean(saved.basicInfo && saved.basicInfo.name) || Boolean(saved.entryDone) || Boolean(saved.relDone) || Boolean(saved.qaBasicDone)
      this.setData({ loggedIn: true, accountName: "小Z" })
      this.persistDraft()
      if (hasProfile) {
        this.enterHome()
      } else {
        this.setView("lightQa")
      }
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
    if (this.pendingDemandId && previous !== "activityDetail") {
      const id = this.pendingDemandId
      this.pendingDemandId = null
      this.openDemandDetail({ currentTarget: { dataset: { id } } })
    }
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
    if (this.data.entryIndex === 0 && !Object.keys(this.data.entryAnswers.q1 || {}).length) {
      wx.showToast({ title: "先选一个，小CC才知道怎么帮你", icon: "none" })
      return
    }
    if (this.data.entryIndex < entryQuestions.length - 1) {
      this.setData({ entryIndex: this.data.entryIndex + 1 })
    } else {
      this.setData({ entryDone: true })
      if (this.data.relIndex >= relationshipQuestions.length) this.setData({ relIndex: 0 })
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

  toggleRelOption(e) {
    const qid = e.currentTarget.dataset.qid
    const oi = e.currentTarget.dataset.oi
    const q = relationshipQuestions[this.data.relIndex]
    if (!q || q.id !== qid) return
    const map = { ...(this.data.relAnswers[qid] || {}) }
    if (q.multi) {
      if (map[oi]) delete map[oi]
      else map[oi] = true
      this.setData({ [`relAnswers.${qid}`]: map })
    } else {
      const next = {}
      if (!map[oi]) next[oi] = true
      this.setData({ [`relAnswers.${qid}`]: next })
    }
    this.persistDraft()
  },

  relNext() {
    if (this.data.relIndex < relationshipQuestions.length - 1) {
      this.setData({ relIndex: this.data.relIndex + 1 })
    } else {
      this.setData({ relDone: true })
      this.setView("basicInfo")
    }
    this.persistDraft()
  },

  relPrev() {
    if (this.data.relIndex > 0) {
      this.setData({ relIndex: this.data.relIndex - 1 })
      this.persistDraft()
    }
  },

  toggleBasicChip(e) {
    const field = e.currentTarget.dataset.field
    const val = e.currentTarget.dataset.val
    if (!field) return
    this.setData({ [`basicInfo.${field}`]: val })
    this.persistDraft()
  },

  updateBasicDate(e) {
    this.setData({ "basicInfo.birth": e.detail.value })
    this.persistDraft()
  },

  updateBasicRegion(e) {
    const region = e.detail.value || []
    const area = region[1] && region[2] ? region[1] + " · " + region[2] : (region.join(" · "))
    this.setData({ "basicInfo.region": region, "basicInfo.area": area })
    this.persistDraft()
  },

  updateBasicSelector(e) {
    const field = e.currentTarget.dataset.field
    const options = field === "gender" ? this.data.genderOptions : this.data.educationOptions
    const val = options[Number(e.detail.value)]
    if (!val) return
    this.setData({ [`basicInfo.${field}`]: val })
    this.persistDraft()
  },

  updateHometownRegion(e) {
    const region = e.detail.value || []
    const hometown = region[0] && region[1] ? region[0] + " · " + region[1] : (region.join(" · "))
    this.setData({ "basicInfo.hometownRegion": region, "basicInfo.hometown": hometown })
    this.persistDraft()
  },

  submitBasicInfo() {
    const b = this.data.basicInfo
    const missing = []
    if (!(b.name || "").trim()) missing.push("昵称")
    if (!b.birth) missing.push("生日")
    if (!b.gender) missing.push("性别")
    if (!b.area) missing.push("现居住地")
    if (missing.length) {
      wx.showToast({ title: "还差：" + missing.join("、"), icon: "none" })
      return
    }
    this.generateProfile()
    this.setView("profile")
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
    const found = this.data.activityFeed.find(item => item.id === id || item.id === aliases[id]) || this.data.activityFeed[0]
    const activeActivity = { ...found, poster: activityPosters[found.id] || "", fee: activityFee[found.id] || "预约" }
    const people = (found.people || "").split("·")[0].trim()
    const topic = (found.tags || [])[0] || "自然话题"
    const matchReason = `这场只有 ${people}，${found.weekday}晚在${found.location}，聊的是${topic}——很适合现在想慢慢认识人的你。`
    this.setData({ activeActivity, matchReason, activeActivityRegistered: this.data.registeredActivities.includes(activeActivity.id), activityGroupJoined: false })
    this.refreshAfterParty()
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
      relAnswers: this.data.relAnswers,
      relIndex: this.data.relIndex,
      relDone: this.data.relDone,
      myNeedSel: this.data.myNeedSel,
      myNeedOther: this.data.myNeedOther,
      myNeed: this.data.myNeed,
      myNeedQuestion: this.data.myNeedQuestion,
      myNeedId: this.data.myNeedId,
      needAsked: this.data.needAsked,
      resonatedNeedIds: this.data.resonatedNeedIds,
      savedNeedIds: this.data.savedNeedIds,
      behaviorTags: this.data.behaviorTags,
      dislikedActivityIds: this.data.dislikedActivityIds,
      considerReasons: this.data.considerReasons,
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
    const r = this.data.relAnswers
    const basic = this.data.basicInfo
    const eTexts = (qid) => Object.keys(a[qid] || {}).map(i => entryQuestions.find(q => q.id === qid).options[Number(i)].text)
    const rTexts = (qid) => Object.keys(r[qid] || {}).map(i => relationshipQuestions.find(q => q.id === qid).options[Number(i)].text)
    const pick = (arr) => arr[0] || ""
    const e1 = eTexts("q1")
    const e2 = eTexts("q2")
    const e3 = eTexts("q3")
    const e6 = eTexts("q6").join("")
    const j1 = e1.join("")
    const j2 = e2.join("")
    const j3 = e3.join("")
    const r7 = pick(rTexts("q7"))
    const r8 = pick(rTexts("q8"))
    const r9 = pick(rTexts("q9"))
    const dim = (name, key, tags) => ({ name, key, tags })
    const dims = []
    if (r7.includes("有规则")) dims.push(dim("认识节奏", "偏好有引导", ["先玩游戏再聊", "规则感让我安心"]))
    else if (r7.includes("共同兴趣")) dims.push(dim("认识节奏", "兴趣开启", ["聊得起来", "不怕没话题"]))
    else if (r7.includes("慢热")) dims.push(dim("认识节奏", "慢热观察", ["先观察再靠近", "需要时间热起来"]))
    else if (r7.includes("深一点")) dims.push(dim("认识节奏", "直接深聊", ["不想客套", "愿意上强度"]))
    else dims.push(dim("认识节奏", "自然开场", ["看现场氛围", "慢慢来"]))
    if (r8.includes("主动型")) dims.push(dim("表达方式", "主动靠近", ["喜欢就会靠近"]))
    else if (r8.includes("慢热型")) dims.push(dim("表达方式", "慢热表达", ["熟了之后话很多"]))
    else if (r8.includes("被动型")) dims.push(dim("表达方式", "被动等待", ["需要对方先给信号"]))
    else if (r8.includes("状态型")) dims.push(dim("表达方式", "状态驱动", ["感觉对了就主动"]))
    else dims.push(dim("表达方式", "随缘表达", ["看心情", "不勉强"]))
    if (r9.includes("说到做到")) dims.push(dim("安全感与边界", "确定性", ["说到做到", "不用我猜"]))
    else if (r9.includes("个人空间")) dims.push(dim("安全感与边界", "空间感", ["个人空间被尊重"]))
    else if (r9.includes("情绪稳定")) dims.push(dim("安全感与边界", "情绪安全", ["不冷处理", "稳定回应"]))
    else if (r9.includes("被肯定")) dims.push(dim("安全感与边界", "被看见", ["被肯定", "被回应"]))
    else dims.push(dim("安全感与边界", "边界清晰", ["需要空间", "讨厌被催"]))
    if (j2.includes("工作坊")) dims.push(dim("活动偏好", "练习型", ["关系练习", "有结构"]))
    else if (j2.includes("同频") && !j2.includes("午间")) dims.push(dim("活动偏好", "深聊型", ["小场深聊", "立体识人"]))
    else if (j2.includes("散步")) dims.push(dim("活动偏好", "轻量型", ["散步", "低压力"]))
    else if (j2.includes("午间")) dims.push(dim("活动偏好", "轻触型", ["午间", "附近"]))
    else if (j2.includes("需求成局")) dims.push(dim("活动偏好", "话题型", ["先有话题"]))
    else dims.push(dim("活动偏好", "自然型", ["慢慢来", "看活动"]))
    let insight
    if (j3.includes("条件对条件") || j3.includes("无效社交")) {
      insight = "你不想把认识变成条件交换。恰好这里只做一件事：在真实环境里，把彼此看得更立体。"
    } else if (e6.includes("有点累")) {
      insight = "今天先不给自己压力，从最轻的一场开始，舒服地出现在人群里就好。"
    } else {
      insight = "你愿意认真认识人。这里会优先给你少人数、流程清楚、来的人画像明确的活动。"
    }
    this.setData({
      profileTitle: (basic.name || "小Z") + " · 初印象",
      profileDims: dims,
      profileInsight: insight
    })
  },


  openDemandDetail(e) {
    const id = e.currentTarget.dataset.id
    const found = this.data.communityNeeds.find(item => item.id === id) || this.data.communityNeeds[0]
    const responseActivity = this.matchNeedActivity(found)
    const activeDemand = {
      ...found,
      title: found.title,
      detail: found.copy || found.detail,
      stats: found.stats || `${found.resonance || 0}人共鸣 · ${found.commentsCount || 0}条评论`,
      response: responseActivity ? `主理人正在准备${responseActivity.title}` : (found.response || ""),
      responseActivity
    }
    this.setData({ activeDemand, showDemandDetail: true, demandComment: "", demandKeyboardHeight: 0 })
  },

  matchNeedActivity(need) {
    const feed = this.data.activityFeed || []
    const text = `${(need.tags || []).join(" ")} ${need.title || ""} ${need.copy || ""}`.toLowerCase()
    const rules = [
      { id: "dinner", keys: ["晚餐", "饭", "吃", "靠谱", "轻聊", "轻餐", "下班", "共餐", "认识人"] },
      { id: "ai", keys: ["深聊", "价值观", "同频", "深谈", "认真", "心事", "夜谈", "关系"] },
      { id: "walk", keys: ["散步", "月亮", "遛狗", "附近", "周末", "走", "晚霞", "逛"] },
      { id: "workshop", keys: ["工作坊", "模式", "慢了解", "说明书", "练习"] },
      { id: "lunch", keys: ["午间", "中午", "午饭", "一小时", "午休"] }
    ]
    let best = null
    let bestScore = 0
    rules.forEach(rule => {
      const score = rule.keys.reduce((sum, key) => sum + (text.indexOf(key) > -1 ? 1 : 0), 0)
      if (score > bestScore) {
        bestScore = score
        best = rule
      }
    })
    if (!best || bestScore === 0) return null
    return feed.find(item => item.id === best.id) || null
  },

  openDemandActivity() {
    const act = this.data.activeDemand && this.data.activeDemand.responseActivity
    if (!act) return
    this.pendingDemandId = this.data.activeDemand.id
    this.closeDemandDetail()
    this.openActivity({ currentTarget: { dataset: { id: act.id } } })
  },

  closeDemandDetail() {
    this.setData({ showDemandDetail: false, activeDemand: null, demandKeyboardHeight: 0 })
  },

  updateDemandComment(e) {
    this.setData({ demandComment: e.detail.value })
    this.persistDraft()
  },

  onDemandKeyboardChange(e) {
    const h = (e.detail && e.detail.height) || 0
    this.setData({ demandKeyboardHeight: isIOS ? 0 : h })
  },

  updateNeedDraft(e) {
    const content = e.detail.value
    const hint = !content.trim()
      ? "围绕这个话题说点什么，恰好会帮你整理成需求卡"
      : content.trim().length < 4
        ? "再多说一点，恰好更容易猜中你的心意"
        : "根据你的回答，恰好帮你挑了这些话题，点一下可以带上"
    this.setData({ myNeedDraft: content, needHint: hint, canPublishNeed: Boolean(content.trim() || this.data.myNeedTitle.trim()) })
    this.refreshNeedTags()
    this.persistDraft()
  },

  openNeedComposer() {
    this.setData({ showNeedComposer: true, selectedNeedFragMap: {}, needCoverPreview: "", needCoverName: "", myNeedDraft: "", myNeedTitle: "", needManualTag: "", needTopicMode: "ask", canPublishNeed: false, needKeyboardHeight: 0 })
    this.pickNeedTopic()
    this.refreshNeedTags()
  },

  cancelNeedComposer() {
    this.setData({ showNeedComposer: false, needKeyboardHeight: 0 })
  },

  onNeedKeyboardChange(e) {
    const h = (e.detail && e.detail.height) || 0
    this.setData({ needKeyboardHeight: isIOS ? 0 : h })
  },

  updateNeedTitle(e) {
    this.setData({ myNeedTitle: e.detail.value, canPublishNeed: Boolean(e.detail.value.trim() || this.data.myNeedDraft.trim()) })
  },

  toggleNeedFrag(e) {
    const frag = e.currentTarget.dataset.frag
    const map = { ...this.data.selectedNeedFragMap }
    if (map[frag]) delete map[frag]
    else map[frag] = true
    this.setData({ selectedNeedFragMap: map })
  },

  pickNeedTopic() {
    if (this.data.needTopicMode !== "ask") return
    const topic = needTopics[Math.floor(Math.random() * needTopics.length)]
    this.setData({ needTopic: topic.text, needTopicCat: topic.cat, needTopicColor: topic.color })
    this.refreshNeedTags()
  },

  flipTopicToFree() {
    this.setData({ needTopicMode: "free", needHint: "" })
    this.refreshNeedTags()
  },

  flipTopicToAsk() {
    this.setData({ needTopicMode: "ask", needHint: "围绕这个话题说点什么，恰好会帮你整理成需求卡" })
    this.pickNeedTopic()
    this.refreshNeedTags()
  },

  refreshNeedTags() {
    const content = (this.data.myNeedDraft || "").toLowerCase()
    const tags = []
    if (this.data.needTopicMode === "ask") {
      const current = needTopics.find(t => t.text === this.data.needTopic)
      if (current) current.tags.forEach(t => { if (tags.indexOf(t) === -1) tags.push(t) })
    }
    needKeywordTags.forEach(rule => {
      if (rule.k.some(k => content.indexOf(k) > -1) && tags.indexOf(rule.t) === -1) tags.push(rule.t)
    })
    if (content.trim().length >= 4 && tags.length === 0) tags.push("#想认识", "#认真认识")
    this.setData({ needTagOptions: tags.slice(0, 6) })
  },

  addNeedTag(e) {
    const raw = (e.detail.value || "").trim()
    if (!raw) return
    const t = raw.indexOf("#") === 0 ? raw : "#" + raw
    const map = { ...this.data.selectedNeedFragMap, [t]: true }
    const options = this.data.needTagOptions.indexOf(t) === -1 ? [...this.data.needTagOptions, t] : this.data.needTagOptions
    this.setData({ selectedNeedFragMap: map, needTagOptions: options, needManualTag: "" })
  },

  addNeedTagManual() {
    const raw = (this.data.needManualTag || "").trim()
    if (!raw) return
    const t = raw.indexOf("#") === 0 ? raw : "#" + raw
    const map = { ...this.data.selectedNeedFragMap, [t]: true }
    const options = this.data.needTagOptions.indexOf(t) === -1 ? [...this.data.needTagOptions, t] : this.data.needTagOptions
    this.setData({ selectedNeedFragMap: map, needTagOptions: options, needManualTag: "" })
    wx.showToast({ title: `已添加 ${t}`, icon: "none" })
  },

  updateNeedManualTag(e) {
    this.setData({ needManualTag: e.detail.value })
  },

  aiGenerateCover() {
    const text = (this.data.myNeedDraft || "") + " " + Object.keys(this.data.selectedNeedFragMap).join(" ")
    const matched = coverPool.filter(c => c.keys.some(k => text.indexOf(k) > -1))
    const pool = matched.length ? matched : coverPool
    const candidates = pool.filter(c => c.src !== this.data.needCoverPreview)
    const next = (candidates.length ? candidates : pool)[Math.floor(Math.random() * (candidates.length ? candidates.length : pool.length))]
    this.setData({ needCoverPreview: next.src, needCoverName: next.name })
    wx.showToast({ title: matched.length ? "恰好按你的话挑了一张" : "恰好帮你挑了一张", icon: "none" })
  },

  uploadCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["compressed"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.setData({ needCoverPreview: file.tempFilePath, needCoverName: "我的照片" })
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || ""
        if (msg.indexOf("cancel") > -1) return
        if (msg.indexOf("privacy") > -1) {
          wx.showModal({ title: "需要相册权限", content: "请在微信公众平台配置「用户隐私保护指引」并勾选相册权限后，才能上传照片。", showCancel: false, confirmText: "知道了" })
          return
        }
        wx.showToast({ title: "上传失败，请重试", icon: "none" })
      }
    })
  },

  publishNeed() {
    const title = (this.data.myNeedTitle || "").trim().slice(0, 14)
    const content = (this.data.myNeedDraft || "").trim()
    if (!title && !content) {
      wx.showToast({ title: "先回答一下话题吧", icon: "none" })
      return
    }
    const id = `need-${Date.now()}`
    const frags = Object.keys(this.data.selectedNeedFragMap)
    const subtitle = this.data.needTopicCat || "刚刚发布的需求"
    const topicText = this.data.needTopicMode === "ask" ? (this.data.needTopic || "") : ""
    const newNeed = { id, author: "我 · 刚刚", subtitle, tags: frags, title: title || content.slice(0, 14), copy: content, question: topicText, topic: topicText, topicCat: this.data.needTopicMode === "ask" ? (this.data.needTopicCat || "") : "", image: this.data.needCoverPreview || "/pages/index/images/posters/poster-lunch.jpg", resonance: 0, commentsCount: 0, response: "", similar: false, stats: "刚刚发布 · 等待更多人回应", comments: [], user: true }
    const demandHistory = [{ id: `history-${Date.now()}`, title: title || content.slice(0, 14), date: "刚刚提出", status: "待探索", activity: "等待对应活动", tags: frags }, ...this.data.demandHistory]
    this.setData({ communityNeeds: [newNeed, ...this.data.communityNeeds], demandHistory, myNeedDraft: "", myNeedTitle: "", showNeedComposer: false, selectedNeedFragMap: {}, needCoverPreview: "", needCoverName: "", canPublishNeed: false })
    this.refreshNeeds()
    this.mergeBehaviorTags(frags)
    this.persistDraft()
    wx.showToast({ title: "已发布，小CC记下了", icon: "success" })
  },

  addDemandComment() {
    const comment = this.data.demandComment.trim()
    if (!comment) {
      wx.showToast({ title: "先写下一句你的想法", icon: "none" })
      return
    }
    const author = this.data.basicInfo.name || this.data.accountName || "恰好用户"
    const comments = [{ id: `c-${Date.now()}`, author, initial: author.charAt(0) || "恰", avatar: this.data.avatarUrl || "", time: "刚刚", text: comment }, ...(this.data.activeDemand.comments || [])]
    const id = this.data.activeDemand.id
    const communityNeeds = this.data.communityNeeds.map(item => {
      if (item.id !== id) return item
      const commentsCount = (item.commentsCount || 0) + 1
      const stats = `${item.resonance || 0}人共鸣 · ${commentsCount}条评论`
      return { ...item, comments, commentsCount, stats }
    })
    const updated = communityNeeds.find(item => item.id === id)
    this.setData({ demandComments: comments, communityNeeds, activeDemand: { ...this.data.activeDemand, comments, commentsCount: updated.commentsCount, stats: updated.stats }, demandComment: "" })
    this.refreshNeeds()
    this.persistDraft()
    wx.showToast({ title: "已发布评论", icon: "success" })
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

  refreshAfterParty() {
    this.setData({ afterPartySpots: this.pickAfterPartySpots() })
  },

  pickAfterPartySpots() {
    const a = this.data.entryAnswers || {}
    const q6 = Object.keys(a.q6 || {})
    let energy = "mid"
    if (q6.includes("2")) energy = "low"
    else if (q6.includes("0")) energy = "high"

    const rel = this.data.relAnswers || {}
    const relTexts = (qid) => Object.keys(rel[qid] || {}).map(i => relationshipQuestions.find(q => q.id === qid).options[Number(i)].text).join("")
    const r7 = relTexts("q7")
    const r8 = relTexts("q8")
    let style = "chat"
    if (r7.includes("慢热") || r8.includes("慢热") || r8.includes("被动")) style = "walk"
    else if (r7.includes("有规则") || r7.includes("共同兴趣")) style = "task"
    else if (r7.includes("深")) style = "deep"

    const act = this.data.activeActivity || {}
    const lastTime = (act.schedule && act.schedule.length ? act.schedule[act.schedule.length - 1].time : act.time) || ""
    const hour = parseInt(String(lastTime).split(":")[0], 10)
    const period = Number.isFinite(hour) && hour >= 19 ? "night" : "day"

    const energyPrefix = energy === "low" ? "你今晚说过想轻松一点，" : energy === "high" ? "你今晚还有能量，" : "现在散场不赶时间，"

    const scored = afterPartySpots
      .filter(s => s.time.includes(period))
      .map(s => ({ ...s, score: (s.energy.includes(energy) ? 2 : 0) + (s.style.includes(style) ? 2 : 0) + Math.random() }))
      .sort((x, y) => y.score - x.score)

    const picked = []
    const seenCat = {}
    for (const s of scored) {
      if (picked.length >= 3) break
      if (!seenCat[s.cat]) {
        picked.push(s)
        seenCat[s.cat] = true
      }
    }
    for (const s of scored) {
      if (picked.length >= 3) break
      if (!picked.includes(s)) picked.push(s)
    }

    return picked.map(s => ({ ...s, why: energyPrefix + s.line }))
  },

  shareAfterParty() {
    if (!this.data.activeActivityRegistered) {
      wx.showToast({ title: "报名后就能发到活动群", icon: "none" })
      return
    }
    const names = this.data.afterPartySpots.map(s => s.name).join("、")
    this.setData({ activityGroupJoined: true })
    wx.showModal({
      title: "三个去处已发到活动群",
      content: `${names}\n\n谁想一起就接龙，不想去也没关系，小CC不替你们决定。`,
      showCancel: false,
      confirmText: "知道了"
    })
    this.persistDraft()
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
      path: "/pages/index/index?activity=" + this.data.activeActivity.id,
      imageUrl: this.data.activeActivity.poster
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
    const disliked = this.data.dislikedActivityIds || {}
    const pool = [...baseCards, ...replacementCards].filter(c => !disliked[c.id])
    const seen = []
    pool.forEach(c => { if (seen.findIndex(x => x.id === c.id) === -1) seen.push(c) })
    this.setData({ recommendCards: seen.slice(0, 3) })
  },

  dismissCard(e) {
    const id = e.currentTarget.dataset.id
    const disliked = { ...this.data.dislikedActivityIds, [id]: true }
    const pool = [...baseCards, ...replacementCards].filter(c => !disliked[c.id])
    const seen = []
    pool.forEach(c => { if (seen.findIndex(x => x.id === c.id) === -1) seen.push(c) })
    this.setData({ dislikedActivityIds: disliked, recommendCards: seen.slice(0, 3) })
    this.persistDraft()
    wx.showToast({ title: "已帮你减少这类推荐", icon: "none" })
  },

  openReason() {
    this.setData({ showReasonModal: true })
  },

  closeReason(e) {
    const reason = e.currentTarget.dataset.reason || "已收藏"
    const reasons = [...(this.data.considerReasons || [])]
    if (reason !== "已收藏" && reasons.indexOf(reason) === -1) reasons.push(reason)
    this.setData({ showReasonModal: false, considerReasons: reasons.slice(0, 6) })
    if (reason !== "已收藏") this.mergeBehaviorTags([reason])
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

  computeExplore() {
    const feed = this.data.activityFeed || []
    const distMap = { dinner: 1.8, ai: 2.6, walk: 4.2, workshop: 2.9, lunch: 3.4 }
    const search = (this.data.exploreSearch || "").trim()
    const list = feed.filter(item => {
      const themeOk = this.data.exploreFilter === "all" || item.type === this.data.exploreFilter
      const dist = distMap[item.id] || 8
      const distOk = this.data.exploreDist === "all" ||
        (this.data.exploreDist === "near" && dist <= 3) ||
        (this.data.exploreDist === "middle" && dist <= 5)
      const hay = `${item.title}${(item.tags || []).join("")}${item.location}${item.subtitle}`
      const searchOk = !search || hay.includes(search)
      return themeOk && distOk && searchOk
    }).map(item => ({ ...item, poster: activityPosters[item.id] || "" }))
    this.setData({ exploreList: list })
  },

  refreshMine() {
    this.setData({
      myNeedCount: this.data.communityNeeds.filter(n => n.user).length,
      savedNeedCount: Object.keys(this.data.savedNeedIds || {}).length,
      savedActivityCount: this.data.registeredActivities.length
    })
  },

  updateExploreSearch(e) {
    this.setData({ exploreSearch: e.detail.value })
    this.computeExplore()
  },

  setExploreFilter(e) {
    this.setData({ exploreFilter: e.currentTarget.dataset.filter })
    this.computeExplore()
  },

  setExploreDist(e) {
    this.setData({ exploreDist: e.currentTarget.dataset.filter })
    this.computeExplore()
  },

  clearExploreFilter() {
    this.setData({ exploreSearch: "", exploreFilter: "all", exploreDist: "all" })
    this.computeExplore()
  },

  toast(e) {
    wx.showToast({ title: e.currentTarget.dataset.text, icon: "none" })
  },

  noop() {
  }
})
