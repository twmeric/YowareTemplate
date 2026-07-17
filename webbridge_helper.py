import requests, json, time

def call(action, args):
    url = 'http://127.0.0.1:10086/command'
    payload = {'action': action, 'args': args, 'session': 'quickpage-debug'}
    r = requests.post(url, json=payload)
    return r.json()

# Check current state and look for any error text
js = r"""
(() => {
  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  const allText = Array.from(document.querySelectorAll('p, span, div')).filter(el => {
    const text = el.textContent.trim();
    return text.includes('請輸入') || text.includes('必填') || text.includes('有效') || text.includes('錯誤');
  }).map(el => ({tag: el.tagName, text: el.textContent.trim().slice(0, 200), class: el.className}));
  return {
    url: window.location.href,
    buttonText: Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('送出'))?.textContent.trim(),
    buttonDisabled: Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('送出'))?.disabled,
    inputs: inputs.map(el => ({type: el.type || el.tagName, value: el.value, placeholder: el.placeholder})),
    errorLikeText: allText
  };
})()
"""
print("=== CURRENT STATE ===")
print(json.dumps(call('evaluate', {'code': js}), ensure_ascii=False, indent=2))

# Network
print("\n=== NETWORK ===")
print(json.dumps(call('network', {'cmd': 'list'}), ensure_ascii=False, indent=2))
