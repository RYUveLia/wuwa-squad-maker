"""공식 아이콘이 나오기 전 임시 초상화 누끼 (단색 배경 정사각형 이미지 → 256×256 투명 PNG).

원칙 (릴리 임시 누끼를 공식 아이콘과 비교해서 얻은 것, README 참고)
1. 색이 아니라 모양으로 자른다: 지정한 테두리(기본 위·왼쪽·오른쪽)에서 이어진 배경만 지우고,
   실루엣 안쪽(흰 옷·하이라이트)은 지우지 않는다.
2. 머리카락 사이 1~4px 틈은 파내지 않는다: 실루엣을 닫아(closing) 덩어리로 둔다.
3. 머리카락·팔 사이에 원래부터 갇힌 순수 배경색 주머니는 지운다.
4. 경계 알파는 근처에서 가장 어두운 색(외곽 선화)을 기준으로 계산하고, 반투명 픽셀에서 배경색을 뺀다
   → 어두운 카드 위에서 흰 테두리(헤일로)가 생기지 않는다.
5. 색으로 구분할 수 없는 곳(흰 배경에 닿은 흰 꽃잎 등)은 --keep / --clear 힌트로 사람이 정한다.

사용법: README.md 참고
  python3 tools/portrait/cutout.py <입력> <출력.png> --preview <확인용.png> [--keep 'x,y,r;...'] [--clear 'x,y,r;...']
"""
import argparse
from collections import deque

import numpy as np
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('src'); p.add_argument('out')
p.add_argument('--size', type=int, default=256)
p.add_argument('--seed-edges', default='top,left,right')
p.add_argument('--bg-tol', type=float, default=18, help='배경색과의 최대 채널 차이 (이하면 배경 후보)')
p.add_argument('--close', type=int, default=2, help='실루엣 닫기 반경(px): 머리카락 틈 메우기')
p.add_argument('--min-island', type=int, default=6, help='이보다 작은 떠 있는 조각은 지움')
p.add_argument('--pocket-tol', type=float, default=6, help='갇힌 배경 주머니로 볼 배경색 차이')
p.add_argument('--pocket-min', type=int, default=12, help='갇힌 배경 주머니 최소 크기(px)')
p.add_argument('--pocket-near', type=int, default=8, help='바깥 배경에서 이 거리 이내의 주머니만')
p.add_argument('--band', type=int, default=3, help='색으로 알파를 계산하는 경계 띠 두께(px)')
p.add_argument('--keep', help="남길 곳 힌트 'x,y,r;x,y,r' (256 기준 좌표). 흰 꽃잎·흰 옷이 지워졌을 때")
p.add_argument('--clear', help="지울 곳 힌트 'x,y,r;...'. 머리카락 사이 배경이 남았을 때")
p.add_argument('--preview', help='확인용 이미지 경로 (어두운/자홍 배경 + 32px 좌표 격자)')
args = p.parse_args()

im = Image.open(args.src).convert('RGBA')
if im.width != im.height:
    p.error(f'정사각형 이미지만 지원합니다 (입력 {im.width}×{im.height}). 얼굴이 가운데 오도록 먼저 크롭하세요.')
if im.size != (args.size, args.size):
    im = im.resize((args.size, args.size), Image.LANCZOS)
a = np.asarray(im).astype(np.float64)
# 이미 투명도가 있으면 흰 배경에 합성 (이전 누끼의 증폭된 반투명 색을 원래대로 되돌림)
al = a[..., 3:4] / 255.0
rgb = a[..., :3] * al + 255.0 * (1 - al)
H, W = rgb.shape[:2]

# 배경색 = 지정 테두리 픽셀의 중앙값
edges = set(args.seed_edges.split(','))
border = []
if 'top' in edges: border += [(0, x) for x in range(W)]
if 'bottom' in edges: border += [(H - 1, x) for x in range(W)]
if 'left' in edges: border += [(y, 0) for y in range(H)]
if 'right' in edges: border += [(y, W - 1) for y in range(H)]
B = np.median(np.array([rgb[y, x] for y, x in border]), axis=0)
dist = np.abs(rgb - B).max(axis=2)            # 배경색과의 차이


