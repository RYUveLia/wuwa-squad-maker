# wuwa-squad-maker 작업 규칙

## 커밋 및 브랜치 규칙

- **커밋 전에 반드시 변경 결과(코드/동작)를 유저에게 먼저 보여주고 확인을 거칠 것.**
  - 코드 가공이나 리팩토링 등의 작업을 진행한 후, 유저가 결과를 확인하자고 지시하거나 혹은 변경본이 완료되었을 때는 **임의로 먼저 커밋하거나 원격에 푸시(특히 force push)하지 않는다.**
  - 수정한 소스코드의 변경 내용(diff)이나 기능 작동 방식을 먼저 상세히 보여주고, 유저의 명시적인 커밋/푸시 진행 승인을 득한 후에만 깃 명령어 단계를 밟는다.
- **모든 작업은 항상 새 feature/refactor 브랜치를 통해 진행하고 PR(Pull Request) 요청을 띄울 것.**
  - `main` 브랜치에 직접 커밋하거나 머지 없이 직접 푸시하지 않는다.
  - 작업용 독립 브랜치 생성 ➔ 커밋 ➔ 푸시 ➔ PR 생성 ➔ 유저 최종 검토 및 최종 머지(Merge)의 단계를 확실하게 고수한다.

## 배포 규칙

- **git push 전에 반드시 유저 리뷰를 거칠 것.** 빌드가 성공하더라도 자동으로 커밋/푸시하지 않는다.
- 빌드 성공 → 변경 내역 요약 → 유저 승인 확인 → 커밋 & 푸시 순서를 지킨다.
- Vercel이 깃허브 연동되어 있어 push = 즉시 배포이므로, 잦은 배포를 방지하기 위해 이 규칙을 엄수한다.

## ⚠️ 절대적 엄수 사항 (최우선 순위)

- **모든 코드 변경 완료 시, 임의로 `git commit` 및 `push`를 실행하지 말 것.**
  - 코드를 수정한 뒤 빌드가 정상적으로 완료되었더라도, **"변경 사항을 이대로 커밋할까요?"** 또는 **"이대로 푸시 및 PR을 진행할까요?"** 와 같이 사용자에게 명시적인 승인 여부를 먼저 물어보아야 합니다.
  - 사용자가 사전에 직접 "커밋하고 푸시/PR 올려줘"라고 먼저 지시하지 않은 한, 소스 코드 수정 후에는 반드시 확인 질문을 남기고 사용자의 최종 승인 확답을 얻은 뒤에만 커밋/푸시 단계를 밟아야 합니다.

## 신규 버전 및 유출 데이터(공명자 & 회로 버프) 관리 가이드

상세 가이드는 [`docs/version-and-leak-guide.md`](../docs/version-and-leak-guide.md)에 정리되어 있습니다.

### 1. 공명자(캐릭터) 데이터 (`src/data/characters.json`, `src/utils/character.ts`)
- **기본 데이터**: `characters.json`에서 `id`, `name`, `enName`, `rarity`, `element`, `weapon`, `releaseVersion`, `img` 관리
- **유출 캐릭터 목록**: `character.ts`의 `LEAK_CHARACTER_IDS`에 등록 (유출 모드 ON 시 최신순 상단, OFF 시 맨 뒤 정렬)
- **시즌 버프(임시 2회 출전)**: `character.ts`의 `getSeasonBuffInfo`에서 버전별 대상 캐릭터 지정 (`3.7` 린네, `3.8` 루실라 등)

### 2. 특이점 확장 회로 버프 (`src/constants/circuitBuffs.ts`)
- **버전별 버프 배열**: `CIRCUIT_BUFFS_3_6`, `CIRCUIT_BUFFS_3_7` 등으로 분리 관리
- **버프 내용 수정**: 이미지(`iconUrl`), 한/영 이름(`name`, `nameEn`), 한/영 설명(`description`, `descriptionEn`)을 해당 버전 배열에서 수정
- **헬퍼 함수**: `getCircuitBuffs(showLeakInfo)`, `findCircuitBuffById(buffId, showLeakInfo)`가 유출 모드 동적 연동 및 이전 버전 fallback(하위 호환)을 자동 처리함

## 스킬 (`.agents/skills/`)

### `fetch_fandom_wiki_characters` — Fandom Wiki 캐릭터 일괄 수집
- 상세 절차: [`.agents/skills/fetch_fandom_wiki_characters/SKILL.md`](skills/fetch_fandom_wiki_characters/SKILL.md)
- 실행: `node scripts/fetch-characters.js` (repo의 `scripts/` 버전이 실사용본)
- **주의**: 결과를 `src/data/characters.json`에 통째로 덮어쓰므로, 실행 후 반드시 diff로 수동 수정분(유출 캐릭터, `releaseVersion` 등)이 유실되지 않았는지 확인할 것
