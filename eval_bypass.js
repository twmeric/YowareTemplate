(() => {
  const inputs = Array.from(document.querySelectorAll('input'));
  const bypass = inputs.find(i => i.placeholder && i.placeholder.includes('360')) || inputs.find(i => i.value === '' && i.type === 'text');
  if (!bypass) return { error: 'bypass input not found', inputs: inputs.slice(0,5).map(i => ({placeholder: i.placeholder, type: i.type, className: i.className.slice(0,50)})) };
  bypass.value = '360';
  bypass.dispatchEvent(new Event('input', { bubbles: true }));
  bypass.dispatchEvent(new Event('change', { bubbles: true }));
  return { found: true, value: bypass.value, placeholder: bypass.placeholder };
})()
