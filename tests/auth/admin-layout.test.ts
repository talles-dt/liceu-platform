import {beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
const m=vi.hoisted(()=>({user:vi.fn(),admin:vi.fn(),redirect:vi.fn((path:string)=>{throw Error(`redirect:${path}`);})}));
vi.mock('@/lib/supabaseServer',()=>({getCurrentUser:m.user}));
vi.mock('@/lib/admin/auth',()=>({assertAdmin:m.admin}));
vi.mock('next/navigation',()=>({redirect:m.redirect}));
vi.mock('next/headers',()=>({headers:async()=>new Headers({'x-pathname':'/admin'})}));
import AdminLayout from '@/app/admin/layout';
beforeEach(()=>{vi.clearAllMocks();m.user.mockResolvedValue({id:'qa',email:'qa@example.invalid'});m.admin.mockResolvedValue(null);});
it('explains denied admin access without sending authenticated users to the public home',async()=>{
 const html=renderToStaticMarkup(await AdminLayout({children:'sensitive-admin-content'}));
 expect(html).toContain('Acesso administrativo não disponível');
 expect(html).not.toContain('sensitive-admin-content');
 expect(m.redirect).not.toHaveBeenCalled();
});
it('still requires authentication',async()=>{
 m.user.mockResolvedValue(null);
 await expect(AdminLayout({children:'sensitive-admin-content'})).rejects.toThrow('redirect:/login');
});
it('renders admin content only with verified authorization',async()=>{
 m.admin.mockResolvedValue({id:'qa'});
 expect(renderToStaticMarkup(await AdminLayout({children:'sensitive-admin-content'}))).toContain('sensitive-admin-content');
});
