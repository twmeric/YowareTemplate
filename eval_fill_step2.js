(() => {
  const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
  inputs.forEach((input, idx) => {
    if (input.type === 'hidden' || input.disabled) return;
    if (input.tagName === 'SELECT') {
      input.value = input.options[1] ? input.options[1].value : input.value;
    } else if (input.tagName === 'TEXTAREA') {
      input.value = '測試描述 ' + idx;
    } else {
      const label = input.placeholder || input.name || 'field';
      if (label.includes('行業') || label.includes('industry')) input.value = '餐飲';
      else if (label.includes('品牌名稱') || label.includes('brandName')) input.value = '測試品牌';
      else if (label.includes('調性') || label.includes('tone')) input.value = '溫暖、專業';
      else if (label.includes('風格') || label.includes('style')) input.value = '簡約現代';
      else if (label.includes('語言') || label.includes('language')) input.value = '繁體中文';
      else input.value = '測試 ' + label;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  return { filled: inputs.length };
})()
