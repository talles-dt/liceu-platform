import {afterEach,describe,it,expect,vi} from 'vitest';
import {sameOrigin} from '@/lib/formation/server';
afterEach(()=>vi.unstubAllEnvs());
const request=(origin?:string,headers:Record<string,string>={})=>new Request('https://deployment.vercel.app/api/formations',{headers:{...(origin?{origin}:{}),...headers}});
describe('first-party request origins',()=>{
 it('allows both exact production domains regardless of the configured canonical domain',()=>{
  for(const configured of ['https://oliceu.com','https://www.oliceu.com/']){
   vi.stubEnv('NEXT_PUBLIC_SITE_URL',configured);
   for(const origin of ['https://oliceu.com','https://www.oliceu.com'])expect(sameOrigin(request(origin))).toBe(true);
  }
 });
 it('rejects external, insecure, malformed, missing and forged origins',()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://www.oliceu.com');
  for(const origin of [undefined,'null','https://foreign.invalid','https://www.oliceu.com.evil.invalid','https://evil.oliceu.com','http://oliceu.com','https://oliceu.com:8443','https://oliceu.com/path','https://oliceu.com@evil.invalid'])expect(sameOrigin(request(origin,{host:'www.oliceu.com','x-forwarded-host':'www.oliceu.com'}))).toBe(false);
 });
 it('keeps development and nonproduction origins exact',()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','http://localhost:3000');
  expect(sameOrigin(request('http://localhost:3000'))).toBe(true);
  for(const origin of ['http://localhost:3001','https://www.oliceu.com','https://deployment.vercel.app'])expect(sameOrigin(request(origin))).toBe(false);
 });
 it('fails closed on malformed configuration and uses request URL only when unconfigured',()=>{
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','broken');expect(sameOrigin(request('https://oliceu.com'))).toBe(false);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL','');expect(sameOrigin(request('https://deployment.vercel.app'))).toBe(true);
 });
});
