package expo.modules.notificationcapture

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    val first = messages.firstOrNull() ?: return
    val body = messages.joinToString("") { it.messageBody.orEmpty() }
    Capture.record(context, CaptureFilter.SMS_SOURCE, HistoryImporter.SMS_TITLE, body, first.timestampMillis)
  }
}
