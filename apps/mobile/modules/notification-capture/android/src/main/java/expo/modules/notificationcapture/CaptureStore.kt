package expo.modules.notificationcapture

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

data class QueuedNotification(
  val id: Long,
  val sourcePackage: String,
  val title: String,
  val body: String,
  val postedAtMs: Long,
  val dedupeKey: String,
)

/** 업로드 대기열. 업로드에 성공한 행만 지운다. */
class CaptureStore(context: Context) : SQLiteOpenHelper(context, "cherrypick_capture.db", null, 1) {
  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      """
      create table queue (
        id integer primary key autoincrement,
        source_package text not null,
        title text not null,
        body text not null,
        posted_at_ms integer not null,
        dedupe_key text not null unique
      )
      """.trimIndent(),
    )
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

  fun insert(sourcePackage: String, title: String, body: String, postedAtMs: Long) {
    val values = ContentValues().apply {
      put("source_package", sourcePackage)
      put("title", title)
      put("body", body)
      put("posted_at_ms", postedAtMs)
      put("dedupe_key", DedupeKey.of(sourcePackage, postedAtMs, title, body))
    }
    writableDatabase.insertWithOnConflict("queue", null, values, SQLiteDatabase.CONFLICT_IGNORE)
  }

  fun peek(limit: Int): List<QueuedNotification> =
    readableDatabase.rawQuery("select id, source_package, title, body, posted_at_ms, dedupe_key from queue order by id limit ?", arrayOf(limit.toString())).use { c ->
      buildList {
        while (c.moveToNext()) add(QueuedNotification(c.getLong(0), c.getString(1), c.getString(2), c.getString(3), c.getLong(4), c.getString(5)))
      }
    }

  fun delete(ids: List<Long>) {
    if (ids.isEmpty()) return
    writableDatabase.delete("queue", "id in (${ids.joinToString(",") { "?" }})", ids.map { it.toString() }.toTypedArray())
  }

  fun clear() {
    writableDatabase.delete("queue", null, null)
  }

  fun count(): Int = readableDatabase.rawQuery("select count(*) from queue", null).use { c -> if (c.moveToFirst()) c.getInt(0) else 0 }
}
