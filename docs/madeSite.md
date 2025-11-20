# GitHub Pages 배포 가이드

## 1. GitHub 저장소 설정

### 저장소 생성 및 푸시
```bash
# 현재 프로젝트를 GitHub에 푸시 (아직 하지 않았다면)
git remote add origin https://github.com/YOUR_USERNAME/cat-runner.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## 2. GitHub Pages 활성화

### 방법 A: GitHub 웹사이트에서 설정
1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - Branch: `gh-pages` 선택 (또는 `main` 브랜치의 `/docs` 폴더)
   - 폴더: `/ (root)` 선택
5. **Save** 클릭

## 3. 배포 방법

### 방법 A: 수동 배포 (gh-pages 브랜치 사용)

```bash
# 1. gh-pages 브랜치 생성 및 전환
git checkout -b gh-pages

# 2. 필요없는 파일 제거 (선택사항)
# 게임 실행에 필요한 파일만 남기기

# 3. 변경사항 커밋 및 푸시
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# 4. main 브랜치로 돌아가기
git checkout main
```

### 방법 B: GitHub Actions를 사용한 자동 배포

`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

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

이 설정으로 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

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
# 변경사항 커밋
git add .
git commit -m "Update game"
git push origin main

# 자동 배포 설정이 없다면 수동으로:
git checkout gh-pages
git merge main
git push origin gh-pages
git checkout main
```
