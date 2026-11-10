"""임시 누끼 결과를 공식 아이콘(정답)과 비교 채점. cutout.py 기본값을 조정할 때 사용.

  python3 tools/portrait/score.py <공식 아이콘> <비교할 누끼> [<비교할 누끼> ...]

- 실루엣IoU: 알파 0.5 기준 실루엣 일치율 (1에 가까울수록 좋음)
- 구멍px: 공식은 불투명인데 뚫린 픽셀
- 흰테두리px: 어두운 카드 위에서 공식보다 확 밝게 튀는 픽셀 (헤일로)
- 넘친px: 공식은 투명인데 남은 픽셀
- 알파오차 / 어두운배경오차: 평균 차이 (낮을수록 좋음)
"""
import sys
import numpy as np
from PIL import Image

ref = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(float)
ra = ref[..., 3] / 255
DARK = np.array([20, 20, 26.0])


def on_dark(x):
    a = x[..., 3:4] / 255
    return x[..., :3] * a + DARK * (1 - a)


rd = on_dark(ref)
print(f'{"파일":28s} {"실루엣IoU":>9s} {"구멍px":>7s} {"흰테두리px":>9s} {"넘친px":>7s} {"알파오차":>8s} {"어두운배경오차":>12s}')
for path in sys.argv[2:]:
    t = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    ta = t[..., 3] / 255
    S_ref, S_t = ra >= 0.5, ta >= 0.5
    iou = (S_ref & S_t).sum() / (S_ref | S_t).sum()
    holes = int(((ra >= 0.99) & (ta < 0.5)).sum())                   # 정답은 불투명인데 뚫림
    td = on_dark(t)
    lum_t, lum_r = td.mean(axis=2), rd.mean(axis=2)
    halo = int(((lum_t - lum_r) > 60).sum())                          # 어두운 카드에서 정답보다 확 밝게 튀는 픽셀
    spill = int(((ra < 0.1) & (ta >= 0.5)).sum())                     # 정답은 투명인데 남음
    aerr = np.abs(ra - ta)[(ra > 0) | (ta > 0)].mean()
    derr = np.abs(td - rd).mean()
    print(f'{path:28s} {iou:9.3f} {holes:7d} {halo:9d} {spill:7d} {aerr:8.3f} {derr:12.2f}')
