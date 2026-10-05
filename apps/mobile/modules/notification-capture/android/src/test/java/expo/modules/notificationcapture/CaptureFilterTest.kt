package expo.modules.notificationcapture

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CaptureFilterTest {
  private val own = "com.tkhrn.cherrypick"
  private val enabled = setOf("com.card", "viva.republica.toss")

  @Test
  fun `accepts an enabled app with a body`() {
    assertTrue(CaptureFilter.accept("com.card", "승인 7,800원", enabled, smsEnabled = false, ownPackage = own))
  }

  @Test
  fun `rejects apps that are not enabled`() {
    assertFalse(CaptureFilter.accept("com.game", "보상 받기", enabled, smsEnabled = false, ownPackage = own))
  }

  @Test
  fun `rejects its own notifications even if listed`() {
    assertFalse(CaptureFilter.accept(own, "정리할 소비 3건", enabled + own, smsEnabled = true, ownPackage = own))
  }

  @Test
  fun `rejects blank bodies`() {
    assertFalse(CaptureFilter.accept("com.card", "   ", enabled, smsEnabled = false, ownPackage = own))
  }

  @Test
  fun `accepts sms only when sms capture is on`() {
    assertTrue(CaptureFilter.accept(CaptureFilter.SMS_SOURCE, "[Web발신] 승인", enabled, smsEnabled = true, ownPackage = own))
    assertFalse(CaptureFilter.accept(CaptureFilter.SMS_SOURCE, "[Web발신] 승인", enabled, smsEnabled = false, ownPackage = own))
  }
}
