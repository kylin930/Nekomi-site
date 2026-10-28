"""Validate static output: local targets, fragments, unique IDs, assets and metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import sys,json
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist')
base=sys.argv[2] if len(sys.argv)>2 else '/'
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__();self.path=path;self.ids=[];self.links=[];self.h1=0;self.title=False;self.desc=False
  self.feed(path.read_text())
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='title':self.title=True
  if tag=='meta' and a.get('name')=='description':self.desc=True
  for attr in (['href'] if tag in ['a','link'] else ['src'] if tag in ['img','script'] else []):
   if a.get(attr):self.links.append(a[attr])
pages={p:Page(p) for p in root.rglob('*.html')};errors=[];checked=0
for path,page in pages.items():
 if len(page.ids)!=len(set(page.ids)):errors.append(f'{path}: duplicate IDs')
 if page.h1!=1:errors.append(f'{path}: h1 count {page.h1}')
 if not page.title or not page.desc:errors.append(f'{path}: missing title/description')
 for href in page.links:
  url=urlsplit(href)
  if url.scheme or url.netloc:continue
  checked+=1
  if not url.path:target=path
  elif url.path.startswith('/'):
   if not url.path.startswith(base):errors.append(f'{path}: outside base: {href}');continue
   target=root/unquote(url.path[len(base):])
  else:target=path.parent/unquote(url.path)
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{path}: missing {href}');continue
  if url.fragment and target.suffix=='.html':
   dest=pages.get(target) or Page(target)
   if unquote(url.fragment) not in dest.ids:errors.append(f'{path}: missing fragment {href}')
print(json.dumps({'pages':len(pages),'references':checked,'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
