# DealSense 데이터 소스 가이드

## 📊 권장 데이터 소스 (우선순위)

### ⭐ 1단계: 공식 API (가장 안전, 추천)

#### 네이버 쇼핑 API
- **무료**: 하루 25,000건
- **신청**: https://developers.naver.com/
- **문서**: https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md
- **장점**: 공식 API, 안정적, 법적 문제 없음
- **데이터**: 상품명, 가격, 할인가, 쇼핑몰, 카테고리, 리뷰

**설정 방법**:
```bash
# .env 파일에 추가
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

**사용 예시**:
```bash
# 스케줄러 실행 (30분마다)
npm run ingest
```

#### 카카오 API
- **검색 API**: https://developers.kakao.com/
- 현재 쇼핑 전용 API는 제한적
- 검색 API로 간접 활용 가능

#### 쿠팡 파트너스 API
- **링크**: https://partners.coupang.com/
- **장점**: 제휴 수익 발생 가능, 공식 API
- **데이터**: 베스트셀러, 특가, 카테고리별 상품
- **주의**: 제휴 승인 필요

---

### 🔶 2단계: 공개 RSS Feed (합법, 안전)

#### 뽐뿌 (ppomppu.co.kr)
```
RSS URL: https://www.ppomppu.co.kr/rss.php?id=ppomppu
공개 피드, 별도 인증 불필요
```

#### 클리앙 핫딜
```
RSS URL: https://www.clien.net/service/rss/jirum
공개 피드
```

#### 루리웹 핫딜
```
RSS URL: https://bbs.ruliweb.com/market/board/1020?rss=1
공개 피드
```

**장점**:
- 법적 문제 없음 (공개 RSS)
- 실시간 커뮤니티 핫딜 정보
- 안정적인 데이터 포맷

**구현 완료**: `src/ingest/sources/ppomppuRSS.ts`

---

### ⚠️ 3단계: 웹 크롤링 (주의 필요)

**반드시 확인**:
1. `robots.txt` 확인
2. 요청 간격 준수 (최소 1초)
3. User-Agent 명시
4. 서비스 약관 확인

**예시 (교육 목적)**:
```typescript
// 1. robots.txt 확인
GET https://example.com/robots.txt

// 2. 요청 간격 준수
await new Promise(resolve => setTimeout(resolve, 1000));

// 3. User-Agent 명시
headers: {
  'User-Agent': 'DealSense/1.0 (Educational; +https://github.com/...)'
}
```

**법적 리스크**:
- 서비스 약관 위반 가능성
- 과도한 요청 시 IP 차단
- 데이터 저작권 문제

---

## 🚀 실제 운영 방안

### Phase 1: MVP (최소 기능 제품)
```
네이버 쇼핑 API + 뽐뿌 RSS
↓
하루 1-2회 수집
↓
100-200개 딜 유지
```

### Phase 2: 확장
```
+ 클리앙/루리웹 RSS
+ 쿠팡 파트너스 API
↓
30분마다 수집
↓
500-1000개 딜 유지
```

### Phase 3: 고도화
```
+ 카테고리별 인기도 분석
+ 가격 변동 추적
+ 사용자 피드백 반영
```

---

## 📦 필요한 패키지 설치

```bash
npm install axios rss-parser cheerio
npm install -D @types/cheerio
```

---

## ⏰ Cron 설정 (자동 수집)

### 로컬/서버에서 cron 사용
```bash
# crontab -e
# 30분마다 실행
*/30 * * * * cd /path/to/dealsense-mcp && npm run ingest >> /var/log/dealsense-ingest.log 2>&1
```

### Render.com에서
- Render Cron Jobs 사용 (유료 플랜)
- 또는 GitHub Actions로 30분마다 API 호출

### GitHub Actions 예시
```yaml
# .github/workflows/ingest.yml
name: Data Ingestion
on:
  schedule:
    - cron: '*/30 * * * *'  # 30분마다
  workflow_dispatch:  # 수동 실행 가능

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run ingest
        env:
          NAVER_CLIENT_ID: ${{ secrets.NAVER_CLIENT_ID }}
          NAVER_CLIENT_SECRET: ${{ secrets.NAVER_CLIENT_SECRET }}
          DATABASE_PATH: ./data/deals.db
```

---

## 🛡️ 법적 고려사항

### ✅ 안전한 방법
- 공식 API 사용
- 공개 RSS 피드 활용
- robots.txt 준수
- 요청 제한 준수

### ❌ 위험한 방법
- 무단 크롤링
- 과도한 요청
- 데이터 재판매
- 서비스 약관 위반

### 📝 권장사항
1. **공식 API 우선** 사용
2. **약관 확인** 필수
3. **Rate Limiting** 준수
4. **User-Agent** 명시
5. **교육/비영리** 목적 명시

---

## 📈 데이터 품질 관리

### 수집 후 처리
```typescript
1. 정규화 (normalize)
2. 중복 제거 (dedupe by fingerprint)
3. 신뢰도 점수 계산 (trust score)
4. 카테고리 자동 분류
5. 가격 유효성 검증
```

### 주기적 정리
```typescript
// 7일 이상 된 딜 삭제
DELETE FROM deals WHERE posted_at < datetime('now', '-7 days');

// 품절/만료 딜 제거
// (실제 구현 시 상태 체크 로직 추가)
```

---

## 🎯 권장 시작 방법

1. **네이버 쇼핑 API 신청** (5분)
2. **뽐뿌 RSS 연동** (즉시 가능)
3. **스케줄러 설정** (로컬 테스트)
4. **데이터 품질 확인**
5. **Cron으로 자동화**

---

## 📞 지원

- 네이버 API: https://developers.naver.com/docs/common/openapiguide/
- RSS 표준: https://www.rssboard.org/rss-specification
- 법적 문의: 전문가 상담 권장

---

**중요**: 이 가이드는 교육 목적이며, 실제 운영 시 반드시 각 서비스의 약관을 확인하세요.
