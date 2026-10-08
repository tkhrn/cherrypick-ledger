package expo.modules.notificationcapture

import java.net.HttpURLConnection

enum class UploadOutcome {
  /** 올라갔다. 대기열에서 지운다 */
  DELETE,
  /** 기기 키가 폐기됐다. 앱이 다시 등록할 때까지 멈춘다 */
  REVOKED,
  /** 서버가 이 묶음을 절대 받지 않는다(형식 오류 등). 대기열을 막지 않도록 버린다 */
  DROP,
  /** 일시적인 문제. 나중에 다시 시도한다 */
  RETRY,
  /** 너무 오래 실패했다. 대기열은 남겨두고 다음 수집 때 다시 시도한다 */
  GIVE_UP,
}

object UploadPolicy {
  const val MAX_ATTEMPTS = 8
  private val TRANSIENT_CLIENT_ERRORS = setOf(HttpURLConnection.HTTP_CLIENT_TIMEOUT, 429)

  /** @param status HTTP 상태 코드. 네트워크 오류로 응답이 없으면 null */
  fun decide(status: Int?, attempt: Int): UploadOutcome = when {
    status != null && status in 200..299 -> UploadOutcome.DELETE
    status == HttpURLConnection.HTTP_UNAUTHORIZED -> UploadOutcome.REVOKED
    status != null && status in 400..499 && status !in TRANSIENT_CLIENT_ERRORS -> UploadOutcome.DROP
    attempt >= MAX_ATTEMPTS -> UploadOutcome.GIVE_UP
    else -> UploadOutcome.RETRY
  }
}
