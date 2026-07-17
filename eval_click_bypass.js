(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '跳過驗證');
  if (!btn) return { error: 'bypass button not found' };
  btn.click();
  return { clicked: true, text: btn.textContent.trim() };
})()
