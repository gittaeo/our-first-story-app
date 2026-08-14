import {createClient, type User} from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
export const backendEnabled=Boolean(url&&key);
export const supabase=backendEnabled?createClient(url!,key!):null;
export type AuthUser=User;

export function observeAuth(callback:(user:User|null)=>void){
  if(!supabase){callback(null);return()=>undefined;}
  supabase.auth.getUser().then(({data})=>callback(data.user));
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>callback(session?.user??null));
  return()=>data.subscription.unsubscribe();
}
export async function loginWithProvider(provider:'google'|'kakao'){
  if(!supabase)throw new Error('Supabase 연결이 필요합니다.');
  sessionStorage.setItem('our-first-story-post-auth', window.location.hash.slice(1) || '/timeline');
  const redirectTo=`${window.location.origin}${import.meta.env.BASE_URL}`;
  const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo}});
  if(error)throw error;
}
export async function createWorkspaceRemote(input:{babyName:string;stage:'pregnant'|'born';date:string;displayName:string}){
  if(!supabase)throw new Error('Supabase 연결이 필요합니다.');
  const {data,error}=await supabase.rpc('create_family_workspace',{p_baby_name:input.babyName,p_stage:input.stage,p_date:input.date,p_display_name:input.displayName});
  if(error)throw error;return{workspaceId:String(data)};
}
export async function createInviteRemote(workspaceId:string){
  if(!supabase)throw new Error('Supabase 연결이 필요합니다.');
  const {data,error}=await supabase.rpc('create_family_invite',{p_workspace_id:workspaceId});
  if(error)throw error;const row=Array.isArray(data)?data[0]:data;
  return{token:String(row.token),pin:String(row.pin),expiresAt:String(row.expires_at)};
}
export async function joinWorkspaceRemote(input:{token:string;pin:string;displayName:string}){
  if(!supabase)throw new Error('Supabase 연결이 필요합니다.');
  const {data,error}=await supabase.rpc('accept_family_invite',{p_token:input.token,p_pin:input.pin,p_display_name:input.displayName});
  if(error)throw error;return{workspaceId:String(data)};
}
