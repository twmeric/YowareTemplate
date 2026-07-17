(() => {
  const map = [
    { sel: 'input[placeholder*="例如"]', val: '餐飲' },
    { sel: 'textarea[placeholder*="品牌名稱"]', val: '日出咖啡 Sunrise Brew' },
    { sel: 'textarea[placeholder*="品牌語調"]', val: '溫馨、專業、社區感' },
    { sel: 'textarea[placeholder*="風格要求"]', val: '簡約、溫暖、現代' },
    { sel: 'select', val: '繁體中文' }
  ];
  const results = [];
  map.forEach(({ sel, val }) => {
    const el = document.querySelector(sel);
    if (el) {
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
      results.push({ tag: el.tagName, codes: Array.from(el.value).slice(0,2).map(c => c.charCodeAt(0)) });
    } else {
      results.push({ sel, found: false });
    }
  });
  return results;
})()
