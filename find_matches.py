import re

text = open('E:/Projects/YowareTemplate/app_js.txt', 'r', encoding='utf-8').read()

# Search for route/template identifiers and form step patterns
patterns = ['landing-v1', 'Start', 'Wizard', 'step', 'currentStep', 'setCurrentStep', 'confirm', 'submit', 'generate', 'orders']

with open('E:/Projects/YowareTemplate/matches2.txt', 'w', encoding='utf-8') as f:
    for pat in patterns:
        matches = list(re.finditer(re.escape(pat), text, re.IGNORECASE))
        f.write(f'=== Pattern: {pat} ({len(matches)} matches) ===\n')
        for m in matches[:8]:
            start = max(0, m.start()-300)
            end = min(len(text), m.end()+300)
            f.write(f'--- Match at {m.start()} ---\n')
            f.write(text[start:end])
            f.write('\n\n')

print('Saved matches2.txt')
