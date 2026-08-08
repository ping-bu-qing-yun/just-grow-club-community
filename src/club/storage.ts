import type { ClubState } from './types';
export const CLUB_STORAGE_KEY='qiahao-club-state-v1';
export const defaultClubState: ClubState={onboardingComplete:false,onboardingStep:0,lightAnswers:[[],[],[]],qaAnswers:{},profile:{nickname:'小恰',birthDate:'1997-08-12',gender:'女',education:'本科',occupation:'品牌策划',height:'165cm',city:'上海 杨浦区',hometown:'中国',relationship:'正在寻觅',bio:'我喜欢有趣但不吵闹的活动，也希望在自然的相处里慢慢认识一个人。',tags:['喜欢深聊','周末散步','慢热'],preferences:['喝杯咖啡','看展','户外运动']},savedNeedIds:[],resonatedNeedIds:[],publishedNeeds:[]};
export function readClubState():ClubState{try{const raw=localStorage.getItem(CLUB_STORAGE_KEY);return raw?{...defaultClubState,...JSON.parse(raw)}:defaultClubState}catch{return defaultClubState}}
export function writeClubState(state:ClubState){try{localStorage.setItem(CLUB_STORAGE_KEY,JSON.stringify(state))}catch{}}
