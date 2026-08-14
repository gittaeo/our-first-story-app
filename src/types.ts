export type RecordType='daily'|'checkup'|'movement'|'letter';
export type Emotion='행복'|'설렘'|'감동'|'걱정'|'피곤';
export type Stage='pregnant'|'born';
export interface StoryPhoto {id:string;dataUrl:string;name:string;fit?:'auto'|'cover'|'contain';aspect?:number;height?:number;}
export interface StickerInstance {id:string;stickerId:string;x:number;y:number;scale:number;rotation:number;zIndex:number;createdBy:'엄마'|'배우자';}
export interface StoryRecord {id:string;type:RecordType;title:string;body:string;emotion:Emotion;date:string;time?:string;weekOrAge:string;author:'엄마'|'배우자';milestone?:string;createdAt:number;color?:string;photos?:StoryPhoto[];stickers?:StickerInstance[];}
export interface Profile {babyName:string;stage:Stage;date:string;pregnancyDate?:string;momName:string;partnerName:string;}
export interface GrowthStory {id:string;milestone:string;title:string;story:string;sourceRecordIds:string[];createdAt:number;status:'완성';}
