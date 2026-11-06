// 커뮤니티 공지용 스크린샷 캡처 (운영 사이트 기준)
//
// 사용법 (repo에 playwright 의존성을 넣지 않기 위해 임시 폴더에서 실행):
//   mkdir -p /tmp/wuwa-shot && cd /tmp/wuwa-shot && npm init -y >/dev/null && npm i playwright@1.58.2 && npx playwright install chromium
//   NODE_PATH=/tmp/wuwa-shot/node_modules node <repo>/.agents/skills/community_announcement/scripts/capture-screenshots.cjs \
//     --out <출력 폴더> [--url https://wuwa-squad-maker.vercel.app/] [--board 3.6] [--other 3.7] [--mobile 3.7] \
//     [--sample <repo>/.agents/skills/community_announcement/scripts/sample-squads.json]
//
//   --board  : 메인·이미지 저장에 쓸 보드 버전 (샘플 세트가 이관될 버전과 같게. 기본: 세트 추천 버전)
//   --other  : 다른 버전 코드 선택 창을 띄울 때 보고 있을 보드 (board와 달라야 함)
//   --mobile : 모바일 캡처에 쓸 버전 (보통 현재 라이브 버전)
//
// 출력 파일
//   1-main.png          메인 화면 (버전 탭 + 보드)          PC 1440x900 @2x
//   2-migration.png     기존 파티 이관 창                    창만 잘라냄
//   3-import-choice.png 다른 버전 편성 코드 선택 창          창만 잘라냄
//   4-image-export.png  "이미지로 저장" 실제 결과 PNG        다운로드 파일 그대로
//   5-import-modal.png  불러오기 창 (다른 버전 보드 목록)    창만 잘라냄
//   6-mobile.png        모바일 화면                          iPhone 13

const fs = require('fs')
const path = require('path')
const { chromium, devices } = require('playwright')

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => (v.startsWith('--') ? [...acc, [v.slice(2), arr[i + 1]]] : acc), [])
)
const URL = args.url || 'https://wuwa-squad-maker.vercel.app/'
const OUT = path.resolve(args.out || './community-shots')
const SAMPLE = args.sample || path.join(__dirname, 'sample-squads.json')
const OTHER = args.other || '3.7'
const MOBILE = args.mobile || '3.7'
fs.mkdirSync(OUT, { recursive: true })

const { legacyRows } = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'))
const legacy = legacyRows.map((r, i) => ({ id: `legacy-${i}`, ...r }))
const legacyCode = Buffer.from(JSON.stringify({ v: 2, s: legacyRows.map(r => ({ c: r.characters, b: r.circuitBuffId })) })).toString('base64')
const out = f => path.join(OUT, f)
const log = (...a) => console.log('[shot]', ...a)

async function passGate(page, tap = false) {
  const skip = page.getByText(/보안 인증 건너뛰기|보안 검사 건너뛰기/).first()
  await skip.waitFor({ timeout: 20000 })
  tap ? await skip.tap() : await skip.click()
  await page.waitForTimeout(1200)
}

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true })
  const p = await ctx.newPage()

  // 2) 기존 파티 이관 창: 버전 없는 레거시 저장값을 넣고 첫 진입
  await p.goto(URL)
  await p.evaluate(rows => { localStorage.clear(); localStorage.setItem('wuwa-squads-data', JSON.stringify(rows)) }, legacy)
  await p.reload(); await passGate(p)
  const migModal = p.locator('div', { has: p.getByText('기존 파티를 버전별로 정리해 주세요') })
    .filter({ has: p.getByRole('button', { name: /파티 옮기기/ }) }).last()
  await migModal.screenshot({ path: out('2-migration.png') }); log('2-migration')
  await p.getByRole('button', { name: /파티 옮기기/ }).click(); await p.waitForTimeout(800)

  // 이관 후 보드 버전 지정 (기본: 세트 추천 버전으로 이미 이동)
  if (args.board) { await p.getByRole('tab', { name: new RegExp('^' + args.board.replace('.', '\\.')) }).click(); await p.waitForTimeout(300) }
  const boardVersion = (await p.locator('[aria-label="게임 버전 선택"] [aria-selected=true]').innerText()).replace(/\D+$/, '')

  // 1) 메인 화면 (토스트가 사라진 뒤)
  await p.mouse.move(5, 5); await p.waitForTimeout(2600)
  await p.screenshot({ path: out('1-main.png') }); log('1-main (board ' + boardVersion + ')')

  // 4) 이미지로 저장 실제 결과 PNG
  await p.getByRole('button', { name: '이미지로 저장' }).click(); await p.waitForTimeout(2000)
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: /PNG 다운로드/ }).click()])
  await dl.saveAs(out('4-image-export.png')); log('4-image-export', dl.suggestedFilename())
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)

  // 5) 불러오기 창 / 3) 다른 버전 코드 선택 창
  await p.getByRole('tab', { name: new RegExp('^' + OTHER.replace('.', '\\.')) }).click(); await p.waitForTimeout(300)
  await p.getByRole('button', { name: '불러오기', exact: true }).click(); await p.waitForTimeout(300)
  const importModal = p.locator('div', { has: p.getByText('편성 코드 불러오기') }).filter({ has: p.locator('textarea') }).last()
  await importModal.screenshot({ path: out('5-import-modal.png') }); log('5-import-modal')
  await p.locator('textarea').fill(legacyCode)
  await p.locator('textarea').locator('xpath=..').getByRole('button', { name: '불러오기', exact: true }).click(); await p.waitForTimeout(500)
  const choice = p.locator('div', { has: p.getByText(/코드입니다/) }).filter({ has: p.getByRole('button', { name: '취소' }) }).last()
  await choice.screenshot({ path: out('3-import-choice.png') }); log('3-import-choice')

  // 6) 모바일: 샘플 세트 앞 3파티를 해당 버전 보드에 넣고 캡처
  const mctx = await browser.newContext({ ...devices['iPhone 13'] })
  const m = await mctx.newPage()
  await m.goto(URL)
  const mobileRows = legacyRows.slice(0, 3).map((r, i) => ({ id: `squad-row-m${i}`, characters: r.characters, circuitBuffId: null }))
  await m.evaluate(({ v, rows }) => {
    localStorage.clear()
    localStorage.setItem('squads-version-migrated', 'true')
    localStorage.setItem('selected-version', v)
    localStorage.setItem('wuwa-squads-by-version', JSON.stringify({ [v]: rows }))
  }, { v: MOBILE, rows: mobileRows })
  await m.reload(); await passGate(m, true)
  await m.screenshot({ path: out('6-mobile.png') }); log('6-mobile')

  await browser.close()
  log('done →', OUT)
})().catch(e => { console.error('[shot] FAIL', e.message); process.exit(1) })
