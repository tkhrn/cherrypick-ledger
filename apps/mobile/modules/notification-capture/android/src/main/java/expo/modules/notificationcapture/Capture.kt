package expo.modules.notificationcapture

import android.content.Context

object Capture {
  fun record(context: Context, sourcePackage: String, title: String, body: String, postedAtMs: Long) {
    val config = CaptureConfig(context)
    if (!CaptureFilter.accept(sourcePackage, body, config.packages, config.smsEnabled, context.packageName)) return
    CaptureStore(context).insert(sourcePackage, title, body, postedAtMs)
    config.lastCapturedAt = System.currentTimeMillis()
    UploadWorker.enqueue(context)
  }
}
