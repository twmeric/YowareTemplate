(() => {
  function setNativeValue(element, value) {
    let proto = element.constructor.prototype;
    let descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (!descriptor || !descriptor.set) return false;
    descriptor.set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  const map = [
    { sel: 'input[type="text"]', val: '餐飲' },
    { sel: 'textarea[placeholder*="品牌名稱"]', val: '日出咖啡 Sunrise Brew' },
    { sel: 'textarea[placeholder*="品牌語調"]', val: '溫馨、專業、社區感' },
    { sel: 'textarea[placeholder*="風格要求"]', val: '簡約、溫暖、現代' },
    { sel: 'select', val: '繁體中文' }
  ];
  const results = [];
  map.forEach(({ sel, val }) => {
    const el = document.querySelector(sel);
    if (el) {
      const ok = setNativeValue(el, val);
      results.push({ sel, ok, tag: el.tagName, codes: Array.from(el.value).slice(0,2).map(c => c.charCodeAt(0)) });
    } else {
      results.push({ sel, found: false });
    }
  });
  return results;
})()