def neighbors4(m):
    n = np.zeros_like(m)
    n[1:] |= m[:-1]; n[:-1] |= m[1:]; n[:, 1:] |= m[:, :-1]; n[:, :-1] |= m[:, 1:]
    return n


def dilate(m, r):
    for _ in range(r):
        m = m | neighbors4(m)
    return m


def erode(m, r):
    return ~dilate(~m, r)


def flood(mask, seeds):
    seen = np.zeros_like(mask); q = deque()
    for y, x in seeds:
        if mask[y, x] and not seen[y, x]:
            seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    return seen


def components(mask):
    lab = np.zeros((H, W), np.int32); n = 0
    for y, x in zip(*np.nonzero(mask)):
        if lab[y, x]:
            continue
        n += 1; lab[y, x] = n; q = deque([(y, x)])
        while q:
            cy, cx = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
    return lab, n


def distance_inside(m):
    """m 안쪽 픽셀이 m 바깥까지 몇 px 떨어져 있는지 (4-이웃 BFS)."""
    d = np.where(m, np.inf, 0.0); q = deque(zip(*np.nonzero(~m)))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and d[ny, nx] > d[y, x] + 1:
                d[ny, nx] = d[y, x] + 1; q.append((ny, nx))
    return d


# 1) 모양: 지정 테두리에서 이어진 배경만 배경
bg_like = dist <= args.bg_tol
bg_raw = flood(bg_like, border)
bg = bg_raw.copy()


def hint_regions(spec):
    """'x,y,r;x,y,r' → 각 점에서 반경 r 안의 배경색 영역(점과 이어진 것만)."""
    out = np.zeros((H, W), bool)
    yy, xx = np.mgrid[0:H, 0:W]
    for part in filter(None, (spec or '').split(';')):
        x, y, r = (int(v) for v in part.split(','))
        disk = (yy - y) ** 2 + (xx - x) ** 2 <= r * r
        out |= flood(bg_like & disk, [(y, x)])
    return out


keep = hint_regions(args.keep)                # 흰 꽃잎·흰 옷처럼 배경색인데 남겨야 하는 곳
clear = hint_regions(args.clear)              # 머리카락 사이 등 지워야 하는데 남은 곳
bg &= ~keep
# 머리카락·팔 사이에 원래부터 갇혀 있던 '순수 배경색' 주머니는 배경 (바깥 배경 가까이 + 일정 크기 이상)
# 흰 옷·하이라이트처럼 바깥 배경에서 먼 흰색은 남긴다
near_bg = dilate(bg, args.pocket_near)
pockets = np.zeros_like(bg)
lab, n = components(~bg_raw & (dist <= args.pocket_tol))
for i in range(1, n + 1):
    comp = lab == i
    if comp.sum() >= args.pocket_min and (comp & near_bg).sum() >= 0.5 * comp.sum():
        pockets |= comp
pockets = (pockets | clear) & ~keep
fg = ~bg & ~pockets
# 2) 실루엣 닫기(머리카락 사이 1~4px 틈 메우기) 후, 나머지 안쪽 구멍은 전부 전경
if args.close > 0:
    fg = (erode(dilate(fg, args.close), args.close) | fg) & ~pockets
fg = ~flood(~fg, border) | (fg & ~pockets)
fg &= ~pockets
bg = ~fg
# 떠 있는 작은 조각(잡티) 제거
lab, n = components(fg)
sizes = np.bincount(lab.ravel())
for i in range(1, n + 1):
    if sizes[i] < args.min_island:
        fg[lab == i] = False

