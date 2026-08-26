# 路线A · 隐藏需求广场改造清单（2026-08-26）

> 背景：为走"个人主体 + 工具-预约/报名"轻审核路线，需要把**公开的用户生成内容（UGC）**收起来——需求广场、需求卡详情、评论、共鸣、收藏、发布需求卡都属于公开 UGC，微信审核会判为"社交范畴、个人主体未开放"。
> 原则：**先隐藏，不硬删**。代码里用开关控制（如 `featureFlags.socialSquare`），将来办了营业执照想恢复，把开关打开即可。

## 一、总体影响

隐藏需求广场后，小程序从"4 个 tab（专属/发现/需求/我的）"变成"3 个 tab（专属/发现/我的）"，产品叙事从"公开被看见"调整为"**小CC专属服务**"：用户照常回答每日一问、表达需求，但这些表达只给小CC看（先存本地，以后进数据库），不再公开展示、不再有评论和共鸣。

### 不受影响的功能（照常保留）
- 注册流程：三问入门 → QA 问答 → 基础资料 → 初回画像
- 专属页：画像条、活动海报轮播、每日一问（改为私密表达）
- 发现页：活动搜索、筛选、活动详情
- 活动报名 / 取消 / 考虑一下 / 不喜欢这类（反馈回流画像）
- 我的：资料、画像成长、参加活动记录、活动收藏占位
- 分享活动海报

## 二、影响面清单

| 模块 | 现状 | 处理方式 |
| --- | --- | --- |
| 需求 tab（需求广场列表） | 公开需求卡列表 + 排序 + 共鸣/评论/收藏按钮 | 隐藏 |
| 需求卡详情 | 封面、话题卡、标题内容、三统计、活动回应、评论区 | 隐藏 |
| 发布需求卡（+ 按钮） | 话题卡/自己发起/标题/内容/标签/封面/生成图/发布 | 隐藏 |
| 需求收藏页 | 我收藏的需求列表 | 隐藏（与需求广场强绑定） |
| 首页"你的声音" | 答完每日一问后显示"还有 6 人和你一样"+ 去需求广场按钮 | 保留问答，删掉公开共鸣文案和去广场按钮，改为"小CC已记下" |
| 我的页 | 公开需求计数、需求收藏入口、我的需求行 | 删除或改为"我给小CC的表达"（私有） |
| tab 栏 | 专属 / 发现 / 需求 / 我的 | 改成专属 / 发现 / 我的 |
| 画像标签回流 | 共鸣、收藏、发布需求会往画像加标签 | 这三类不再回流；保留"考虑一下"原因回流 |
| 需求活动匹配 | 需求详情里"有活动回应了 → 查看" | 随需求详情一起隐藏；将来恢复时做成"我的需求单"匹配 |

## 三、代码改动清单

### 1. 页面层（index.wxml）
- [ ] 删除 `square` 视图块（需求广场列表、排序、FAB +）
- [ ] 删除 `need-detail-page` 视图块（详情、评论区、纸飞机、底部共鸣/收藏条）
- [ ] 删除 `publish-page` 视图块（发布器全部）
- [ ] 删除 `savedNeeds` 视图块（需求收藏页）
- [ ] tab 栏 4 项改 3 项，去掉"需求"
- [ ] 首页"你的声音"卡：去掉"去需求广场看看"按钮、去掉"还有 X 人和你一样"文案
- [ ] 我的页：去掉"需求收藏"promo、去掉 stats 里"公开需求/需求收藏"、"我的需求"行改为私有表达或删除

### 2. 逻辑层（index.js）
- [ ] 数据层加开关：`featureFlags: { socialSquare: false }`
- [ ] `tabViews` 改为 `["home", "explore", "mine"]`
- [ ] 每日一问 `submitHomeNeed`：只保存 `myNeed / myNeedQuestion / needAsked`（私有），不再写入 `communityNeeds`、不再生成公开需求卡
- [x] 不再使用的函数保留但全部无调用点（不执行、不影响运行）：`switchNeedSort`、`toggleNeedResonance`、`toggleNeedSave`、`openDemandDetail`、`closeDemandDetail`、`toggleDemandComments`、`addDemandComment`、`openDemandActivity`、`openNeedComposer`、`cancelNeedComposer`、`pickNeedTopic`、`flipTopicToFree`、`flipTopicToAsk`、`updateNeedTitle`、`updateNeedDraft`、`toggleNeedFrag`、`addNeedTag`、`addNeedTagManual`、`uploadCover`、`aiGenerateCover`、`publishNeed`、`refreshNeedTags`、`markDemandResolved`、`hideDemand`、`matchNeedActivity`（恢复时直接复用）
- [ ] `refreshMine`：去掉 `myNeedCount / savedNeedCount` 依赖，保留参加活动数
- [ ] `mergeBehaviorTags`：只保留"考虑一下"原因和活动反馈回流；共鸣/收藏/发布不再调用
- [ ] `back()`：去掉 `showDemandDetail` / `pendingDemandId` 分支
- [ ] 持久化（`persistDraft` / 恢复）：去掉 `communityNeeds`、`resonatedNeedIds`、`savedNeedIds`、`demandComments`、`myNeedDraft`、`myNeedTitle` 等公开需求字段；保留 `myNeed` 私有表达；旧缓存读取时自动忽略多余字段（不报错）

### 3. 演示数据（index.js 顶部常量）
- [x] `defaultCommunityNeeds`、`needCommentsPool`、`demoComments`、`needKeywordTags`、`needTopics`、`coverPool` 已移除（恢复时按本清单重新加回）
- [ ] `baseCards` / `replacementCards` 中 `kind: "demand"` 的推荐卡移除（当前未渲染，但避免将来误用）

### 4. 配套改动
- [ ] `viewTitles` 删除 `square`；标题逻辑同步
- [ ] 更新《小程序实现注意事项.md》：第 12 条测试清单改为 3 tab 版本，去掉需求页 18-19 项
- [ ] 更新《上线清单.md》：勾选"路线A 已选定，需求广场已隐藏"
- [ ] 提审口径准备：小程序功能 = 活动展示 + 报名/预约 + 画像 + 私密问答表达，无公开 UGC，匹配"工具-预约/报名"

## 四、影响与取舍（提前说明）

1. **失去公开"被看见"**：共鸣、评论、收藏、需求广场展示全部消失，这是产品现在最亮的卖点之一。保留的是"对小CC表达"，更接近"专属需求单"。
2. **将来可恢复**：办完营业执照后，把 `featureFlags.socialSquare` 打开、按本清单加回演示常量和页面块，再接入数据库，需求广场可以恢复（相关函数已保留）。
3. **每日一问保留**：作为私密的"需求表达"入口，回答存本地，将来入库后小CC工作台可见。
4. **活动推荐不受影响**：专属页和发现页仍按画像推活动，报名流程照旧。

## 五、改完后的验证清单

- [ ] 注册 → 画像 → 专属页全流程正常
- [ ] 每日一问能答；"你的声音"只显示私有记录，无去广场按钮
- [ ] tab 只有 3 个（专属 / 发现 / 我的），无任何入口能进入需求广场、发布器、评论、收藏
- [ ] 我的页无需求统计和收藏入口
- [ ] 老用户本地缓存（带旧字段）进入不报错
- [ ] 开发者工具编译通过；真机 iPhone + 安卓预览正常
