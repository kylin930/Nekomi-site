"""AXE_PATH=/path/to/axe.min.js python3 tests/accessibility.py [site-root]
axe-core is a test tool only; install it separately with its npm integrity checks.
"""
import asyncio,json,os,sys
from pathlib import Path
from playwright.async_api import async_playwright
URL=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4321/').rstrip('/')+'/'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  output=[]
  for mode,width,height in [('light',1440,1000),('dark',1440,1000),('light',390,844),('dark',390,844)]:
   page=await b.new_page(viewport={'width':width,'height':height},color_scheme=mode)
   for route in ['','features/','docs/','docs/markdown/','docs/configuration/','demo/','faq/','changelog/']:
    await page.goto(URL+route,wait_until='networkidle')
    await page.add_script_tag(path=os.environ['AXE_PATH'])
    result=await page.evaluate('axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})')
    issues=[{'id':v['id'],'impact':v['impact'],'nodes':[n['target'] for n in v['nodes']]} for v in result['violations']]
    output.append({'route':route,'mode':mode,'width':width,'issues':issues})
   await page.close()
  dest=Path('test-results');dest.mkdir(exist_ok=True)
  (dest/'accessibility.json').write_text(json.dumps(output,ensure_ascii=False,indent=2))
  failures=[x for x in output if x['issues']]
  print(json.dumps({'scans':len(output),'failures':failures},ensure_ascii=False,indent=2))
  await b.close()
  if failures:sys.exit(1)
asyncio.run(main())
