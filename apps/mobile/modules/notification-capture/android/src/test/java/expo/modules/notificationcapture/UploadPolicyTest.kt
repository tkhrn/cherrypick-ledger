package expo.modules.notificationcapture

import org.junit.Assert.assertEquals
import org.junit.Test

class UploadPolicyTest {
  @Test fun deletesBatchOnSuccess() = assertEquals(UploadOutcome.DELETE, UploadPolicy.decide(200, attempt = 0))

  @Test fun stopsWhenDeviceKeyRevoked() = assertEquals(UploadOutcome.REVOKED, UploadPolicy.decide(401, attempt = 0))

  @Test fun dropsBatchTheServerWillNeverAccept() = assertEquals(UploadOutcome.DROP, UploadPolicy.decide(400, attempt = 0))

  @Test fun retriesServerErrorsAndRateLimits() {
    assertEquals(UploadOutcome.RETRY, UploadPolicy.decide(500, attempt = 0))
    assertEquals(UploadOutcome.RETRY, UploadPolicy.decide(429, attempt = 3))
    assertEquals(UploadOutcome.RETRY, UploadPolicy.decide(408, attempt = 3))
  }

  @Test fun givesUpAfterTooManyAttemptsButKeepsTheQueue() =
    assertEquals(UploadOutcome.GIVE_UP, UploadPolicy.decide(503, attempt = UploadPolicy.MAX_ATTEMPTS))

  @Test fun networkFailureFollowsTheSameAttemptLimit() {
    assertEquals(UploadOutcome.RETRY, UploadPolicy.decide(null, attempt = 0))
    assertEquals(UploadOutcome.GIVE_UP, UploadPolicy.decide(null, attempt = UploadPolicy.MAX_ATTEMPTS))
  }
}
