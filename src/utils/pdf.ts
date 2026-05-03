/**
 * 달란트 집계 PDF 생성.
 *
 * 기존 jsPDF + jspdf-autotable 방식은 한글 글리프가 없어서 ▯▯▯로 깨짐.
 * 해결책: html2canvas로 Pretendard 폰트 그대로 적용된 HTML을 이미지로 변환 →
 * jsPDF에 이미지로 박음. 텍스트 선택은 안 되지만 출력 품질은 최고.
 *
 * html2canvas와 jsPDF는 동적 import로 첫 PDF 생성 시에만 로드 → 초기 번들에 영향 없음.
 */

export interface PdfSummaryItem {
  name: string
  total: number
  activities: Record<string, number>
}

export interface PdfOptions {
  summary: PdfSummaryItem[]
  monthLabel: string      // "2026년 5월"
  studentLabel: string    // "전체 학생" 또는 학생 이름
}

export async function generateTalentPDF(options: PdfOptions): Promise<void> {
  const { summary, monthLabel, studentLabel } = options

  if (summary.length === 0) {
    throw new Error('출력할 데이터가 없습니다')
  }

  // 동적 import — PDF 생성 클릭 시에만 로드
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  // 임시 컨테이너 생성 (화면 밖 위치)
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '794px',                     // A4 width @ 96dpi
    padding: '40px',
    backgroundColor: '#ffffff',
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
    color: '#0F172A',
    fontSize: '13px',
    lineHeight: '1.6',
  } satisfies Partial<CSSStyleDeclaration>)

  const grandTotal = summary.reduce((sum, item) => sum + item.total, 0)
  const generatedAt = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  container.innerHTML = `
    <!-- 헤더 -->
    <div style="border-bottom: 3px solid #0F172A; padding-bottom: 20px; margin-bottom: 28px;">
      <div style="display: flex; align-items: baseline; justify-content: space-between;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
            큰은혜교회 소년부
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748B; font-weight: 500;">
            달란트 통장 집계 · ${escapeHtml(monthLabel)}
          </p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #94A3B8;">
          ${escapeHtml(studentLabel)}<br/>
          <span style="font-size: 10px;">${escapeHtml(generatedAt)} 생성</span>
        </div>
      </div>
    </div>

    <!-- 합계 박스 -->
    <div style="background: #FEF3C7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
                display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 600; color: #92400E;">
        총 ${summary.length}명 집계
      </span>
      <span style="font-size: 20px; font-weight: 800; color: #B45309;">
        ${grandTotal.toLocaleString()} 달란트
      </span>
    </div>

    <!-- 학생별 표 -->
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #F1F5F9;">
          <th style="padding: 12px 14px; text-align: left; font-weight: 700; font-size: 12px;
                     border-bottom: 2px solid #CBD5E1; color: #475569; width: 60px;">순위</th>
          <th style="padding: 12px 14px; text-align: left; font-weight: 700; font-size: 12px;
                     border-bottom: 2px solid #CBD5E1; color: #475569; width: 120px;">이름</th>
          <th style="padding: 12px 14px; text-align: left; font-weight: 700; font-size: 12px;
                     border-bottom: 2px solid #CBD5E1; color: #475569;">활동 내역</th>
          <th style="padding: 12px 14px; text-align: right; font-weight: 700; font-size: 12px;
                     border-bottom: 2px solid #CBD5E1; color: #475569; width: 110px;">총 달란트</th>
        </tr>
      </thead>
      <tbody>
        ${summary.map((item, i) => `
          <tr>
            <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 700;
                       color: ${i === 0 ? '#B45309' : i === 1 ? '#475569' : i === 2 ? '#9A3412' : '#94A3B8'};
                       font-size: 14px;">
              ${i + 1}
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">
              ${escapeHtml(item.name)}
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 12px;">
              ${Object.entries(item.activities)
                .map(([k, v]) => `${escapeHtml(k)} ${v}회`)
                .join(' · ')}
            </td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; text-align: right;
                       font-weight: 700; color: #B45309;">
              ${item.total.toLocaleString()}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- 푸터 -->
    <p style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0;
              font-size: 10px; color: #94A3B8; text-align: center;">
      큰은혜교회 소년부 · 서울특별시 관악구 낙성대로3길 5 · 02-888-1252
    </p>
  `

  document.body.appendChild(container)

  try {
    // 폰트 로딩 대기 — Pretendard가 아직 fetch 중일 수 있음
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }

    const canvas = await html2canvas(container, {
      scale: 2,                  // 2배 해상도 (인쇄용)
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const pageWidth  = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth   = pageWidth
    const imgHeight  = (canvas.height * pageWidth) / canvas.width

    // 한 페이지에 다 안 들어가면 여러 페이지로 분할
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const fileName = `달란트집계_${monthLabel.replace(/\s/g, '')}.pdf`
    pdf.save(fileName)
  } finally {
    document.body.removeChild(container)
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
