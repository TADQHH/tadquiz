import { useState } from 'react';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      location.href = '/admin/login';
    }
  }

  return (
    <button type="button" className="btn-ghost text-sm" disabled={busy} onClick={() => void logout()}>
      {busy ? 'Đang thoát…' : 'Đăng xuất'}
    </button>
  );
}
