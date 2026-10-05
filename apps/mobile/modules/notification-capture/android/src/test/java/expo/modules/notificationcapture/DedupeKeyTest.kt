package expo.modules.notificationcapture

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class DedupeKeyTest {
  @Test
  fun `hashes package, posted time, title and body`() {
    assertEquals(
      "276f2d5e3f44595a64f9756c648df9eec1d25bdfdef022a2a8e4967557895b89",
      DedupeKey.of("com.card", 1759661100000L, "KB국민카드", "승인 7,800원"),
    )
  }

  @Test
  fun `differs when the posted time differs`() {
    assertNotEquals(
      DedupeKey.of("com.card", 1L, "t", "b"),
      DedupeKey.of("com.card", 2L, "t", "b"),
    )
  }
}
