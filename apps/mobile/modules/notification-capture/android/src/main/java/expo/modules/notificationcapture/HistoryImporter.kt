package expo.modules.notificationcapture

import android.content.Context
import android.provider.Telephony

/** 설정 전에 받은 결제 문자와, 아직 알림창에 남아 있는 알림을 대기열에 넣는다 */
object HistoryImporter {
  private const val DAY_MS = 24L * 60 * 60 * 1000

  fun importSms(context: Context, days: Int): Int {
    val since = System.currentTimeMillis() - days * DAY_MS
    val store = CaptureStore(context)
    var imported = 0
    context.contentResolver.query(
      Telephony.Sms.Inbox.CONTENT_URI,
      arrayOf(Telephony.Sms.BODY, Telephony.Sms.DATE),
      "${Telephony.Sms.DATE} >= ?",
      arrayOf(since.toString()),
      "${Telephony.Sms.DATE} ASC",
    )?.use { cursor ->
      while (cursor.moveToNext()) {
        val body = cursor.getString(0).orEmpty()
        if (!SmsImportFilter.looksFinancial(body)) continue
        if (store.insert(CaptureFilter.SMS_SOURCE, SMS_TITLE, body, cursor.getLong(1))) imported++
      }
    }
    if (imported > 0) UploadWorker.enqueue(context)
    return imported
  }

  fun importActiveNotifications(context: Context): Int {
    val service = CaptureListenerService.instance ?: return 0
    val config = CaptureConfig(context)
    val store = CaptureStore(context)
    var imported = 0
    service.activeNotifications.orEmpty().forEach { sbn ->
      val (title, body) = CaptureListenerService.textOf(sbn) ?: return@forEach
      if (!CaptureFilter.accept(sbn.packageName, body, config.packages, config.smsEnabled, context.packageName)) return@forEach
      if (store.insert(sbn.packageName, title, body, sbn.postTime)) imported++
    }
    if (imported > 0) UploadWorker.enqueue(context)
    return imported
  }

  /** 문자 발신 번호는 저장·전송하지 않는다 (AI 프롬프트에 들어가지 않게) */
  const val SMS_TITLE = ""
}
