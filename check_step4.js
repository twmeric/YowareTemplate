(() => {
  const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
  return inputs.map(el => ({
    tag: el.tagName,
    type: el.type,
    placeholder: el.placeholder,
    value: el.value,
    label: el.labels?.[0]?.textContent
  }));
})()
