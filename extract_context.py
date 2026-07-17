text = open('E:/Projects/YowareTemplate/app_js_utf8.js', 'r', encoding='utf-8').read()
idx = text.find('$n=P=>')
start = idx
end = idx + 1500
with open('E:/Projects/YowareTemplate/field_renderer.txt', 'w', encoding='utf-8') as f:
    f.write(text[start:end])
print(f'Wrote {end-start} chars')
