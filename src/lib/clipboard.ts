/** Clipboard an toàn cho mọi ngữ cảnh.
 *
 * navigator.clipboard chỉ tồn tại trên secure context (HTTPS / localhost).
 * App thường được truy cập qua http://<ip>:8090 → phải có fallback
 * textarea ẩn + execCommand để nút "chép" vẫn hoạt động.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // rơi xuống fallback bên dưới
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}
