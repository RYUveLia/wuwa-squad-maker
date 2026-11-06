<!-- ~/personal/AGENTS.md 사본(회사 식별 정보 제거본): ~/personal 하위 모든 개인 repo 공통 지시사항. 원본 수정 시 함께 갱신하되, public repo이므로 회사 email/org는 넣지 말 것 -->

# 개인 repo 작업 지침 (커밋 주의사항)

이 폴더(`~/personal/`)는 **개인 GitHub 계정 전용** 공간입니다.
회사 계정(회사 email, 회사 GitHub org)과 반드시 분리되어야 합니다.

## 계정 정보

| 항목 | 값 |
|---|---|
| 커밋 email | `ryul3024@gmail.com` |
| 커밋 name | `Raul Hyun` |
| GitHub 계정 | `RYUveLia` |
| GPG 서명 | **OFF** (개인 커밋은 서명하지 않음) |
| SSH 키 | `~/.ssh/id_ed25519_personal` |
| SSH host alias | `github.com-personal` |

## 자동으로 되는 것 (identity)

`~/.gitconfig`의 `includeIf "gitdir:~/personal/"` → `~/.gitconfig-personal` 설정에 의해,
이 폴더 안의 모든 repo는 **자동으로** 개인 email + name + 서명 OFF가 적용됩니다.
`git config user.email` 이 `ryul3024@gmail.com` 로 나오면 정상입니다.

## ⚠️ 반드시 지킬 것 — remote URL

**push가 개인 계정으로 가는지는 폴더가 아니라 remote URL이 결정합니다.**
개인 repo는 반드시 `github.com-personal` alias로 clone/설정해야 합니다.

```bash
# 새로 clone
cd ~/personal
git clone git@github.com-personal:RYUveLia/<repo>.git

# 기존 repo의 remote 교정
git remote set-url origin git@github.com-personal:RYUveLia/<repo>.git
```

### 금지 패턴 (회사 인증으로 새는 경우)

- ❌ `git@github.com:...`      ← 회사 SSH/인증 경로
- ❌ `https://github.com/...`  ← 회사 HTTPS credential 사용
- ✅ `git@github.com-personal:...`

## 커밋 전 셀프 체크 (세션이 확인할 것)

새 repo이거나 remote가 의심스러우면 커밋/푸시 전에 아래를 확인하세요:

```bash
git config user.email        # → ryul3024@gmail.com 이어야 함
git config commit.gpgsign    # → false 이어야 함
git remote -v                # → git@github.com-personal:RYUveLia/... 이어야 함
```

셋 중 하나라도 회사 값이면 커밋하지 말고 먼저 교정할 것.

## 절대 하지 말 것

- 이 폴더 안 커밋에 회사 email이나 회사 GPG 서명을 붙이지 말 것.
- 개인 프로젝트를 `~/Github/` 아래에 만들지 말 것 (거기선 회사 identity가 자동 적용됨).
- `~/.gitconfig-personal`, `~/.ssh/config`, `~/.ssh/id_ed25519_personal*` 를 임의로 변경/삭제하지 말 것.

## 연결 확인

```bash
ssh -T git@github.com-personal
# → "Hi RYUveLia! ..." 가 나오면 정상 (exit code 1은 GitHub SSH 정상 동작)
```
