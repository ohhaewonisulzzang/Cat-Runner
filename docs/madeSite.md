# GitHub Pages 배포 가이드

이 가이드는 **sanghyeon 브랜치**의 파일들을 GitHub Pages에 배포하는 방법을 설명합니다.

## 1. GitHub 저장소 설정

### 저장소 생성 및 푸시
```bash
# 현재 프로젝트를 GitHub에 푸시 (아직 하지 않았다면)
git remote add origin https://github.com/YOUR_USERNAME/cat-runner.git
git add .
git commit -m "Initial commit"
git push -u origin sanghyeon
```

## 2. GitHub Pages 활성화

### 방법 A: GitHub 웹사이트에서 설정
1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - Branch: `sanghyeon` 선택 (또는 `gh-pages` 브랜치)
   - 폴더: `/ (root)` 선택
5. **Save** 클릭

## 3. 배포 방법

**추천: 방법 A (가장 간단하고 빠름)**

### 방법 A: sanghyeon 브랜치 직접 배포

```bash
# 1. sanghyeon 브랜치에 있는지 확인
git branch

# 2. sanghyeon 브랜치가 아니라면 전환
git checkout sanghyeon

# 3. 변경사항 커밋 및 푸시
git add .
git commit -m "Deploy to GitHub Pages"
git push origin sanghyeon
```

**그 다음 GitHub에서 설정:**
1. GitHub 저장소 → **Settings** → **Pages**
2. **Source** → Branch: **sanghyeon** 선택, 폴더: **/ (root)** 선택
3. **Save** 클릭
4. 몇 분 후 `https://YOUR_USERNAME.github.io/cat-runner/` 에서 확인

### 방법 B: GitHub Actions를 사용한 자동 배포

`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - sanghyeon

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          publish_branch: gh-pages
```

이 설정으로 `sanghyeon` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

### 방법 C: gh-pages 패키지 사용

```bash
# 1. gh-pages 패키지 설치
npm install --save-dev gh-pages

# 2. package.json에 스크립트 추가
```

`package.json`에 추가:
```json
{
  "scripts": {
    "deploy": "gh-pages -d ./"
  }
}
```

```bash
# 3. 배포 실행
npm run deploy
```

## 4. 배포 후 확인

배포가 완료되면 다음 URL에서 확인 가능:
```
https://YOUR_USERNAME.github.io/cat-runner/
```

배포 상태 확인:
1. GitHub 저장소 → **Settings** → **Pages**
2. "Your site is live at ..." 메시지 확인

## 5. 문제 해결

### 페이지가 보이지 않는 경우
- GitHub Pages 설정에서 올바른 브랜치와 폴더가 선택되었는지 확인
- 배포 완료까지 1-2분 정도 소요될 수 있음
- `index.html` 파일이 루트 디렉토리에 있는지 확인

### 리소스 로딩 오류
- 상대 경로 사용: `./images/cat.png` (절대 경로 `/images/cat.png` 대신)
- `index.html`에서 리소스 경로 확인

### 커스텀 도메인 사용 (선택사항)
1. 저장소 루트에 `CNAME` 파일 생성
2. 도메인 이름 입력 (예: `www.example.com`)
3. DNS 설정에서 GitHub Pages로 CNAME 레코드 추가

## 6. 업데이트 배포

```bash
# sanghyeon 브랜치에서 변경사항 커밋 및 푸시
git add .
git commit -m "Update game"
git push origin sanghyeon

# GitHub Pages가 sanghyeon 브랜치로 설정되어 있다면 자동으로 배포됩니다
# 또는 GitHub Actions를 사용했다면 자동으로 gh-pages 브랜치에 배포됩니다
```
