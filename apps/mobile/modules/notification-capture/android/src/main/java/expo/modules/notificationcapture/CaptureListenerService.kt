package expo.modules.notificationcapture

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class CaptureListenerService : NotificationListenerService() {
  override fun onListenerConnected() {
    instance = this
  }

  override fun onListenerDisconnected() {
    if (instance === this) instance = null
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val (title, body) = textOf(sbn) ?: return
    Capture.record(applicationContext, sbn.packageName, title, body, sbn.postTime)
  }

  companion object {
    /** 알림창에 남은 알림을 읽으려면 연결된 서비스 인스턴스가 필요하다 */
    @Volatile
    var instance: CaptureListenerService? = null

    fun textOf(sbn: StatusBarNotification): Pair<String, String>? {
      val notification = sbn.notification ?: return null
      if (notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return null
      val extras = notification.extras
      val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
      val body = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()
      return title to body
    }
  }
}
