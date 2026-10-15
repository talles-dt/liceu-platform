import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurriculum} from '../../lib/formation/curriculum.ts';
const path=process.argv[2]??'content/formations/trivium/releases/0.1.0.json';
const content=validateCurriculum(JSON.parse(readFileSync(path,'utf8')),process.argv.includes('--publication'));
console.log(JSON.stringify({valid:true,version:content.version,status:content.editorial_status,cycles:content.cycles.length,hash:createHash('sha256').update(JSON.stringify(content)).digest('hex')},null,2));
