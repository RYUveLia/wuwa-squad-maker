/**
 * WuWa Squad Maker 공통 스타일 시스템
 * 중복되는 Tailwind CSS 클래스들을 상수로 선언하여 코드 가독성과 디자인 일관성을 높입니다.
 */

export const COMMON_STYLES = {
  // 1. 어두운 도구/설정 서브 버튼 (⚙️ 보유 설정, 전체 선택, 전체 해제 등)
  subBtn: 'text-[10.5px] sm:text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 sm:py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 active:scale-95 select-none',
  
  // 2. 모달 내부에 사용되는 기본 취소 버튼 (어두운 회색 테두리 스타일)
  cancelBtn: 'text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg cursor-pointer transition-colors active:scale-95 whitespace-nowrap',
  
  // 3. 모달 내부에 사용되는 기본 승인/저장 버튼 (보라색 강조 스타일)
  confirmBtn: 'text-[11px] sm:text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-lg cursor-pointer shadow-md active:scale-95 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed',

  // 4. 보유 필터링 체크박스용 라벨 공통
  checkboxLabel: 'flex items-center gap-1.5 cursor-pointer text-[10.5px] sm:text-xs text-slate-400 font-bold hover:text-slate-300 select-none',
  
  // 5. 보유 필터링 체크박스 인풋 공통
  checkboxInput: 'w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer'
}
