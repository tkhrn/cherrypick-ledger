package expo.modules.notificationcapture

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsImportFilterTest {
  @Test
  fun `keeps card approval texts`() {
    assertTrue(SmsImportFilter.looksFinancial("[Web발신] 신한카드(1234)승인 홍*동 12,000원 일시불 10/05 19:42 스타벅스"))
  }

  @Test
  fun `keeps bank withdrawal and cancel texts`() {
    assertTrue(SmsImportFilter.looksFinancial("[Web발신] 신한 110-***-123456 출금 30,000원 잔액 120,500원"))
    assertTrue(SmsImportFilter.looksFinancial("KB국민카드 승인취소 7,800원"))
  }

  @Test
  fun `skips texts without an amount`() {
    assertFalse(SmsImportFilter.looksFinancial("[Web발신] 신한카드 이용내역 안내드립니다"))
  }

  @Test
  fun `skips personal texts that mention money without a payment keyword`() {
    assertFalse(SmsImportFilter.looksFinancial("이따 만원만 빌려줘 10,000원"))
  }

  @Test
  fun `skips verification codes`() {
    assertFalse(SmsImportFilter.looksFinancial("[Web발신] 인증번호 [482913]를 입력해주세요"))
  }
}
