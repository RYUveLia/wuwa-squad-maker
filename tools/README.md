# tools — 데이터·이미지 도구

웹앱 빌드와 무관하게 따로 실행하는 보조 도구 모음. 결과물은 `web/` 안의 데이터·이미지 파일에 반영된다.

| 폴더 | 언어 | 용도 | 결과물 |
|---|---|---|---|
| [`data/`](data/) | Node (의존성 없음) | 캐릭터 목록 수집, nanoka.cc 시즌 버프 대조 | `web/src/data/characters.json`, `web/public/characters/` |
| [`portrait/`](portrait/) | Python (Pillow, numpy) | 공식 아이콘이 나오기 전 임시 초상화 누끼 | `web/public/characters/<id>.png` |

각 도구는 스크립트 위치를 기준으로 경로를 찾으므로 repo 루트에서 실행하면 된다.
