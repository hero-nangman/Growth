# 쿠팡 윙 스마트 분석기 - 웹앱 연동 버전

## 설치 방법

1. 이 폴더의 모든 파일을 다운로드하세요:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `icon.png`

2. Chrome에서 `chrome://extensions` 접속

3. 우측 상단 "개발자 모드" 활성화

4. "압축해제된 확장 프로그램을 로드합니다" 클릭

5. 다운로드한 폴더 선택

## 웹앱 연동 설정

1. `chrome://extensions`에서 익스텐션 ID 확인 (예: `abcdefghijklmnop...`)

2. 웹앱의 `src/lib/extensionBridge.ts` 파일에서 `EXTENSION_ID` 수정:
   ```javascript
   const EXTENSION_ID = '여기에_익스텐션_ID_입력';
   ```

## 기능 설명

### 기존 기능 (유지)
- 쿠팡 상품 페이지 방문 시 "📈 쿠팡 분석" 버튼 표시
- 버튼 클릭 시 Wing 데이터 분석 모달 표시

### 새 기능 (추가)
- 웹앱에서 URL 입력 시 익스텐션이 Wing API 호출
- 분석 결과를 웹앱으로 반환
- 서버 URL 설정 시 자동으로 서버에 데이터 전송

## 주의사항

- Wing 로그인 필요: https://wing.coupang.com 에 먼저 로그인
- Chrome 브라우저에서만 동작
- 웹앱은 manifest.json의 `externally_connectable.matches`에 등록된 도메인에서만 통신 가능
