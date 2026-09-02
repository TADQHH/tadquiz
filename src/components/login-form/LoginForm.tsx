import { useState, type SyntheticEvent } from 'react';

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/admin';
}

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Đăng nhập thất bại.');
        return;
      }
      location.href = safeNext(new URLSearchParams(location.search).get('next'));
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4 sm:space-y-5" onSubmit={(event) => void onSubmit(event)} aria-busy={busy}>
      <label className="block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Tên đăng nhập
        </span>
        <input
          className="input-box min-h-11 text-base sm:text-sm"
          name="username"
          placeholder="admin"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Mật khẩu
        </span>
        <input
          className="input-box min-h-11 text-base sm:text-sm"
          type="password"
          placeholder="••••••••"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? (
        <div className="rounded-[var(--radius)] border border-[var(--tad-red)] bg-[color-mix(in_srgb,var(--tad-red)_10%,var(--card))] p-3">
          <p className="field-error m-0 text-xs font-bold" role="alert">
            {error}
          </p>
        </div>
      ) : null}
      <button type="submit" className="btn-primary min-h-12 w-full text-xs font-bold sm:text-sm" disabled={busy}>
        {busy ? 'Đang đăng nhập…' : 'Đăng nhập vào hệ thống'}
      </button>
    </form>
  );
}
