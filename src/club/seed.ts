import type { ClubActivity, LifePost, Need } from './types';
export const lightQuestions = [
  { title:'你最近最想解决什么？', options:['想认识靠谱的人','想自然一点脱单','想找能深聊的人','想扩大线下社交圈','想理解关系模式','暂时不确定'] },
  { title:'你更容易接受哪种见面场景？', options:['少人数饭局','轻松散步','主题 deep talk','共同兴趣活动','关系工作坊','小组匹配'] },
  { title:'你最大的出门阻力是什么？', options:['怕尴尬','怕人多','怕太像相亲','怕聊不起来','地点太远','不知道来的人怎样'] },
];
export const qaSets = {
  basic:['最近一次让你觉得“做自己很舒服”的时刻是什么？','你理想中的周末，通常会怎么度过？','一段关系里，你最希望被怎样理解？'],
  extra:['你通常怎样表达在意？','什么样的聊天会让你放松？','你希望彼此保留怎样的空间？','你更看重稳定还是新鲜？','遇到分歧时你习惯怎么处理？','什么会让你愿意再见一个人？'],
};
const pics=['/assets/food.jpg','/assets/coffee.jpg','/assets/hike.jpg','/assets/art.jpg','/assets/sport.jpg','/assets/board.jpg'];
export const clubActivities: ClubActivity[] = [
 {id:'club-dinner',theme:'low',status:'成熟活动',title:'周五轻聊天晚餐局',tags:['低压力','少人数','怕尴尬'],description:'流程清楚的小桌轻餐，适合第一次低压力见面。',image:pics[0],date:'周五 · 19:30',location:'KIC / 大学路附近',people:'6-8人',fee:'¥89'},
 {id:'club-night',theme:'deep',status:'预活动',title:'深度对谈夜局',tags:['deep talk','价值观','不强相亲'],description:'围绕三个真实关系问题，先收集感兴趣人数。',image:pics[1],date:'周五 · 20:00',location:'大学路合作空间',people:'6人',fee:'¥69'},
 {id:'club-walk',theme:'walk',status:'成熟活动',title:'我们向月亮走去 · 周五散步局',tags:['散步','轻社交','低压力'],description:'城市散步，5人成行，走到哪聊到哪。',image:pics[2],date:'周六 · 19:00',location:'江湾体育场出发',people:'5人成行',fee:'免费'},
 {id:'club-workshop',theme:'workshop',status:'预活动',title:'关系说明书工作坊',tags:['关系模式','工作坊','慢了解'],description:'通过关系说明书练习表达自己的靠近方式。',image:pics[3],date:'周六 · 14:00',location:'大学路',people:'10人',fee:'¥99'},
 {id:'club-lunch',theme:'low',status:'成熟活动',title:'午间同频小桌',tags:['附近','午间','低压力'],description:'一小时，一顿饭的时间，认识附近的人。',image:pics[0],date:'周三 · 12:30',location:'静安寺附近',people:'4人',fee:'¥59'},
 {id:'club-exhibit',theme:'other',status:'成熟活动',title:'周末看展 + 咖啡',tags:['看展','轻社交','文艺'],description:'一起看展，看完随便聊聊。',image:pics[3],date:'周日 · 15:00',location:'西岸美术馆',people:'6人',fee:'¥79'},
 {id:'club-poem',theme:'deep',status:'预活动',title:'阳台夜话 · 诗集共读',tags:['文艺','慢聊','少人数'],description:'5人小局，读诗也读自己。',image:pics[1],date:'周四 · 19:30',location:'安福路',people:'5人',fee:'¥49'},
 {id:'club-ride',theme:'walk',status:'预活动',title:'滨江骑行轻食局',tags:['户外','骑行','轻运动'],description:'不比赛，慢慢骑，累了就喝咖啡。',image:pics[4],date:'周六 · 09:30',location:'滨江',people:'8人',fee:'¥109'},
];
export const seedNeeds: Need[] = [
 {id:'d1',author:'林 · 2小时前',subtitle:'正在寻找低压力的认识方式',tags:['想认识靠谱的人','少人数'],title:'不想尴尬交换微信，但想认真认识人',copy:'如果有一个中间场域，我会更愿意出来。先轻松认识，不急着定义关系。',image:pics[1],resonance:72,comments:38,response:'主理人正在准备低压力小桌局',similar:true},
 {id:'d2',author:'Mei · 昨天',subtitle:'想重新感受到关系里的松弛',tags:['关系困惑','慢慢了解'],title:'不是不想恋爱，是越来越难进入关系',copy:'希望有一场聊“心动变难”的局，不急着定义关系。',image:pics[4],resonance:45,comments:22,response:'关系主题预活动准备中'},
 {id:'d3',author:'阿南 · 3天前',subtitle:'想找到能认真聊天的同频朋友',tags:['deep talk','价值观'],title:'想找能聊价值观的人，而不是只聊工作',copy:'6个人的小型夜谈，可能比一场大活动更适合认真认识。',image:pics[5],resonance:28,comments:8,response:'深度对谈预活动收集中'},
 {id:'d4',author:'小满 · 6小时前',subtitle:'住同一片，却从没聊过天',tags:['附近','周末','散步'],title:'周末想找同小区附近的人，一起散步遛狗',copy:'住得近，却从没好好说过话。想先从散步开始认识。',image:pics[2],resonance:33,comments:12,response:'散步局已有3人感兴趣',similar:true},
 {id:'d5',author:'圆圆 · 昨天',subtitle:'怕尴尬、想慢慢来',tags:['怕尴尬','少人数'],title:'第一次见面能不能不交换微信',copy:'先认识，不急着留联系方式，舒服了再交换。',image:pics[1],resonance:51,comments:20,response:'低压力小桌局回应中',similar:true},
 {id:'d6',author:'阿May · 今天',subtitle:'喜欢看展、慢节奏',tags:['看展','文艺','轻社交'],title:'想找人一起看展，然后随便聊聊',copy:'看完展不用硬聊，舒服就好。',image:pics[3],resonance:17,comments:5,response:'看展局已有2人报名'},
];
export const lifePosts: LifePost[] = [
 {id:'life-1',author:'小满',meta:'今天 · 杨浦',kind:'生活分享',text:'最近想找杨浦附近的朋友，周末一起散步或喝杯咖啡。先轻松认识，不急着定义关系。',images:[pics[0],pics[2]],tag:'#周末的一百种过法',comments:3,resonance:12},
 {id:'life-2',author:'Mei',meta:'昨天 · 关系想法',kind:'关系话题',text:'你觉得舒服的关系，是从心动开始，还是从相处不费力开始？',images:[pics[1],pics[3]],tag:'#关系里的松弛感',comments:12,resonance:24},
];
