import {describe,it,expect} from "vitest";
import source from "../../content/formations/trivium/releases/0.1.0.json";
import {validateCurriculum} from "@/lib/formation/curriculum";
const fresh=()=>structuredClone(source);
describe("Trivium publication gates",()=>{
 it("validates six draft cycles",()=>expect(validateCurriculum(fresh()).cycles).toHaveLength(6));
 it("refuses to publish an unreviewed curriculum",()=>expect(()=>validateCurriculum(fresh(),true)).toThrow("aprovação"));
 it("does not mistake pillar tags for evidence",()=>{const x=fresh();x.cycles[0].activities.forEach(a=>{a.competency_keys=a.competency_keys.filter(k=>!k.startsWith('logic'));});expect(()=>validateCurriculum(x)).toThrow("falta evidência e critério de logic");});
 it("rejects a missing pedagogical movement",()=>{const x=fresh();x.cycles[1].activities=x.cycles[1].activities.filter(a=>a.type!=="reflection");expect(()=>validateCurriculum(x)).toThrow("reflection ausente");});
 it("rejects dangling references and duplicate activity identities",()=>{const x=fresh();x.cycles[0].activities[0].rubric_key="missing";expect(()=>validateCurriculum(x)).toThrow("rubrica inexistente");x.cycles[0].activities[1].key=x.cycles[0].activities[0].key;expect(()=>validateCurriculum(x)).toThrow("chave duplicada");});
 it("requires readings for every cycle before publication",()=>{const x=fresh();x.editorial_status='approved';x.approval_note='Reviewed';x.readings[0].status='verified';expect(()=>validateCurriculum(x,true)).toThrow("bibliografia do ciclo ainda incompleta");});
 it("requires six roles for disputatio",()=>{const x=fresh();const a=x.cycles[0].activities.find(a=>a.type==='disputatio')!;a.roles.defensor=3;expect(()=>validateCurriculum(x)).toThrow("seis papéis");});
});
