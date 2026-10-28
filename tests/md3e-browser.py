"""Targeted MDUI interaction/motion regression on a production static build.
BROWSER_PATH=/usr/bin/chromium python tests/md3e-browser.py http://127.0.0.1:4321/
AXE_PATH is optional for extra scans with open Dialog/Drawer and active lab.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

URL = (sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4321/').rstrip('/')+'/'
OUT = Path('test-results/md3e'); OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
def contrast(a,b):
    def luminance(rgb):
        values=[v/255 for v in rgb]
        return sum((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*weight for v,weight in zip(values,[.2126,.7152,.0722]))
    first,second=sorted([luminance(a),luminance(b)])
    return (second+.05)/(first+.05)

def check(value,label):
    if not value: raise AssertionError(label)
    checks.append(label)

async def main():
 async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    context=await browser.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
    page=await context.new_page(); page.on('pageerror',lambda e:errors.append({'name':e.name,'message':str(e),'stack':e.stack,'url':page.url}))
    async def goto(route=''):
        await page.goto(URL+route,wait_until='networkidle')
        await page.wait_for_function('document.documentElement.dataset.uiReady === "true"')
    async def settled():
        await page.wait_for_function('document.querySelector("[data-showcase]").getAttribute("aria-busy")==="false"')
    async def scan(label):
        if not os.environ.get('AXE_PATH'): return
        await page.wait_for_timeout(550)
        await page.add_script_tag(path=os.environ['AXE_PATH'])
        violations=await page.evaluate('async()=> (await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))')
        check(not violations,f'{label}: axe {violations}')
    await goto()
    check(await page.locator('.action-link mdui-button').count()>=3,'CTA uses native MDUI buttons with href')
    check(await page.locator('.action-fallback:visible').count()==0,'enhanced CTA has a single visible link')
    check(await page.evaluate('document.querySelectorAll("style[id^=mdui-custom-color-scheme-]").length===0'),'host palette is static public MDUI output, no runtime duplicate')
    # Actual button press with the unmodified MDUI ripple enabled.
    cta=page.get_by_role('link',name='开始使用',exact=True).first
    await cta.hover(); await page.mouse.down(); await page.wait_for_timeout(100)
    await page.screenshot(path=str(OUT/'cta-pressed.png'))
    check(await page.locator('.action-link mdui-button').first.evaluate('e=>!e.noRipple'),'MDUI native ripple remains enabled')
    await page.mouse.move(2,2); await page.mouse.up()
    await page.keyboard.press('Control+k'); await page.wait_for_function('document.querySelector("#search-input")===document.activeElement')
    check(await page.locator('#doc-search').evaluate('e=>e.open'),'Ctrl+K opens MDUI dialog')
    await page.fill('#search-input','主题色'); await page.wait_for_selector('#search-results a')
    await page.keyboard.press('ArrowDown'); check(await page.evaluate('document.activeElement.closest("#search-results")!==null'),'dialog keyboard results retain focus')
    await page.keyboard.press('Control+k'); check(await page.evaluate('document.activeElement.id==="search-input"'),'repeated Ctrl+K returns focus to search input')
    await scan('open search'); await page.screenshot(path=str(OUT/'search.png'))
    await page.keyboard.press('Escape'); await page.wait_for_function('!document.querySelector("#doc-search").open')
    await page.wait_for_timeout(230)
    check(not await page.locator('#doc-search').is_visible(),'Esc completes dialog close')
    await page.keyboard.press('Control+k'); await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    check(not await page.locator('#doc-search').evaluate('e=>e.open'),'Escape closes search during its opening motion')
    await page.keyboard.press('Meta+k'); await page.wait_for_timeout(380); await page.mouse.click(4,4); await page.wait_for_timeout(250)
    check(not await page.locator('#doc-search').evaluate('e=>e.open'),'Cmd+K and dialog overlay close work')
    await goto('demo/'); await settled()
    # A deliberately late obsolete response must never replace the last selection.
    async def delayed(route):
        await asyncio.sleep(.7); await route.continue_()
    await page.route('**/p30-fresh-home-light-1440.png',delayed)
    await page.locator('[data-preset=fresh]').click()
    await page.locator('[data-preset=minimal]').click()
    await settled(); await page.wait_for_timeout(800)
    check((await page.locator('[data-shot]').get_attribute('src')).endswith('minimal-home-light-1440.png'),'late screenshot response cannot win')
    await page.unroute('**/p30-fresh-home-light-1440.png')
    stage=await page.locator('.shot-stage').bounding_box()
    next_y=await page.locator('.preset-descriptions').evaluate('e=>e.getBoundingClientRect().top')
    for preset in ['fresh','default','minimal','fresh','default']:
        await page.locator(f'[data-preset={preset}]').click()
    await page.locator('[data-shot-mode]').click(); await page.locator('[data-shot-device]').click()
    await page.wait_for_function('document.querySelector("[data-shot]").src.endsWith("default-home-dark-390.png")')
    await page.wait_for_timeout(260)
    check(await page.locator('[data-shot-previous]').is_hidden(),'old layer stays hidden after fade while spatial resize finishes')
    await settled()
    check((await page.locator('[data-shot]').get_attribute('src')).endswith('default-home-dark-390.png'),'rapid controls commit only latest combined state')
    check(abs((await page.locator('.shot-stage').bounding_box())['height']-stage['height'])<1,'device change reserves the same stage')
    check(abs(await page.locator('.preset-descriptions').evaluate('e=>e.getBoundingClientRect().top')-next_y)<1,'device change does not move following content')
    check(await page.locator('[data-shot]').evaluate('i=>getComputedStyle(i).filter==="none"'),'real image is never recolored with filters')
    check(await page.locator('[data-shot-previous]').is_hidden(),'previous layer cleared after animation')
    # Failure preserves the current decoded image, and an explicit retry recovers.
    before=await page.locator('[data-shot]').get_attribute('src')
    await page.route('**/p30-minimal-home-dark-390.png',lambda r:r.abort())
    await page.locator('[data-preset=minimal]').click(); await settled()
    check(await page.locator('[data-shot]').get_attribute('src')==before,'failed screenshot keeps previous valid image')
    check(await page.locator('[data-shot-retry]').is_visible(),'failed screenshot offers retry')
    await page.unroute('**/p30-minimal-home-dark-390.png'); await page.locator('[data-shot-retry]').click(); await settled()
    check((await page.locator('[data-shot]').get_attribute('src')).endswith('minimal-home-dark-390.png'),'screenshot retry works')
    await page.locator('#custom-colors').scroll_into_view_if_needed()
    await page.wait_for_function('!document.querySelector("[data-lab-fields]").disabled')
    primary=await page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--mdui-color-primary")')
    frame=page.frames[1]
    await frame.evaluate('window.originalPost=document.querySelector(".preview-post")')
    # Tab navigation enters MDUI's real button; host.focus is its public component method.
    await page.locator('#lab-primary').focus(); await page.keyboard.press('Tab')
    check(await page.evaluate('document.activeElement.matches("mdui-button[data-lab-color]")'),'Tab reaches MDUI quick color button')
    await page.keyboard.press('Enter'); await page.locator('[data-lab-color="#E69DB3"]').evaluate('e=>e.focus()'); await page.keyboard.press('Space')
    check(await page.input_value('#lab-primary')=='#E69DB3','Space activates quick color through keyboard')
    await page.fill('#lab-primary','#123456'); await page.wait_for_timeout(100)
    check(primary==await page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--mdui-color-primary")'),'lab cannot change host brand role')
    check(await frame.evaluate('window.originalPost===document.querySelector(".preview-post")'),'color effects retain iframe UI nodes')
    await scan('active lab')
    await page.set_viewport_size({'width':390,'height':844}); await goto('docs/markdown/')
    await page.locator('[data-menu-toggle]').click(); await page.wait_for_timeout(550)
    check(await page.locator('#mobile-menu').evaluate('e=>e.open'),'drawer opens')
    check(await page.locator('#mobile-menu').evaluate('e=>e.getBoundingClientRect().width===innerWidth'),'drawer overlay covers full mobile viewport')
    for _ in range(12): await page.keyboard.press('Tab')
    check(await page.evaluate('document.activeElement.closest("#mobile-menu")!==null'),'drawer traps keyboard focus')
    await scan('open drawer'); await page.screenshot(path=str(OUT/'drawer-mobile.png'))
    await page.mouse.click(10,400); await page.wait_for_timeout(550)
    check(not await page.locator('#mobile-menu').evaluate('e=>e.open'),'drawer overlay closes')
    check(await page.evaluate('document.activeElement.matches("[data-menu-toggle]")'),'drawer restores trigger focus')
    await page.locator('[data-menu-toggle]').click(); await page.keyboard.press('Escape'); await page.wait_for_timeout(550)
    check(not await page.locator('#mobile-menu').evaluate('e=>e.open'),'Escape also closes during opening')
    await page.locator('[data-menu-toggle]').click(); await page.wait_for_timeout(550)
    async with page.expect_navigation(wait_until='networkidle'):
        await page.locator('.drawer-links a').filter(has_text='特性').click()
    await page.go_back(wait_until='networkidle'); await page.wait_for_timeout(550)
    check(not await page.locator('#mobile-menu').evaluate('e=>e.open'),'browser back restores a closed drawer')
    check(await page.evaluate('getComputedStyle(document.body).overflow!=="hidden"'),'browser back has no stale body lock')
    await page.go_forward(wait_until='networkidle'); check('/features/' in page.url,'browser forward remains native')
    await page.emulate_media(reduced_motion='reduce'); await goto('demo/'); await settled()
    await page.locator('[data-shot-device]').click(); await settled()
    check(await page.locator('.shot-stage').evaluate('e=>e.getAnimations({subtree:true}).length===0'),'reduced motion skips custom screenshot movement and fade')
    check(await page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--mdui-motion-duration-long2").trim()==="1ms"'),'reduced motion also reaches MDUI public timing tokens')
    await page.locator('[data-menu-toggle]').click(); await page.keyboard.press('Escape'); await page.wait_for_function('getComputedStyle(document.querySelector("#mobile-menu")).display==="none"')
    check(not await page.locator('#mobile-menu').is_visible(),'reduced motion drawer remains operable and closes immediately')
    await page.evaluate('scrollTo(0,document.body.scrollHeight)'); await page.wait_for_timeout(60)
    check(await page.get_by_role('button',name='返回顶部',exact=True).count()==1,'FAB has a named internal button')
    check(await page.locator('[data-back-top]').evaluate('e=>getComputedStyle(e).backgroundColor!=="rgba(0, 0, 0, 0)" && getComputedStyle(e).boxShadow!=="none"'),'FAB retains native Material container and elevation')
    await scan('visible FAB')
    await page.locator('[data-back-top]').click(); await page.wait_for_timeout(50)
    check(await page.evaluate('scrollY===0'),'FAB works immediately with reduced motion')
    await goto('faq/'); await page.locator('.faq-list summary').first.click(); check(await page.locator('.faq-list details').first.evaluate('e=>e.open'),'native FAQ works in reduced motion')
    # The checked-in palette is identical before JS, after JS and to MDUI SDK output.
    for mode in ['light','dark']:
        static=await browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844},color_scheme=mode)
        nojs=await static.new_page(); await nojs.goto(URL,wait_until='networkidle')
        check(await nojs.locator('.action-fallback').first.is_visible(),f'{mode} no-JS CTA remains a link')
        await nojs.locator('.mobile-nav-fallback summary').click(); check(await nojs.locator('.mobile-nav-fallback a').count()==6,f'{mode} no-JS navigation has all pages')
        check(await nojs.locator('.mobile-nav-fallback nav').is_visible(),f'{mode} no-JS navigation expands')
        before=await nojs.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--mdui-color-primary").trim()')
        sdk=await context.new_page(); sdk.on('pageerror',lambda e:errors.append({'name':e.name,'message':str(e),'stack':e.stack,'url':sdk.url}))
        await sdk.emulate_media(color_scheme=mode); await sdk.goto(URL+'preview/colors/',wait_until='networkidle')
        actual=await sdk.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--mdui-color-primary").trim()')
        check(before==actual,f'{mode} pre-JS palette equals actual MDUI brand output')
        roles=await sdk.evaluate('Object.fromEntries(["primary","on-primary","primary-container","on-primary-container","surface","surface-container-lowest","surface-container-low","on-surface","on-surface-variant","outline"].map(role=>[role,getComputedStyle(document.documentElement).getPropertyValue("--mdui-color-"+role).split(",").map(Number)]))')
        for foreground,background,minimum in [('on-surface','surface-container-lowest',4.5),('on-surface-variant','surface-container-low',4.5),('primary','surface',4.5),('on-primary','primary',4.5),('on-primary-container','primary-container',4.5),('outline','surface-container-lowest',3)]:
            ratio=contrast(roles[foreground],roles[background]);check(ratio>=minimum,f'{mode} {foreground}/{background} contrast {ratio:.2f} >= {minimum}')
        await sdk.close()
        await nojs.goto(URL+'docs/configuration/'); check(await nojs.locator('.prose table').count()>0,f'{mode} no-JS long document remains readable')
        await static.close()
    check(not errors,f'no uncaught browser exceptions: {errors}')
    (OUT/'results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'url':URL},ensure_ascii=False,indent=2))
    print(json.dumps({'passed':len(checks),'errors':errors,'url':URL}))
    await browser.close()
asyncio.run(main())
