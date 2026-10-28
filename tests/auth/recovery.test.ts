// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ verifyOtp: vi.fn(), getSession: vi.fn(), exchangeCodeForSession: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ createSupabaseBrowserClient: () => ({ auth }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock('@/components/ReadingLayout', () => ({ ReadingLayout: ({ children }: { children: unknown }) => children }));
import ResetPasswordLogic from '@/app/reset-password/ResetPasswordLogic';
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
  window.history.replaceState({}, '', '/reset-password');
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
describe('recovery confirmation', () => {
  it('opening a link does not consume it; explicit confirmation verifies recovery', async () => {
    window.location.hash = 'recovery_token=synthetic-hash';
    auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    await act(async () => root.render(createElement(ResetPasswordLogic)));
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
    expect(container.textContent).toContain('Continuar recuperação');
    await act(async () => container.querySelector('button')!.click());
    expect(auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'synthetic-hash', type: 'recovery' });
    expect(container.textContent).toContain('Confirmar senha');
  });
  it('an expired token offers a new link and never displays the password form', async () => {
    window.location.hash = 'recovery_token=expired';
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'Expired link' } });
    await act(async () => root.render(createElement(ResetPasswordLogic)));
    await act(async () => container.querySelector('button')!.click());
    expect(container.textContent).toContain('Solicitar novo link');
    expect(container.querySelector('input[type=password]')).toBeNull();
  });
  it('legacy expired redirects offer a new link and clear the URL', async () => {
    window.location.hash = 'error=access_denied&error_description=Expired+link';
    await act(async () => root.render(createElement(ResetPasswordLogic)));
    expect(container.textContent).toContain('Solicitar novo link');
    expect(container.querySelector('input[type=password]')).toBeNull();
    expect(window.location.hash).toBe('');
  });
});
