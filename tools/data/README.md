# tools/data — 데이터 스크립트

Node 내장 모듈만 사용한다 (`npm install` 불필요). 경로는 스크립트 위치 기준으로 `web/`을 찾으므로 어디서 실행해도 된다.

## check-nanoka-season-buff.js — 시즌 버프·회로 대조

nanoka.cc 데이터에서 특이점 확장(Tower)의 시즌 버프(추가 피로도 2회 출전) 공명자와 회로 버프 목록을 가져와, `web/src/constants/versions.ts`의 최신 버전 설정과 일치하는지 확인한다. 파일은 수정하지 않는다.

```bash
node tools/data/check-nanoka-season-buff.js          # 최신 데이터 버전 자동 감지
node tools/data/check-nanoka-season-buff.js 3.7.1    # 버전 지정
cd web && npm run check:buff                         # 같은 동작
```

새 버전 추가·라이브 전환 때 사용한다. 절차: [`../../.agents/skills/version_update/SKILL.md`](../../.agents/skills/version_update/SKILL.md)

## fetch-characters.js — Fandom Wiki 캐릭터 일괄 수집

Fandom Wiki `Resonator/List` 페이지 HTML에서 이름(한/영)·등급·속성·무기·출시 버전을 뽑아 `characters.json`을 만들고, 없는 초상화를 내려받는다.

```bash
node tools/data/fetch-characters.js <저장한 HTML 파일 경로>
```

- ⚠️ `web/src/data/characters.json`을 **통째로 덮어쓴다.** 실행 후 반드시 diff로 수동 수정분(유출 캐릭터, `releaseVersion` 등)이 사라지지 않았는지 확인한다
- 초상화는 `web/public/characters/`에 이미 있는 파일은 건너뛴다
- 한국어 이름은 스크립트 안 `KR_NAME_MAP`으로 변환한다. 새 캐릭터는 여기에 추가
- 상세 절차: [`../../.agents/skills/fetch_fandom_wiki_characters/SKILL.md`](../../.agents/skills/fetch_fandom_wiki_characters/SKILL.md)
