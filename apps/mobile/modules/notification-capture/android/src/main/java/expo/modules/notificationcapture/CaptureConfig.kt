package expo.modules.notificationcapture

import android.content.Context

/** JS에서 configure()로 넘긴 설정과 수집 상태. 앱 JS가 죽어 있어도 서비스·워커가 읽는다. */
class CaptureConfig(context: Context) {
  private val prefs = context.getSharedPreferences("cherrypick_capture", Context.MODE_PRIVATE)

  var ingestUrl: String?
    get() = prefs.getString("ingest_url", null)
    set(value) = prefs.edit().putString("ingest_url", value).apply()

  var deviceKey: String?
    get() = prefs.getString("device_key", null)
    set(value) = prefs.edit().putString("device_key", value).apply()

  var packages: Set<String>
    get() = prefs.getStringSet("packages", emptySet()) ?: emptySet()
    set(value) = prefs.edit().putStringSet("packages", value).apply()

  var smsEnabled: Boolean
    get() = prefs.getBoolean("sms_enabled", false)
    set(value) = prefs.edit().putBoolean("sms_enabled", value).apply()

  var lastCapturedAt: Long
    get() = prefs.getLong("last_captured_at", 0L)
    set(value) = prefs.edit().putLong("last_captured_at", value).apply()

  var lastUploadError: String?
    get() = prefs.getString("last_upload_error", null)
    set(value) = prefs.edit().putString("last_upload_error", value).apply()
}
