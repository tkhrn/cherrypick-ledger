package expo.modules.notificationcapture

object CaptureFilter {
  const val SMS_SOURCE = "sms"

  fun accept(sourcePackage: String, body: String, enabledPackages: Set<String>, smsEnabled: Boolean, ownPackage: String): Boolean {
    if (sourcePackage == ownPackage || body.isBlank()) return false
    if (sourcePackage == SMS_SOURCE) return smsEnabled
    return sourcePackage in enabledPackages
  }
}
