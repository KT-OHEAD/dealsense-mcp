import { insertDeal, getAllDeals } from './dealsRepo.js';
import { upsertProfile, listProfiles } from './profilesRepo.js';
import { generateFingerprint } from '../core/dedupe.js';
import { calculateTrustScore } from '../core/scoring.js';
import type { DealRecord } from './dealsRepo.js';

export function seedDatabase(): void {
  // Check if already seeded
  const existingDeals = getAllDeals();
  const existingProfiles = listProfiles();

  if (existingDeals.length > 0 || existingProfiles.length > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Seed deals
  const deals = generateSampleDeals();
  for (const deal of deals) {
    insertDeal(deal);
  }

  // Seed profiles
  upsertProfile({
    profile_id: 'p_camping_user',
    categories: ['캠핑', '아웃도어'],
    keywords: ['텐트', '침낭', '랜턴', '코펠'],
    brands: ['코베아', '스노우피크'],
    price_max: 50000,
    min_discount_rate: 20,
    exclude_keywords: ['중고', '리퍼'],
  });

  upsertProfile({
    profile_id: 'p_kitchen_user',
    categories: ['주방', '생활'],
    keywords: ['냄비', '프라이팬', '에어프라이어'],
    brands: ['쿠쿠'],
    price_max: 30000,
    min_discount_rate: null,
    exclude_keywords: ['리퍼'],
  });

  console.log(`Seeded ${deals.length} deals and 2 profiles`);
}

function generateSampleDeals(): DealRecord[] {
  const now = new Date();
  const deals: DealRecord[] = [];

  // Camping deals
  const campingDeals = [
    {
      title: '코베아 2인용 텐트 초특가',
      price_current: 45000,
      price_original: 89000,
      category: '캠핑',
      merchant: '캠핑코리아',
      keywords: ['텐트'],
    },
    {
      title: '스노우피크 침낭 겨울용 무료배송',
      price_current: 120000,
      price_original: 180000,
      category: '캠핑',
      merchant: '아웃도어플라자',
      keywords: ['침낭'],
    },
    {
      title: 'LED 캠핑 랜턴 3개세트 쿠폰적용',
      price_current: 25000,
      price_original: 45000,
      category: '캠핑',
      merchant: '11번가',
      keywords: ['랜턴'],
    },
    {
      title: '티타늄 코펠 세트 옵션선택',
      price_current: 38000,
      price_original: 58000,
      category: '캠핑',
      merchant: '지마켓',
      keywords: ['코펠', '옵션'],
    },
    {
      title: '캠핑용 접이식 테이블 특가',
      price_current: 32000,
      price_original: 52000,
      category: '캠핑',
      merchant: '쿠팡',
      keywords: ['테이블'],
    },
    {
      title: '코베아 버너 리퍼상품',
      price_current: 28000,
      price_original: 65000,
      category: '캠핑',
      merchant: '캠핑마트',
      keywords: ['버너', '리퍼'],
    },
    {
      title: '캠핑 의자 2+1 이벤트',
      price_current: 19000,
      price_original: 39000,
      category: '캠핑',
      merchant: '네이버쇼핑',
      keywords: ['의자'],
    },
    {
      title: '백패킹 침낭 중고급',
      price_current: 42000,
      price_original: 95000,
      category: '캠핑',
      merchant: '중고나라',
      keywords: ['침낭', '중고'],
    },
  ];

  // Kitchen deals
  const kitchenDeals = [
    {
      title: '쿠쿠 전기압력밥솥 6인용 핫딜',
      price_current: 89000,
      price_original: 150000,
      category: '주방',
      merchant: '쿠팡',
      keywords: ['밥솥'],
    },
    {
      title: '스테인리스 냄비세트 10종 무료배송',
      price_current: 28000,
      price_original: 58000,
      category: '주방',
      merchant: 'SSG',
      keywords: ['냄비'],
    },
    {
      title: '에어프라이어 5L 대용량 특가',
      price_current: 45000,
      price_original: 89000,
      category: '주방',
      merchant: '11번가',
      keywords: ['에어프라이어'],
    },
    {
      title: '세라믹 프라이팬 3종세트 옵션',
      price_current: 19000,
      price_original: 35000,
      category: '주방',
      merchant: '지마켓',
      keywords: ['프라이팬', '옵션'],
    },
    {
      title: '쿠쿠 믹서기 리퍼상품',
      price_current: 32000,
      price_original: 78000,
      category: '주방',
      merchant: '인터파크',
      keywords: ['믹서기', '리퍼'],
    },
    {
      title: '주방용품 복주머니 랜덤발송',
      price_current: 9900,
      price_original: 30000,
      category: '주방',
      merchant: '티몬',
      keywords: ['랜덤'],
    },
    {
      title: '전기포트 1.7L 당일배송',
      price_current: 15000,
      price_original: 28000,
      category: '주방',
      merchant: '쿠팡',
      keywords: ['포트'],
    },
  ];

  // Tech deals
  const techDeals = [
    {
      title: '삼성 무선이어폰 갤럭시버즈',
      price_current: 68000,
      price_original: 120000,
      category: '테크',
      merchant: '네이버쇼핑',
      keywords: ['이어폰'],
    },
    {
      title: 'Apple 에어팟 프로 2세대 품절임박',
      price_current: 289000,
      price_original: 359000,
      category: '테크',
      merchant: '애플스토어',
      keywords: ['에어팟', '품절'],
    },
    {
      title: 'LG 모니터 27인치 IPS 핫딜',
      price_current: 159000,
      price_original: 289000,
      category: '테크',
      merchant: '컴퓨존',
      keywords: ['모니터'],
    },
    {
      title: '기계식키보드 청축 RGB 특가',
      price_current: 42000,
      price_original: 89000,
      category: '테크',
      merchant: '다나와',
      keywords: ['키보드'],
    },
    {
      title: '게이밍마우스 로지텍 중고A급',
      price_current: 28000,
      price_original: 75000,
      category: '테크',
      merchant: '중고장터',
      keywords: ['마우스', '중고'],
    },
    {
      title: 'USB-C 허브 8포트 해외배송',
      price_current: 18000,
      price_original: 38000,
      category: '테크',
      merchant: '알리익스프레스',
      keywords: ['허브', '해외배송'],
    },
    {
      title: '삼성 외장SSD 1TB 무료배송',
      price_current: 78000,
      price_original: 130000,
      category: '테크',
      merchant: 'SSG',
      keywords: ['SSD'],
    },
  ];

  // Lifestyle deals
  const lifestyleDeals = [
    {
      title: '프리미엄 수건세트 10장 호텔용',
      price_current: 19000,
      price_original: 45000,
      category: '생활',
      merchant: '쿠팡',
      keywords: ['수건'],
    },
    {
      title: '세탁세제 대용량 6L 특가',
      price_current: 12000,
      price_original: 22000,
      category: '생활',
      merchant: '홈플러스',
      keywords: ['세제'],
    },
    {
      title: 'LED 스탠드 눈보호 학생용',
      price_current: 23000,
      price_original: 48000,
      category: '생활',
      merchant: '11번가',
      keywords: ['스탠드'],
    },
    {
      title: '공기청정기 소형 예약배송',
      price_current: 55000,
      price_original: 98000,
      category: '생활',
      merchant: '지마켓',
      keywords: ['공기청정기', '예약'],
    },
    {
      title: '행거 10개입 옷걸이세트',
      price_current: 8900,
      price_original: 18000,
      category: '생활',
      merchant: '다이소온라인',
      keywords: ['행거'],
    },
  ];

  // Parenting deals
  const parentingDeals = [
    {
      title: '분유 3단계 800g 6캔 무료배송',
      price_current: 98000,
      price_original: 140000,
      category: '육아',
      merchant: '맘스맘',
      keywords: ['분유'],
    },
    {
      title: '기저귀 밴드형 신생아 4팩',
      price_current: 42000,
      price_original: 68000,
      category: '육아',
      merchant: '쿠팡',
      keywords: ['기저귀'],
    },
    {
      title: '유모차 절충형 리퍼상품',
      price_current: 158000,
      price_original: 380000,
      category: '육아',
      merchant: '중고마켓',
      keywords: ['유모차', '리퍼'],
    },
    {
      title: '아기띠 신생아용 옵션확인',
      price_current: 35000,
      price_original: 78000,
      category: '육아',
      merchant: '지마켓',
      keywords: ['아기띠', '옵션'],
    },
    {
      title: '젖병소독기 UV 살균 특가',
      price_current: 45000,
      price_original: 89000,
      category: '육아',
      merchant: '네이버쇼핑',
      keywords: ['소독기'],
    },
  ];

  // Fashion deals
  const fashionDeals = [
    {
      title: '나이키 운동화 에어맥스 핫딜',
      price_current: 79000,
      price_original: 139000,
      category: '패션',
      merchant: '무신사',
      keywords: ['운동화'],
    },
    {
      title: '아디다스 후드티 3종 옵션',
      price_current: 38000,
      price_original: 79000,
      category: '패션',
      merchant: 'SSG',
      keywords: ['후드', '옵션'],
    },
    {
      title: '청바지 스키니핏 배송비별도',
      price_current: 22000,
      price_original: 58000,
      category: '패션',
      merchant: '패션플러스',
      keywords: ['청바지', '배송비별도'],
    },
    {
      title: '겨울패딩 구스다운 품절임박',
      price_current: 128000,
      price_original: 298000,
      category: '패션',
      merchant: '쿠팡',
      keywords: ['패딩', '품절'],
    },
    {
      title: '가죽벨트 남성용 2+1',
      price_current: 15000,
      price_original: 35000,
      category: '패션',
      merchant: '11번가',
      keywords: ['벨트'],
    },
  ];

  // Combine all
  const allDeals = [
    ...campingDeals,
    ...kitchenDeals,
    ...techDeals,
    ...lifestyleDeals,
    ...parentingDeals,
    ...fashionDeals,
  ];

  // Generate deal records
  for (let i = 0; i < allDeals.length; i++) {
    const template = allDeals[i];
    const discount_rate =
      template.price_original && template.price_current
        ? Math.round(
            ((template.price_original - template.price_current) / template.price_original) * 100
          )
        : null;

    // Vary posting time
    const hoursAgo = Math.floor(Math.random() * 168); // Up to 7 days
    const posted_at = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

    const deal: DealRecord = {
      deal_id: `d_${String(i + 1).padStart(4, '0')}`,
      title: template.title,
      price_current: template.price_current,
      price_original: template.price_original,
      discount_rate,
      source: i % 3 === 0 ? 'community' : i % 3 === 1 ? 'shop' : 'manual',
      merchant: template.merchant,
      url: `https://example.com/deals/${i + 1}`,
      category: template.category,
      posted_at,
      fingerprint: '',
      popularity_score: 0.2 + Math.random() * 0.75,
      trust_score: 0,
      extra_json: JSON.stringify({
        conditions: ['온라인 한정', '일부 옵션 제외'],
        shipping_info: template.keywords.includes('무료배송') ? '무료배송' : '배송비 별도',
      }),
    };

    // Generate fingerprint
    deal.fingerprint = generateFingerprint(deal);

    // Calculate trust score
    deal.trust_score = calculateTrustScore(deal);

    deals.push(deal);
  }

  return deals;
}
