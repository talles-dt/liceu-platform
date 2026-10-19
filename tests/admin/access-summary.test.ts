import {describe,it,expect} from 'vitest';
import {accessSummary,type Grant} from '@/lib/admin/access';
const grant:Grant={id:'g',user_id:'student',grant_type:'mentorship',source_type:'admin_student_access',metadata:{area:'mentoring'},expires_at:null,revoked_at:null,updated_at:'2026-01-01',modules:[],courses:[]};
describe('administrative access sources',()=>{
 it('counts manual mentoring with no legacy module ids',()=>expect(accessSummary('student',[],[grant],[]).mentoring).toBe(true));
 it('respects expiry, revocation, source and owner',()=>{for(const g of [{...grant,expires_at:'2025-01-01'},{...grant,revoked_at:'2026-01-01'},{...grant,source_type:'other'},{...grant,user_id:'someone'}])expect(accessSummary('student',[],[g],[],Date.parse('2026-01-01')).mentoring).toBe(false);});
 it('paid access survives revocation of a manual grant',()=>expect(accessSummary('student',[],[{...grant,revoked_at:'2026-01-01'}],[{id:'o',user_id:'student',kind:'mentoring',status:'paid'}]).mentoring).toBe(true));
 it('paused and withdrawn memberships do not grant cohort access',()=>{for(const status of ['paused','withdrawn'])expect(accessSummary('student',[{cohort_id:'c',user_id:'student',role:'participant',status}],[],[]).formation).toBe(false);});
 it('completed participants retain archive access',()=>expect(accessSummary('student',[{cohort_id:'c',user_id:'student',role:'participant',status:'completed'}],[],[]).formation).toBe(true));
});
