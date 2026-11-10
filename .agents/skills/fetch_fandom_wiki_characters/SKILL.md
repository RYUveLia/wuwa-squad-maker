---
name: fetch_fandom_wiki_characters
description: Parse Fandom Wiki character list tables to extract names, rarity, element, weapon details, and download profile images to local assets.
---

# Fandom Wiki 캐릭터 정보 추출 스킬 (Fetch Fandom Wiki Characters)

이 스킬은 **Fandom Wiki의 캐릭터 리스트 테이블(HTML)**로부터 캐릭터 데이터(영어/한국어 이름, 등급, 속성, 무기군 등)를 분석하여 JSON 데이터로 추출하고, 프로필 아이콘 이미지를 로컬 정적 폴더에 일괄 다운로드하는 자동화 지침 및 스크립트를 제공합니다.

## 🛠️ 수집 가이드 및 실행 방법

### 1단계: Fandom Wiki 캐릭터 리스트 페이지 저장
캐릭터 리스트가 위치한 위키 페이지의 HTML 소스를 로컬 파일로 가져옵니다.
* **대상 URL:** `https://wutheringwaves.fandom.com/wiki/Resonator/List` (혹은 타 게임 위키의 캐릭터 목록 URL)
* **저장 위치:** 프로젝트의 임시 경로 또는 에이전트 캐시 경로에 저장합니다.

### 2단계: 스크립트 작성 및 실행
프로젝트 루트 또는 `tools/data/` 디렉토리에 파싱 및 다운로드 스크립트를 생성합니다.

#### 스크립트 예시: `tools/data/fetch-characters.js`
이 스크립트는 HTML 파일 내 `<tr>...</tr>` 행 중 캐릭터 이미지(`alt="Resonator ..."`)가 들어간 요소들을 탐색하여 다음과 같은 속성을 추출합니다:
* **이름 (한글/영어):** 한국어 이름 매핑 사전(`KR_NAME_MAP`)을 활용하여 한글로 자동 번역합니다.
* **등급:** `<span title="(\d) Stars">` 매칭을 통해 수집합니다.
* **속성 & 무기:** 각각의 고유 속성 및 무기 키워드 매칭을 통해 정확히 매핑합니다.
* **이미지:** `/revision/latest/scale-to-width-down/50...` 형식의 thumbnail URL을 고화질 원본 이미지 URL(`/revision/latest?cb=...`)로 가공한 뒤 `https` 모듈을 사용하여 로컬 드라이브 `web/public/characters/[character-id].png` 에 다운로드합니다.

#### 실행 명령어
```bash
node tools/data/fetch-characters.js <1단계에서 저장한 HTML 파일 경로>
```

### 3단계: 추출 결과 데이터 형식 (JSON)
추출이 완료되면 [web/src/data/characters.json](../../../web/src/data/characters.json) 파일에 다음과 같은 형식으로 저장됩니다.

```json
[
  {
    "id": "jinhsi",
    "name": "금희",
    "enName": "Jinhsi",
    "rarity": 5,
    "element": "Spectro",
    "weapon": "Broadblade",
    "img": "/characters/jinhsi.png"
  }
]
```

## ⚙️ 유의 사항
* **정규식 매칭:** Fandom Wiki의 HTML 마크업이 변경될 경우 정규식 매칭 패턴(`/<img alt="Resonator ([^"]+)"[^>]*?data-src="([^"]+)"/`)이 깨질 수 있으므로, HTML 구조의 변경 여부를 사전에 모니터링해야 합니다.
* **핫링크 방지 우회:** Fandom Wiki의 원본 이미지는 외부 웹사이트에서 직접 연결할 때 차단될 위험이 있으므로, 본 스크립트처럼 로컬 `web/public/` 디렉토리에 다운로드하여 사용하는 방식이 가장 안전합니다.
