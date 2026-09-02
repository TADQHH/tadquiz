/** Credential rules shared by the CLI script (and mirrored server-side at login). */

/**
 * @param {string} username
 * @returns {{ok:true} | {ok:false, error:string}}
 */
export function validateUsername(username) {
  if (typeof username !== 'string' || username.trim() === '') {
    return { ok: false, error: 'Thiếu tên đăng nhập.' };
  }
  const value = username.trim();
  if (value.length < 3 || value.length > 32) {
    return { ok: false, error: 'Tên đăng nhập dài 3–32 ký tự.' };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
    return { ok: false, error: 'Tên đăng nhập chỉ gồm a–z, 0–9 và _ . -' };
  }
  return { ok: true };
}

/**
 * @param {string} password
 * @returns {{ok:true} | {ok:false, error:string}}
 */
export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { ok: false, error: 'Mật khẩu cần tối thiểu 8 ký tự.' };
  }
  if (password.length > 200) {
    return { ok: false, error: 'Mật khẩu tối đa 200 ký tự.' };
  }
  return { ok: true };
}
