# 큰은혜교회 소년부 (v1.1.0)

출석부 + 달란트 통장 PWA. **TypeScript 마이그레이션 완료.**

---

## 빠른 시작

```bash
npm install
npm run dev
```

`vite.config.ts`에 `server: { host: true }` 기본 설정되어 있어서 폰에서도 바로 접속 가능 (같은 와이파이 + Network 주소로).

```bash
npm run build       # tsc + vite build
npm run type-check  # 타입 검사만
npm run preview     # 빌드 결과 미리보기
```

---

## v1.1.0 변경사항

### TypeScript 마이그레이션
- 모든 `.jsx` → `.tsx`, `.js` → `.ts`
- 공통 타입은 `src/types.ts`에 중앙 관리
- `tsconfig.json` strict 모드
- `npm run build`가 `tsc` 타입 체크 후 vite 빌드

### 학년 표시 개선
- "6"으로 입력해도 표시는 "6학년"으로 자동
- 기존 데이터에 "6학년"으로 저장되어 있어도 그대로 표시
- 유틸: `src/utils/format.ts` → `formatGrade()`

### 전화번호 입력 UX
- `<PhoneInput />` 컴포넌트 신규
- 타이핑하는 동안 자동으로 `010-1234-5678` 포맷
- 모바일에서 숫자 키패드 (`inputMode="numeric"`)
- `02` 서울 지역번호도 지원 (`02-XXX(X)-XXXX`)

### 전화번호부 연동
- **가져오기**: 학생/선생님 추가 모달의 전화번호 입력칸 옆 버튼.
  - Web Contact Picker API 사용
  - **Chrome on Android에서만 작동** (iOS Safari 미지원, 데스크톱 미지원)
  - 미지원 환경에선 버튼 자체가 표시되지 않음
- **저장**: 학생 상세 페이지의 전화번호 옆 다운로드 아이콘.
  - vCard(`.vcf`) 파일 다운로드
  - iOS, Android, 데스크톱 모두 동작
  - 폰에선 자동으로 "연락처에 추가" 제안

### PDF 한글 깨짐 해결
- 기존: `jsPDF`가 한글 글리프 없는 Helvetica를 써서 ▯▯▯로 출력됨
- 변경: `html2canvas` + `jsPDF` 조합 — Pretendard 폰트 적용된 HTML을 캔버스로 떠서 이미지로 PDF에 박음
- 단점: 텍스트 선택 안 됨 (이미지니까). 출력 품질은 우수
- `html2canvas`는 동적 import로 PDF 생성 시에만 로드 → 초기 번들엔 영향 없음

---

## 기존 데이터 호환

`localStorage` key는 그대로 (`amazingGraceSundaySchool`).
- 학년 데이터: 기존 "6학년" 그대로 / 신규 "6" 모두 작동
- 전화번호: 기존 미포맷 데이터도 표시할 때 자동 포맷팅
- 누락된 필드는 storage.ts가 기본값으로 채워줌

---

## 폰에서 테스트

1. PC와 폰이 같은 와이파이
2. PC에서 `npm run dev` → "Network: http://192.168.x.x:5173/" 표시되는 주소 확인
3. 폰 브라우저에서 그 주소 열기
4. (안 열리면) 윈도우 방화벽이 5173 포트 막고 있을 수 있음 → 허용

---

## 의존성

- React 18 + Vite 5 + TypeScript 5
- React Router 6
- jsPDF + html2canvas (PDF)
- date-fns
- vite-plugin-pwa (PWA)

---

## 폴더 구조

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── vite-env.d.ts
├── types.ts                # 공통 타입
├── components/
│   ├── Navbar.tsx
│   ├── Modal.tsx
│   ├── InstallPrompt.tsx
│   └── PhoneInput.tsx      # NEW
├── pages/
│   ├── AttendancePage.tsx
│   ├── TalentPage.tsx
│   ├── EventPage.tsx
│   ├── SettingsPage.tsx
│   └── StudentDetail.tsx
├── hooks/
│   └── useInstallPrompt.ts
└── utils/
    ├── storage.ts
    ├── format.ts           # NEW: formatGrade, formatPhone
    ├── contacts.ts         # NEW: vCard, Contact Picker
    └── pdf.ts              # NEW: 한글 PDF 생성
```
