"""Downloads the latin subsets of Inter (variable) and Russo One into web/public/fonts/."""
import re
import urllib.request

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read()


def latin_url(css_url):
    css = get(css_url).decode()
    blocks = re.findall(r'/\* (\S+) \*/\s*@font-face \{(.*?)\}', css, re.S)
    for subset, body in blocks:
        if subset == 'latin':
            return re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
    raise SystemExit('no latin subset in ' + css_url)


for css_url, out in [
    ('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap', 'web/public/fonts/Inter-var.woff2'),
    ('https://fonts.googleapis.com/css2?family=Russo+One&display=swap', 'web/public/fonts/RussoOne-400.woff2'),
]:
    data = get(latin_url(css_url))
    open(out, 'wb').write(data)
    print(out, len(data), 'bytes')
