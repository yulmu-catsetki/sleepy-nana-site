# sleepy nana ⋆˚

졸린 나나(Hanako Nana)를 만지고 깨우는 인터랙티브 웹페이지.

- **Artwork / Animation**: [@mianrii_0](https://x.com/mianrii_0)
- **Character**: Hanako Nana (Stellive)
- **Runtime**: [Rive](https://rive.app) Web (canvas) v2.37.6

## 파일 구성

```
sleepy-nana-site/
├─ index.html        # 페이지 마크업 + 스타일
├─ app.js            # Rive 로딩 + ViewModel 바인딩 + HUD 폴링
├─ sleepy_nana.riv   # Rive 애니메이션 파일
├─ vercel.json       # Vercel 배포 설정 (캐시 + MIME)
└─ .nojekyll         # GitHub Pages용
```

## 로컬에서 테스트하기

`.riv` 파일을 로드하려면 **반드시 로컬 웹서버**가 필요합니다 (`file://`로는 CORS 때문에 안 됨).

Python 3:
```bash
cd sleepy-nana-site
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 열기
```

Node.js:
```bash
npx serve sleepy-nana-site
```

## 배포 방법

### A. Vercel (제일 빠름)

1. [vercel.com](https://vercel.com) 가입 (GitHub로 로그인 추천)
2. **방법 1 — CLI**:
   ```bash
   npm i -g vercel
   cd sleepy-nana-site
   vercel
   ```
   질문에 답하면(`? Set up and deploy "./"` → Y, project name 등) 바로 URL 받음.

3. **방법 2 — Drag & Drop**:
   - Vercel 대시보드 → "Add New..." → "Project"
   - 또는 [vercel.com/new](https://vercel.com/new) 에서 폴더를 직접 끌어다 놓기

4. **방법 3 — GitHub 연동 (추천)**:
   - 이 폴더 내용을 GitHub repo에 push
   - Vercel 대시보드 → Import → repo 선택 → Deploy
   - 이후엔 push할 때마다 자동 재배포

자동으로 `https://your-project.vercel.app` 형태의 URL이 나옵니다. 커스텀 도메인도 무료로 연결 가능.

### B. GitHub Pages

1. GitHub에 새 public repo 만들기 (예: `sleepy-nana`)
2. 이 폴더 내용을 repo 루트에 push:
   ```bash
   cd sleepy-nana-site
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sleepy-nana.git
   git push -u origin main
   ```
3. Repo → **Settings** → **Pages**
4. Source: **Deploy from a branch**
5. Branch: `main` / 폴더: `/ (root)` → **Save**
6. 1~2분 뒤 `https://YOUR_USERNAME.github.io/sleepy-nana/` 로 접속

> ⚠️ GitHub Pages는 `.riv` 파일에 대해 `Content-Type: application/octet-stream`을 자동으로 잘 보내주는 편이라 그대로 작동합니다. `.nojekyll` 파일이 함께 있어야 처리 안정성이 좋습니다.

### C. Netlify

[app.netlify.com/drop](https://app.netlify.com/drop) 에서 폴더를 끌어다 놓으면 끝.

## Rive 파일 구조 (참고)

- **Artboard**: `Artboard` (default)
- **State Machine**: `State Machine 1`
- **ViewModel**: `ViewModel1`
  - `dragTarget` (Number) — Pointer Drag 시 100, Pointer Up 시 0으로 set
- **Converter Group**: `smoothDrag` (Interpolator 500ms Ease Out) → `Formula 1` (round)

JS 쪽에서는 `autoBind: true`로 기본 ViewModel 인스턴스가 자동으로 바인딩되며, `r.viewModelInstance.number('dragTarget')`로 현재 값을 읽어 HUD에 표시합니다.

## 라이선스 / 크레딧

- 캐릭터 IP: Stellive (Hanako Nana)
- 아트워크 / 애니메이션: @mianrii_0
- 코드: 자유롭게 변형하셔도 됩니다.
