# web — 웹페이지

종말 매트릭스 파티 빌더 웹앱. React 19 + Vite + TypeScript, Tailwind CSS v4, dnd-kit(드래그 앤 드롭), html-to-image(이미지 저장).

## 실행

```bash
cd web
npm install
npm run dev          # 개발 서버
npm run build        # 타입체크(tsc -b) + 빌드 → dist/
npm run preview      # 빌드 결과 미리보기
```

## 검증

```bash
npm test && npm run lint && npm run build
```

| 명령 | 내용 |
|---|---|
| `npm test` | vitest 단위 테스트 (`src/**/*.test.ts`). `npm run test:watch`로 감시 모드 |
| `npm run lint` | oxlint (`.oxlintrc.json`) |
| `npm run check:buff` | nanoka.cc 최신 시즌 버프와 `versions.ts` 대조 ([`../tools/data/`](../tools/data/)) |

## 폴더 구조

| 위치 | 역할 |
|---|---|
| `src/constants/` | 데이터·설정. `versions.ts`(지원 버전·라이브·유출·시즌 버프), `circuitBuffs.ts`(버전별 회로 버프), `index.ts`(순수 힐러·방랑자 ID·속성명) |
| `src/data/characters.json` | 공명자 목록 (`id`, `name`, `enName`, `rarity`, `element`, `weapon`, `releaseVersion`, `img`) |
| `src/utils/` | **순수 함수** (React 무관, 단위 테스트 대상) |
| ├ `character.ts` | 공명자 조회, 버전별 노출, 시즌 버프, 출전 한도 |
| ├ `squadRow.ts` / `squadEditing.ts` | 파티 행 생성 / 배치·이동·교환·해제 |
| ├ `versionTransfer.ts` | 버전 규칙 정리(`sanitizeSquadsForVersion`), 세트 단위 버전 추정 |
| ├ `squadCode.ts` | 편성 코드 v1~v3 인코딩·디코딩 |
| ├ `dragData.ts` | 드래그 데이터 해석, 드롭/행 ID 상수 |
| └ `squadStorage.ts` | localStorage 저장 (키, 버전별 보드, 레거시 이관, 설정) |
| `src/hooks/` | 상태 훅. `useSquadState`가 하위 훅을 `{ boards, editor, dnd, pool, transfer, toast, confirm, ui }`로 묶어 반환 |
| `src/components/layout/` | 화면 골격: `AppHeader`, `ResonatorPoolPanel`, `SquadBoardPanel`, `AppModals`, `DragPreview` |
| `src/components/` | 개별 UI 컴포넌트·모달 (보안 확인 `TurnstileGate` 포함) |
| `src/test/fixtures.ts` | 테스트 픽스처 `char()`, `row()`, `summarize()` |
| `public/characters/` | 공명자 초상화 `<id>.png` (256×256, 투명 배경. 내용은 WebP여도 됨) |
| `public/circuits/` | 회로 버프 아이콘 `.webp` |

규칙·변환 로직은 `utils`에 순수 함수로 두고 테스트를 함께 작성한다. 훅은 상태 연결과 사용자 안내(토스트·확인)만 담당한다.

## 브라우저 저장소 (localStorage)

| 키 | 내용 |
|---|---|
| `wuwa-squads-by-version` | 버전 → 파티 목록 |
| `selected-version` | 선택한 보드 버전 |
| `squads-version-migrated` | 버전 도입 이전 데이터 이관 완료 여부 |
| `wuwa-squads-data`, `wuwa-squads`, `wuwa-squad-circuit-buffs` | 레거시 포맷 (이관용으로만 읽음) |

키 목록 전체는 `src/utils/squadStorage.ts`의 `STORAGE_KEYS`.

## 배포

Vercel이 GitHub와 연동되어 `main` 머지 시 바로 운영 배포된다. Vercel 프로젝트의 Root Directory는 `web`.

## 관련 문서

- 버전·공명자·회로 데이터 구조: [`../docs/version-and-leak-guide.md`](../docs/version-and-leak-guide.md)
- 새 버전 추가·라이브 전환 절차: [`../.agents/skills/version_update/SKILL.md`](../.agents/skills/version_update/SKILL.md)
