import requests
url = 'https://quickpage.jkdcoding.com/assets/index-C46ERFHq.js'
r = requests.get(url)
print(f'Status: {r.status_code}, Encoding: {r.encoding}, Length: {len(r.content)}')
# Save as binary
with open('E:/Projects/YowareTemplate/app_js_binary.js', 'wb') as f:
    f.write(r.content)
# Decode as UTF-8
text = r.content.decode('utf-8')
with open('E:/Projects/YowareTemplate/app_js_utf8.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Saved both binary and utf8 versions')
# Search for Chinese strings
for s in ['確認送出', '送出中', '確認與送出', 'AI 正在生成']:
    idx = text.find(s)
    print(f'{s}: {idx}')
