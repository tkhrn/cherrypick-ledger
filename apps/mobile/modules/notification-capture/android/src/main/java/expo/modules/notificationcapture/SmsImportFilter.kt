package expo.modules.notificationcapture

/** 지난 문자 가져오기에서 결제·이체로 보이는 문자만 남긴다. 실제 해석은 서버가 한다 */
object SmsImportFilter {
  private val AMOUNT = Regex("""\d{1,3}(,\d{3})+\s*원|\d+\s*원""")
  private val PAYMENT_KEYWORD = Regex("승인|결제|출금|입금|이체|송금|취소|사용")

  fun looksFinancial(body: String): Boolean = AMOUNT.containsMatchIn(body) && PAYMENT_KEYWORD.containsMatchIn(body)
}
