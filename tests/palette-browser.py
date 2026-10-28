"""Test the production preview against the bundled upstream theme (scripts/build-palette-oracle.mjs)."""
import asyncio,json,os,sys
from pathlib import Path
from playwright.async_api import async_playwright
URL=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4351/').rstrip('/')+'/'
OUT=Path('test-results/round2');OUT.mkdir(parents=True,exist_ok=True)
checks=[];configs=[];errors=[]
def check(value,label):
 if not value:raise AssertionError(label)
 checks.append(label)
async def tokens(frame):
 return await frame.evaluate('''Object.fromEntries(['primary','on-primary','primary-container','on-primary-container','secondary','on-secondary','secondary-container','on-secondary-container','surface','surface-container-low','surface-container-high','outline'].map(role=>[role,getComputedStyle(document.documentElement).getPropertyValue('--mdui-color-'+role).trim()]))''')
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  context=await b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'],color_scheme='light')
  page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(URL+'demo/#custom-colors',wait_until='networkidle');await page.wait_for_function('!document.querySelector("[data-lab-fields]").disabled')
  frame=page.frames[1];await frame.wait_for_function('document.documentElement.dataset.paletteReady==="true"')
  frame_token=await frame.evaluate('window.__unchangedDOM=document.querySelector(".preview-post");window.__unchangedDOM.dataset.testToken="retained";true')
  parent_state=await page.evaluate('({classes:document.documentElement.className,style:document.documentElement.getAttribute("style"),mode:document.documentElement.dataset.mode,palette:document.querySelector("style[id^=mdui-custom-color-scheme-]").textContent})')
  oracle=await context.new_page();await oracle.goto(URL+'preview/colors/',wait_until='networkidle');await oracle.add_script_tag(path=str(Path('test-results/oracle/oracle.js').resolve()))
  async def compare(color,secondary,mode):
   await page.fill('#lab-primary',color)
   if secondary:
    await page.check('#lab-use-secondary');await page.fill('#lab-secondary',secondary)
   else:await page.uncheck('#lab-use-secondary')
   await page.select_option('#lab-mode',mode)
   await frame.wait_for_function('(mode)=>document.documentElement.classList.contains("mdui-theme-"+mode)',arg=mode)
   await page.wait_for_timeout(40)
   config=json.loads(await page.locator('[data-palette-json]').text_content());configs.append(config)
   expected=await oracle.evaluate('(appearance)=>NekomiThemeOracle.read(appearance)',config['appearance'])
   actual=await tokens(frame)
   check(actual==expected,f'12 palette roles match actual Nekomi theme: {color}, {secondary or "auto"}, {mode}')
   check(await frame.evaluate('document.querySelectorAll("style[id^=mdui-custom-color-scheme-]").length')==1,'single preview palette style')
  for color,secondary,mode in [('#8064B1','','auto'),('#E69DB3','#8C9AC5','light'),('#123456','#B75D28','dark'),('#000000','','light'),('#FFFFFF','','dark'),('#1A2B3C','','auto')]:await compare(color,secondary,mode)
  check(await frame.evaluate('document.querySelector(".preview-post")===window.__unchangedDOM'),'preview DOM retained across updates')
  check(parent_state==await page.evaluate('({classes:document.documentElement.className,style:document.documentElement.getAttribute("style"),mode:document.documentElement.dataset.mode,palette:document.querySelector("style[id^=mdui-custom-color-scheme-]").textContent})'),'host theme and palette unchanged')
  await page.emulate_media(color_scheme='dark');await oracle.emulate_media(color_scheme='dark');await page.wait_for_timeout(60)
  config=json.loads(await page.locator('[data-palette-json]').text_content());check(await tokens(frame)==await oracle.evaluate('(a)=>NekomiThemeOracle.read(a)',config['appearance']),'auto preview follows OS dark')
  await page.emulate_media(color_scheme='light');await oracle.emulate_media(color_scheme='light');await page.wait_for_timeout(60)
  # Error state preserves the prior valid UI, prevents invalid JSON copying, then recovers.
  before=await tokens(frame)
  for invalid in ['#abc','#GGGGGG','123456','#12345678']:
   await page.fill('#lab-primary',invalid);check(await page.locator('#lab-primary').get_attribute('aria-invalid')=='true','invalid HEX marked');check(await page.locator('[data-copy-palette]').is_disabled(),'invalid config cannot be copied');check(await tokens(frame)==before,'last valid preview retained')
  await page.fill('#lab-primary','#e69db3');await page.check('#lab-use-secondary');await page.fill('#lab-secondary','#abc');check(await page.locator('[data-copy-palette]').is_disabled(),'invalid secondary blocked')
  await page.fill('#lab-secondary','#8c9ac5');await page.select_option('#lab-mode','dark');await page.locator('[data-copy-palette]').click()
  copied=json.loads(await page.evaluate('navigator.clipboard.readText()'));check(copied==json.loads(await page.locator('[data-palette-json]').text_content()),'copied JSON matches current controls');check(copied['appearance']['secondary']=='#8C9AC5','secondary copied as valid HEX')
  await page.locator('[data-lab-reset]').click();check(json.loads(await page.locator('[data-palette-json]').text_content())=={'appearance':{'preset':'default','color':'#8064B1','secondary':'','mode':'auto'}},'reset restores defaults and clears secondary')
  await page.locator('[data-lab-color="#B75D28"]').focus();await page.keyboard.press('Enter');check(await page.input_value('#lab-primary')=='#B75D28','keyboard quick color selection')
  await page.fill('#lab-primary','#123456');await page.keyboard.press('Tab');check(await page.input_value('#lab-primary')=='#123456','keyboard HEX entry')
  await page.evaluate("document.querySelector('#lab-primary-picker').value='#abcdef';document.querySelector('#lab-primary-picker').dispatchEvent(new Event('input',{bubbles:true}))")
  check(await page.input_value('#lab-primary')=='#abcdef','native color input updates HEX and preview')
  # Host theme switches do not change the independently selected preview mode.
  await page.select_option('#lab-mode','light');await frame.wait_for_function('document.documentElement.classList.contains("mdui-theme-light")');await page.select_option('[data-theme-select]','dark');check(await frame.evaluate('document.documentElement.classList.contains("mdui-theme-light")'),'host dark mode does not override preview light')
  # Original screenshot switching remains usable on a page containing the lab.
  await page.locator('[data-preset="fresh"]').click();await page.locator('[data-shot-mode]').click();await page.locator('[data-shot-device]').click();check('p30-fresh-home-dark-390.png' in await page.locator('[data-shot]').get_attribute('src'),'real screenshot controls unchanged')
  await page.select_option('[data-theme-select]','light');await page.locator('#custom-colors').screenshot(path=str(OUT/'color-lab-desktop.png'))
  for width,height in [(768,1024),(390,844),(320,700)]:
   await page.set_viewport_size({'width':width,'height':height});await page.locator('#custom-colors').scroll_into_view_if_needed();await page.wait_for_timeout(80)
   check(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'host no overflow at {width}')
   check(await frame.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'preview no overflow at {width}')
   await page.locator('#custom-colors').screenshot(path=str(OUT/f'color-lab-{width}.png'))
  touch=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
  mobile=await touch.new_page();await mobile.goto(URL+'demo/#custom-colors',wait_until='networkidle');await mobile.wait_for_function('!document.querySelector("[data-lab-fields]").disabled')
  await mobile.locator('[data-lab-color="#E69DB3"]').tap();check(await mobile.input_value('#lab-primary')=='#E69DB3','touch quick color selection');await mobile.locator('#lab-primary').fill('#427F79');check(await mobile.input_value('#lab-primary')=='#427F79','mobile HEX entry')
  await page.goto(URL,wait_until='networkidle');await page.locator('.home-colors a').nth(1).click();await page.wait_for_load_state('networkidle');await page.wait_for_function('!document.querySelector("[data-lab-fields]").disabled');check(await page.input_value('#lab-primary')=='#E69DB3','homepage color entry seeds live preview')
  await page.keyboard.press('Control+k');await page.fill('#search-input','主题色');await page.wait_for_selector('#search-results a');check(await page.locator('#search-results a').count()>0,'host search works after color use');await page.keyboard.press('Escape')
  await page.goto(URL+'docs/configuration-guide/#主题色与预设',wait_until='networkidle');check(await page.locator('#主题色与预设').evaluate('(e)=>e.getBoundingClientRect().top>=60'),'color guide anchor clears header')
  # no-JS browsing and selected README sections remain accessible.
  nojs=await b.new_context(java_script_enabled=False,viewport={'width':390,'height':844});static=await nojs.new_page();await static.goto(URL+'docs/');check(await static.locator('a[href$="docs/configuration-guide/#主题色与预设"]').count()>0,'no-JS direct color guide link')
  await static.goto(URL+'docs/getting-started/');check('npm ci' in await static.locator('.prose').inner_text(),'no-JS quick start retains installation');check(await static.locator('#从-p24-迁移与保留个人配置').count()==0,'historical migration excluded from quick start')
  await page.goto(URL+'changelog/',wait_until='networkidle');check(not await page.locator('.changelog-meta').evaluate('(d)=>d.open'),'sync metadata is secondary and collapsed');check(await page.locator('.prose h2').count()>0,'real changelog retained')
  check(not errors,'no page errors')
  (OUT/'palette-configs.json').write_text(json.dumps(configs,ensure_ascii=False,indent=2));(OUT/'palette-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'url':URL},ensure_ascii=False,indent=2));print(json.dumps({'passed':len(checks),'errors':errors,'url':URL}))
  await b.close()
asyncio.run(main())
