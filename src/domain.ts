import type {Emotion,StoryPhoto,StoryRecord} from './types';
export const emotions:Emotion[]=['행복','설렘','감동','걱정','피곤'];
export function calculateWeek(due:string,now=new Date()){const dueDate=new Date(due+'T00:00:00');const conception=new Date(dueDate);conception.setDate(conception.getDate()-280);const days=Math.max(0,Math.floor((now.getTime()-conception.getTime())/86400000));return `${Math.min(40,Math.floor(days/7))}주 ${days%7}일`;}
export function calculateAge(birth:string,now=new Date()){const b=new Date(birth+'T00:00:00');let m=(now.getFullYear()-b.getFullYear())*12+now.getMonth()-b.getMonth();if(now.getDate()<b.getDate())m--;return `${Math.max(0,m)}개월`;}
export function dateDifference(from:string,to:string){
  const start=new Date(from+'T00:00:00');const end=new Date(to+'T00:00:00');
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))return 0;
  return Math.floor((Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000);
}
export function calculateProgress(stage:'pregnant'|'born',date:string,now=new Date(),pregnancyDate=''){
  const target=new Date(date+'T00:00:00');
  if(Number.isNaN(target.getTime()))return{chip:'날짜 미설정',days:0,caption:'날짜를 설정해주세요',week:0};
  if(stage==='born'){
    const days=Math.max(0,Math.floor((now.getTime()-target.getTime())/86400000)+1);
    return{chip:calculateAge(date,now),days,caption:'태어난 지',week:0};
  }
  const todayString=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const remaining=Math.max(0,dateDifference(todayString,date));
  const elapsed=pregnancyDate?Math.max(0,dateDifference(pregnancyDate,todayString)):0;
  return{chip:calculateWeek(date,now),days:elapsed,remainingDays:remaining,caption:'우리에게 온 지',week:Math.min(40,Math.floor(elapsed/7))};
}
export function validateRecord(body:string,emotion?:Emotion){return{body:body.trim()?'':'오늘의 이야기를 적어주세요',emotion:emotion?'':'오늘의 감정을 선택해주세요'};}
export function filterRecords(records:StoryRecord[],types:string[],ems:string[]){return records.filter(r=>(!types.length||types.includes(r.type))&&(!ems.length||ems.includes(r.emotion)));}
export function canAddPhoto(count:number){return count<5;}
export async function compressPhoto(file:File,max=900,quality=.68){const url=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file)});const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});const ratio=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',quality)}
export async function analyzePhoto(dataUrl:string){const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=dataUrl});const aspect=img.width/img.height;const fit:StoryPhoto['fit']=aspect<.78||aspect>1.75?'contain':'cover';const height=aspect<.72?420:aspect>1.65?250:320;return{aspect,fit,height}}
