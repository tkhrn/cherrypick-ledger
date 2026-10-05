package expo.modules.notificationcapture

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationCaptureModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("NotificationCapture")

    Function("isNotificationAccessGranted") {
      NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
    }

    Function("openNotificationAccessSettings") {
      context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      pm.getInstalledApplications(PackageManager.GET_META_DATA)
        .filter { it.packageName != context.packageName && pm.getLaunchIntentForPackage(it.packageName) != null }
        .map { mapOf("packageName" to it.packageName, "label" to pm.getApplicationLabel(it).toString()) }
        .sortedBy { it["label"] }
    }

    Function("configure") { ingestUrl: String, deviceKey: String ->
      CaptureConfig(context).apply {
        this.ingestUrl = ingestUrl
        this.deviceKey = deviceKey
        lastUploadError = null
      }
      UploadWorker.enqueue(context)
    }

    Function("setSources") { packages: List<String>, smsEnabled: Boolean ->
      CaptureConfig(context).apply {
        this.packages = packages.toSet()
        this.smsEnabled = smsEnabled
      }
    }

    Function("getStatus") {
      val config = CaptureConfig(context)
      mapOf(
        "lastCapturedAt" to config.lastCapturedAt.takeIf { it > 0 },
        "pendingCount" to CaptureStore(context).count(),
        "lastUploadError" to config.lastUploadError,
        "isConfigured" to (config.deviceKey != null),
      )
    }

    Function("flushNow") {
      UploadWorker.enqueue(context)
    }
  }
}