# 3) 경계 알파: C = aF + (1-a)B 에서 a를 색으로 계산
#    F(순수 전경색)는 근처 전경 중 '가장 어두운' 색 = 외곽 선화 색. 안쪽 평균색을 쓰면 테두리가 하얗게 뜬다.
d_in = distance_inside(fg)                    # 전경 안쪽 거리 (경계 픽셀 = 1)
d_out = distance_inside(~fg)                  # 배경 쪽 거리 (경계 바로 바깥 = 1)
band = (fg & (d_in <= args.band)) | (~fg & (d_out <= 1))
lum = rgb.mean(axis=2)
R = args.band
F = rgb.copy(); best = np.full((H, W), np.inf)
for dy in range(-R, R + 1):
    for dx in range(-R, R + 1):
        if dy * dy + dx * dx > R * R:
            continue
        ys0, ys1 = max(0, -dy), min(H, H - dy); xs0, xs1 = max(0, -dx), min(W, W - dx)
        src_ok = fg[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx]
        src_l = np.where(src_ok, lum[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx], np.inf)
        upd = src_l < best[ys0:ys1, xs0:xs1]
        best[ys0:ys1, xs0:xs1][upd] = src_l[upd]
        F[ys0:ys1, xs0:xs1][upd] = rgb[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx][upd]
dv = F - B; den = (dv * dv).sum(axis=2)
alpha_c = np.clip(((rgb - B) * dv).sum(axis=2) / np.maximum(den, 1e-6), 0, 1)
weak = den < 900                              # 배경과 거의 같은 색(흰 옷 가장자리): 색으로 판단 불가
alpha = np.where(fg, 1.0, 0.0)
alpha = np.where(band & ~weak, alpha_c, alpha)
alpha = np.where(band & weak & ~fg, 0.0, alpha)
# 밝은 하이라이트가 경계 근처에 있어도 뚫리지 않게: 안쪽으로 들어갈수록 최소 알파 보장
floor = np.where(fg, np.clip((d_in - 1) / max(args.band - 1, 1), 0, 1), 0)
alpha = np.maximum(alpha, floor)
alpha[alpha < 0.08] = 0

# 4) 색 오염 제거: 반투명 픽셀은 배경을 빼서 원래 색 복원(역산), 알파가 낮으면 선화 색 F 사용
semi = (alpha > 0) & (alpha < 1)
inv = np.clip((rgb - (1 - alpha[..., None]) * B) / np.maximum(alpha[..., None], 1e-6), 0, 255)
w = np.clip((alpha - 0.5) / 0.4, 0, 1)[..., None]
out_rgb = np.where(semi[..., None], w * inv + (1 - w) * F, rgb)
out_rgb[alpha == 0] = 0
res = np.dstack([np.clip(out_rgb, 0, 255), alpha * 255]).round().astype(np.uint8)
Image.fromarray(res, 'RGBA').save(args.out, optimize=True)
A = res[..., 3]
if args.preview:
    from PIL import ImageDraw
    S = 3
    cut = Image.fromarray(res, 'RGBA')
    panels = []
    for color in ((20, 20, 26), (255, 0, 255)):
        bgim = Image.new('RGBA', cut.size, color + (255,)); bgim.alpha_composite(cut)
        big = bgim.convert('RGB').resize((W * S, H * S), Image.NEAREST)
        d = ImageDraw.Draw(big)
        for v in range(0, args.size, 32):
            d.line([(v * S, 0), (v * S, H * S)], fill=(0, 200, 255)); d.line([(0, v * S), (W * S, v * S)], fill=(0, 200, 255))
            d.text((v * S + 2, 2), str(v), fill=(0, 255, 255)); d.text((2, v * S + 2), str(v), fill=(0, 255, 255))
        panels.append(big)
    sheet = Image.new('RGB', (W * S * 2 + 8, H * S), (80, 80, 80))
    sheet.paste(panels[0], (0, 0)); sheet.paste(panels[1], (W * S + 8, 0))
    sheet.save(args.preview)
print(f'{args.out}: bg={tuple(int(v) for v in B)} transparent={(A == 0).sum()} opaque={(A == 255).sum()} semi={((A > 0) & (A < 255)).sum()}')
