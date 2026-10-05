package expo.modules.notificationcapture

import java.security.MessageDigest

/** 같은 알림이 갱신·재전송돼도 한 번만 저장되도록 만드는 키. 서버 unique(user_id, dedupe_key)와 짝을 이룬다. */
object DedupeKey {
  fun of(sourcePackage: String, postedAtMs: Long, title: String, body: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest("$sourcePackage|$postedAtMs|$title|$body".toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }
  }
}
