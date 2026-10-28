export type Membership = {cohort_id:string;user_id:string;role:string;status:string};
export type Grant = {id:string;user_id:string;grant_type:string;source_type:string;expires_at:string|null;revoked_at:string|null;updated_at:string;metadata:Record<string,unknown>|null;modules:string[]|null;courses:string[]|null};
export type Order = {id:string;user_id:string;kind:string;status:string};
export const manualSources = ['manual_student_creation','admin_student_access'];
export function isManualMentoring(g: Grant) { return g.grant_type==='mentorship' && manualSources.includes(g.source_type) && g.metadata?.area==='mentoring'; }
export function grantActive(g: Grant, now=Date.now()) { return !g.revoked_at && (!g.expires_at || Date.parse(g.expires_at)>now); }
export function accessSummary(userId:string,members:Membership[],grants:Grant[],orders:Order[],now=Date.now()) {
 const own=grants.filter(g=>g.user_id===userId&&grantActive(g,now));
 return {
  formation:members.some(m=>m.user_id===userId&&['active','completed'].includes(m.status)),
  mentoring:own.some(isManualMentoring)||orders.some(o=>o.user_id===userId&&o.kind==='mentoring'&&['paid','completed'].includes(o.status)),
  legacyGrants:own.filter(g=>!isManualMentoring(g)).length,
 };
}

export function grantRevision(g:Grant){return {updated_at:g.updated_at,metadata:g.metadata,expires_at:g.expires_at,revoked_at:g.revoked_at};}
