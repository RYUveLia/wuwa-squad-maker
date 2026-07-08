import { useEffect, useRef, useState } from 'react'

interface TurnstileGateProps {
  onVerify: (token: string) => void
}

// =================================================================
// 🛡️ [정식 서비스용] Cloudflare Turnstile 실제 발급 키 입력칸
// =================================================================
// 1) Vercel 환경변수(VITE_TURNSTILE_SITE_KEY)가 주입되었거나,
// 2) 혹은 아래 따옴표 안에 발급받으신 실서버용 키(예: 0x4AAAAAA...)를 직접 기입하면 테스트 딱지가 즉시 사라집니다.
const PRODUCTION_SITE_KEY: string = '0x4AAAAAADxQTlBbsTH0kDFm'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || 
  (PRODUCTION_SITE_KEY && PRODUCTION_SITE_KEY !== 'placeholder' ? PRODUCTION_SITE_KEY : '1x00000000000000000000AA')

export function TurnstileGate({ onVerify }: TurnstileGateProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 1) 이미 스크립트가 존재하는지 검사
    const existingScript = document.getElementById('cf-turnstile-script')
    if (existingScript) {
      setScriptLoaded(true)
      return
    }

    // 2) 스크립트 동적 주입
    const script = document.createElement('script')
    script.id = 'cf-turnstile-script'
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => setError('보안 스크립트를 로드하지 못했습니다. 인터넷 연결이나 광고 차단기 설정을 확인해 주세요.')
    document.body.appendChild(script)

    return () => {
      // 컴포넌트 언마운트 시 등록된 Turnstile 위젯 정리
      if (widgetIdRef.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetIdRef.current)
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return

    // 3) Turnstile API가 window에 준비될 때까지 안전하게 대기 후 렌더링
    const renderWidget = () => {
      if (!(window as any).turnstile) {
        setTimeout(renderWidget, 100)
        return
      }

      try {
        widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => {
            // 인증 성공 시 성공 토큰을 부모로 전파
            onVerify(token)
          },
          'error-callback': () => {
            setError('보안 위젯 검증 중 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.')
          },
          theme: 'dark'
        })
      } catch (err) {
        console.error('Turnstile render error:', err)
        setError('보안 챌린지를 생성하는 데 실패했습니다.')
      }
    }

    renderWidget()
  }, [scriptLoaded])

  return (
    <div className={GATE_STYLES.overlay}>
      <div className={GATE_STYLES.container}>
        {/* Header */}
        <div className={GATE_STYLES.header}>
          <div className={GATE_STYLES.shieldIcon}>🛡️</div>
          <h2 className={GATE_STYLES.title}>보안 연결 확인 중</h2>
          <p className={GATE_STYLES.description}>
            안전한 시뮬레이션 환경 조성을 위해 브라우저의 연결 보안을 검사합니다. <br />
            잠시만 기다려 주시면 자동으로 메인 화면으로 이동합니다.
          </p>
        </div>

        {/* Turnstile Container */}
        <div className={GATE_STYLES.widgetArea}>
          {!error && !scriptLoaded && (
            <div className={GATE_STYLES.loaderArea}>
              <div className={GATE_STYLES.spinner}></div>
              <span className={GATE_STYLES.loaderText}>보안 모듈 로딩 중...</span>
            </div>
          )}

          {error ? (
            <div className={GATE_STYLES.errorBox}>
              <p className={GATE_STYLES.errorText}>{error}</p>
              <div className={GATE_STYLES.errorBtnArea}>
                <button
                  onClick={() => window.location.reload()}
                  className={GATE_STYLES.retryBtn}
                >
                  새로고침
                </button>
                <button
                  onClick={() => onVerify('bypass-test-token')}
                  className={GATE_STYLES.bypassTestBtn}
                >
                  보안 검사 건너뛰기
                </button>
              </div>
            </div>
          ) : (
            <div className={GATE_STYLES.centerCol}>
              <div ref={containerRef} className={GATE_STYLES.widgetContainer}></div>
              {/* 로딩 지연이나 광고 차단기 활성화 대비 수동 진입 통로 열기 */}
              <button
                onClick={() => onVerify('bypass-timeout-token')}
                className={GATE_STYLES.bypassTimeoutBtn}
              >
                웹페이지 진입이 안 되시나요? (보안 인증 건너뛰기)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={GATE_STYLES.footer}>
          <div className={GATE_STYLES.footerInnerCol}>
            <span className={GATE_STYLES.footerText}>Protected by Cloudflare Turnstile</span>
            <span className={GATE_STYLES.debuggerText}>
              {SITE_KEY === '1x00000000000000000000AA'
                ? '보안 상태: 더미 데모 키 작동 중 (Vercel 환경변수 미감지)'
                : `보안 상태: 사용자 정의 키 작동 중 (${SITE_KEY.slice(0, 10)}...)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// STYLES (Colocation Style Pattern)
const GATE_STYLES = {
  overlay: 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none animate-fade-in',
  container: 'bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 w-full max-w-md flex flex-col items-center justify-center shadow-2xl animate-scale-up text-center',
  header: 'flex flex-col items-center mb-6',
  shieldIcon: 'text-4xl mb-3 animate-pulse text-purple-400',
  title: 'text-lg sm:text-xl font-bold text-slate-100 tracking-tight',
  description: 'text-[11px] sm:text-xs text-slate-400 mt-2.5 leading-relaxed',
  widgetArea: 'w-full flex flex-col items-center justify-center min-h-[90px] mb-4',
  loaderArea: 'flex flex-col items-center gap-2',
  spinner: 'w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin',
  loaderText: 'text-[11px] text-slate-500 font-semibold',
  errorBox: 'text-center p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl max-w-sm',
  errorText: 'text-[11px] sm:text-xs text-rose-400 font-medium leading-relaxed',
  retryBtn: 'mt-2.5 px-3 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer transition-colors active:scale-95',
  footer: 'border-t border-slate-800/60 pt-4 w-full text-center flex justify-center',
  footerText: 'text-[9.5px] font-mono text-slate-600 tracking-wider',
  
  errorBtnArea: 'flex gap-2 justify-center mt-2.5',
  bypassTestBtn: 'px-3 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors active:scale-95',
  centerCol: 'flex flex-col items-center',
  widgetContainer: 'my-2',
  bypassTimeoutBtn: 'mt-3 text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer transition-all',
  footerInnerCol: 'flex flex-col items-center gap-1',
  debuggerText: 'text-[8px] font-mono text-slate-700 select-all'
}
