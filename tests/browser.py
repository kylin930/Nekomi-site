"""Run against a built HTTP site. pip install playwright; use an installed Chromium.
BROWSER_PATH=/usr/bin/chromium python3 tests/browser.py http://127.0.0.1:4321/
"""
import asyncio,json,os,sys
from pathlib import Path
from playwright.async_api import async_playwright
URL=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4321/').rstrip('/')+'/'
OUT=Path('test-results');OUT.mkdir(exist_ok=True)
checks=[];errors=[]
def check(value,name):
 if not value:raise AssertionError(name)
 checks.append(name)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  context=await b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
  page=await context.new_page();page.on('pageerror',lambda e:errors.append({'message':str(e),'stack':e.stack,'url':page.url}))
  routes=['','features/','demo/','docs/','docs/getting-started/','docs/configuration/','docs/markdown/','docs/comments/','changelog/','faq/']
  for width,height in [(1440,1000),(768,1024),(390,844),(320,700)]:
   await page.set_viewport_size({'width':width,'height':height})
   for route in routes:
    response=await page.goto(URL+route,wait_until='networkidle')
    check(response.status==200,f'{width} {route or "home"}: HTTP 200')
    check(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width} {route or "home"}: no overflow')
    check(await page.locator('h1').count()==1,f'{width} {route or "home"}: one h1')
    check(await page.locator('img').evaluate_all('(images)=>images.filter(i=>i.getBoundingClientRect().top<innerHeight).every(i=>i.complete&&i.naturalWidth>0)'),f'{width} {route or "home"}: visible images valid')
  await page.set_viewport_size({'width':1440,'height':1000});await page.goto(URL+'demo/',wait_until='networkidle')
  for preset in ['default','fresh','minimal']:
   await page.locator('[data-preset="'+preset+'"]').click()
   for mobile in [False,True]:
    if mobile:await page.locator('[data-shot-device]').click()
    for dark in [False,True]:
     if dark:await page.locator('[data-shot-mode]').click()
     await page.wait_for_function('document.querySelector("[data-shot]").complete')
     expected=f'p30-{preset}-home-{"dark" if dark else "light"}-{"390" if mobile else "1440"}.png'
     check((await page.locator('[data-shot]').get_attribute('src')).endswith(expected),f'screenshot {expected}')
     check(await page.locator('[data-shot]').evaluate('(i)=>i.naturalWidth>0'),f'loaded {expected}')
     if dark:await page.locator('[data-shot-mode]').click()
    if mobile:await page.locator('[data-shot-device]').click()
  await page.select_option('[data-theme-select]','dark');await page.goto(URL+'docs/markdown/',wait_until='networkidle')
  check(await page.locator('html').get_attribute('data-theme')=='dark','theme persists across navigation')
  await page.screenshot(path=str(OUT/'docs-dark.png'))
  await page.select_option('[data-theme-select]','system');await page.emulate_media(color_scheme='dark');await page.wait_for_function('document.documentElement.dataset.theme==="dark"')
  check(await page.locator('html').get_attribute('data-theme')=='dark','follows dark OS')
  await page.emulate_media(color_scheme='light');await page.wait_for_timeout(50)
  check(await page.locator('html').get_attribute('data-theme')=='light','follows light OS')
  await page.keyboard.press('Control+k');await page.fill('#search-input','壁纸')
  await page.wait_for_selector('#search-results a')
  check(await page.locator('#search-results a').count()>0,'Chinese search results')
  await page.keyboard.press('ArrowDown');check(await page.evaluate('document.activeElement.closest("#search-results")!==null'),'keyboard result selection')
  async with page.expect_navigation(wait_until='networkidle'):
   await page.keyboard.press('Enter')
  check('docs/' in page.url,'search navigates to document')
  if '#' in page.url:
   check(await page.evaluate('!!document.getElementById(decodeURIComponent(location.hash.slice(1)))'),'search fragment resolves')
  await page.go_back(wait_until='networkidle');check('/docs/markdown/' in page.url,'browser back restores document')
  await page.keyboard.press('Control+k');await page.fill('#search-input','zzzz不存在的词')
  await page.wait_for_timeout(150);check(await page.locator('#search-results a').count()==0,'search empty state')
  check('没有找到' in await page.locator('#search-status').inner_text(),'search empty feedback')
  await page.keyboard.press('Escape');await page.wait_for_function('!document.querySelector("#doc-search").open');check(not await page.locator('#doc-search').evaluate('(d)=>d.open'),'Escape closes search')
  # Fresh document and rejected index request: opening again must offer a working retry.
  await page.goto(URL+'docs/markdown/',wait_until='networkidle')
  await page.route('**/search-index.json',lambda r:r.abort())
  await page.keyboard.press('Control+k');await page.fill('#search-input','评论');await page.wait_for_timeout(200)
  check('失败' in await page.locator('#search-status').inner_text(),'search failure feedback')
  await page.unroute('**/search-index.json');await page.fill('#search-input','Giscus');await page.wait_for_selector('#search-results a')
  check(await page.locator('#search-results a').count()>0,'search retry succeeds');await page.keyboard.press('Escape')
  code=await page.locator('.prose pre code').first.text_content()
  await page.locator('.copy-code').first.click()
  check(await page.evaluate('navigator.clipboard.readText()')==code,'copies exact code without button text')
  await page.locator('.doc-pagination a').last.click();await page.wait_for_load_state('networkidle')
  check('/docs/images/' in page.url,'next document navigation')
  await page.set_viewport_size({'width':390,'height':844});await page.goto(URL+'docs/markdown/',wait_until='networkidle')
  check(not await page.locator('.docs-nav-details').evaluate('(d)=>d.open'),'mobile docs navigation starts collapsed')
  await page.locator('.docs-nav-details summary').click();check(await page.locator('.docs-nav-details nav').is_visible(),'mobile docs menu opens')
  await page.locator('[data-menu-toggle]').click();check(await page.locator('#mobile-menu').is_visible(),'mobile main menu opens')
  await page.keyboard.press('Escape');check(not await page.locator('#mobile-menu').is_visible(),'Escape closes mobile menu')
  await page.locator('.docs-nav-details summary').click();await page.locator('.mobile-toc summary').click()
  await page.locator('.mobile-toc a').filter(has_text='数学公式').first.click()
  check(await page.locator('#数学公式').evaluate('(e)=>e.getBoundingClientRect().top>=65'),'anchor clears sticky header')
  await page.emulate_media(reduced_motion='reduce');await page.evaluate('scrollTo(0,document.body.scrollHeight)');await page.wait_for_timeout(100)
  await page.locator('[data-back-top]').click();await page.wait_for_timeout(80)
  check(await page.evaluate('scrollY')==0,'reduced-motion back to top immediate')
  await page.goto(URL+'faq/',wait_until='networkidle');await page.locator('.faq-list summary').first.click()
  check(await page.locator('.faq-list details').first.evaluate('(d)=>d.open'),'FAQ works with native details')
  await page.goto(URL,wait_until='networkidle');await page.screenshot(path=str(OUT/'home-mobile.png'),full_page=True)
  await page.set_viewport_size({'width':1440,'height':1000});await page.goto(URL,wait_until='networkidle');await page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
  await page.select_option('[data-theme-select]','dark');await page.screenshot(path=str(OUT/'home-dark.png'))
  # Static pages and links remain usable without JavaScript.
  nojs=await b.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
  static=await nojs.new_page();await static.goto(URL+'docs/configuration/',wait_until='networkidle')
  check(await static.locator('.prose table').count()>0,'configuration table rendered without JS')
  check(await static.evaluate('document.documentElement.scrollWidth<=innerWidth'),'no horizontal page overflow without JS')
  check(await static.locator('.prose').inner_text()!='','docs readable without JS')
  await static.goto(URL+'faq/');await static.locator('.faq-list summary').first.click()
  check(await static.locator('.faq-list details').first.evaluate('(d)=>d.open'),'FAQ usable without JS')
  if errors:
   (OUT/'browser-failure.json').write_text(json.dumps({'pageErrors':errors},ensure_ascii=False,indent=2))
   print(json.dumps({'pageErrors':errors},ensure_ascii=False))
  check(not errors,'no browser page errors')
  result={'passed':len(checks),'checks':checks,'pageErrors':errors,'url':URL}
  (OUT/'browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'passed':len(checks),'pageErrors':errors,'url':URL}))
  await b.close()
asyncio.run(main())
