package expo.modules.notificationcapture

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

class UploadWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    val config = CaptureConfig(applicationContext)
    val url = config.ingestUrl ?: return Result.success()
    val key = config.deviceKey ?: return Result.success()
    val store = CaptureStore(applicationContext)
    var rejectedStatus: Int? = null

    while (true) {
      val batch = store.peek(BATCH_SIZE)
      if (batch.isEmpty()) break
      val status = try {
        post(url, key, batch)
      } catch (e: Exception) {
        null
      }
      when (UploadPolicy.decide(status, runAttemptCount)) {
        UploadOutcome.DELETE -> store.delete(batch.map { it.id })
        UploadOutcome.DROP -> {
          store.delete(batch.map { it.id })
          rejectedStatus = status
        }
        UploadOutcome.REVOKED -> {
          config.lastUploadError = "device_revoked"
          return Result.failure()
        }
        UploadOutcome.RETRY -> {
          config.lastUploadError = status?.let { "http_$it" } ?: "network"
          return Result.retry()
        }
        UploadOutcome.GIVE_UP -> {
          config.lastUploadError = status?.let { "http_$it" } ?: "network"
          return Result.failure()
        }
      }
    }
    config.lastUploadError = rejectedStatus?.let { "rejected_http_$it" }
    return Result.success()
  }

  private fun post(url: String, key: String, batch: List<QueuedNotification>): Int {
    val items = JSONArray()
    batch.forEach {
      items.put(
        JSONObject()
          .put("sourcePackage", it.sourcePackage)
          .put("title", it.title)
          .put("body", it.body)
          .put("postedAt", isoUtc(it.postedAtMs))
          .put("dedupeKey", it.dedupeKey),
      )
    }
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"
      connectTimeout = TIMEOUT_MS
      readTimeout = TIMEOUT_MS
      doOutput = true
      setRequestProperty("content-type", "application/json")
      setRequestProperty("x-device-key", key)
    }
    return try {
      connection.outputStream.use { it.write(JSONObject().put("items", items).toString().toByteArray(Charsets.UTF_8)) }
      connection.responseCode
    } finally {
      connection.disconnect()
    }
  }

  companion object {
    const val WORK_NAME = "cherrypick-upload"
    private const val BATCH_SIZE = 100
    private const val TIMEOUT_MS = 15_000
    private const val BACKOFF_SECONDS = 30L

    private fun isoUtc(ms: Long): String =
      SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date(ms))

    fun enqueue(context: Context) {
      val request = OneTimeWorkRequestBuilder<UploadWorker>()
        .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, BACKOFF_SECONDS, TimeUnit.SECONDS)
        .build()
      WorkManager.getInstance(context).enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.APPEND_OR_REPLACE, request)
    }
  }
}
