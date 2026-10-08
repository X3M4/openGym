package com.chemafernandez.superopengym

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.Device
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId
import kotlin.reflect.KClass

/**
 * Health Connect for SuperOpenGym (Phase 7), on Google's androidx.health.connect client.
 *
 *   status()                    → { status: 'available' | 'not-installed' | 'update-required' }
 *   requestAccess()             → { granted: [kind…] }   kinds: steps, exercise, weight, bodyfat, writeExercise, history
 *   granted()                   → { granted: [kind…] }
 *   read({ from, to })          → { steps:[{d,count}], exercise:[…], weight:[…], bodyfat:[…] }
 *                                 (ISO dates, inclusive; only the kinds granted are read)
 *   writeWorkout({ id, start, end, title, notes, version })
 *                               → inserts a strength-training session; the workout's id is the
 *                                 clientRecordId, so writing it again with a higher version updates it
 *
 * Exercise sessions written by this app are left out of read(), so a workout never comes back as
 * someone else's cardio.
 */
@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val kinds: Map<String, String> = mapOf(
        "steps" to HealthPermission.getReadPermission(StepsRecord::class),
        "exercise" to HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        "weight" to HealthPermission.getReadPermission(WeightRecord::class),
        "bodyfat" to HealthPermission.getReadPermission(BodyFatRecord::class),
        "writeExercise" to HealthPermission.getWritePermission(ExerciseSessionRecord::class),
        "history" to HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY,
    )

    private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

    private fun grantedKinds(perms: Set<String>): JSArray {
        val out = JSArray()
        kinds.forEach { (kind, perm) -> if (perms.contains(perm)) out.put(kind) }
        return out
    }

    @PluginMethod
    fun status(call: PluginCall) {
        val s = when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update-required"
            else -> "not-installed"
        }
        call.resolve(JSObject().put("status", s))
    }

    @PluginMethod
    fun granted(call: PluginCall) {
        scope.launch {
            try {
                val perms = client().permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("granted", grantedKinds(perms)))
            } catch (e: Exception) { call.reject(e.message ?: "granted failed", e) }
        }
    }

    @PluginMethod
    fun requestAccess(call: PluginCall) {
        val contract = PermissionController.createRequestPermissionResultContract()
        val intent = contract.createIntent(context, kinds.values.toSet())
        startActivityForResult(call, intent, "permissionsResult")
    }

    @ActivityCallback
    private fun permissionsResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        // The dialog's own answer can be partial; what counts is what Health Connect now holds.
        scope.launch {
            try {
                val perms = client().permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("granted", grantedKinds(perms)))
            } catch (e: Exception) { call.reject(e.message ?: "permissions failed", e) }
        }
    }

    private suspend fun <T : Record> readAll(type: KClass<T>, range: TimeRangeFilter): List<T> {
        val out = ArrayList<T>()
        var token: String? = null
        do {
            val res = client().readRecords(ReadRecordsRequest(type, range, emptySet(), true, 1000, token))
            out.addAll(res.records)
            token = res.pageToken
        } while (!token.isNullOrEmpty())
        return out
    }

    @PluginMethod
    fun read(call: PluginCall) {
        val from = call.getString("from")
        val to = call.getString("to")
        if (from == null || to == null) { call.reject("from and to are required"); return }
        scope.launch {
            try {
                val zone = ZoneId.systemDefault()
                val start = LocalDate.parse(from).atStartOfDay()
                val end = LocalDate.parse(to).plusDays(1).atStartOfDay()
                val instants = TimeRangeFilter.between(start.atZone(zone).toInstant(), end.atZone(zone).toInstant())
                val perms = client().permissionController.getGrantedPermissions()
                val own = context.packageName
                val ret = JSObject()

                val steps = JSArray()
                if (perms.contains(kinds["steps"])) {
                    // Aggregated by Health Connect, so steps counted by both a watch and the phone
                    // are not added twice.
                    val groups = client().aggregateGroupByPeriod(
                        AggregateGroupByPeriodRequest(setOf(StepsRecord.COUNT_TOTAL), TimeRangeFilter.between(start, end), Period.ofDays(1), emptySet()))
                    for (g in groups) {
                        val n = g.result[StepsRecord.COUNT_TOTAL] ?: continue
                        steps.put(JSObject().put("d", g.startTime.toLocalDate().toString()).put("count", n))
                    }
                }
                ret.put("steps", steps)

                val exercise = JSArray()
                if (perms.contains(kinds["exercise"])) {
                    for (r in readAll(ExerciseSessionRecord::class, instants)) {
                        if (r.metadata.dataOrigin.packageName == own) continue
                        exercise.put(JSObject()
                            .put("id", r.metadata.id)
                            .put("start", r.startTime.toEpochMilli())
                            .put("end", r.endTime.toEpochMilli())
                            .put("type", r.exerciseType)
                            .put("title", r.title ?: "")
                            .put("source", r.metadata.dataOrigin.packageName))
                    }
                }
                ret.put("exercise", exercise)

                val weight = JSArray()
                if (perms.contains(kinds["weight"])) {
                    for (r in readAll(WeightRecord::class, instants)) {
                        weight.put(JSObject().put("id", r.metadata.id).put("t", r.time.toEpochMilli())
                            .put("kg", r.weight.inKilograms).put("source", r.metadata.dataOrigin.packageName))
                    }
                }
                ret.put("weight", weight)

                val bodyfat = JSArray()
                if (perms.contains(kinds["bodyfat"])) {
                    for (r in readAll(BodyFatRecord::class, instants)) {
                        bodyfat.put(JSObject().put("id", r.metadata.id).put("t", r.time.toEpochMilli())
                            .put("pct", r.percentage.value).put("source", r.metadata.dataOrigin.packageName))
                    }
                }
                ret.put("bodyfat", bodyfat)
                call.resolve(ret)
            } catch (e: Exception) { call.reject(e.message ?: "read failed", e) }
        }
    }

    @PluginMethod
    fun writeWorkout(call: PluginCall) {
        val id = call.getString("id")
        val start = call.getLong("start")
        val end = call.getLong("end")
        if (id == null || start == null || end == null || end <= start) { call.reject("id, start and end are required"); return }
        val title = call.getString("title")
        val notes = call.getString("notes")
        val version = call.getLong("version") ?: 1L
        scope.launch {
            try {
                val zone = ZoneId.systemDefault()
                val s = Instant.ofEpochMilli(start)
                val e = Instant.ofEpochMilli(end)
                val record = ExerciseSessionRecord(
                    startTime = s, startZoneOffset = zone.rules.getOffset(s),
                    endTime = e, endZoneOffset = zone.rules.getOffset(e),
                    metadata = Metadata.manualEntry(id, version, Device(Device.TYPE_PHONE, null, null)),
                    exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                    title = title, notes = notes)
                client().insertRecords(listOf(record))
                call.resolve(JSObject().put("ok", true))
            } catch (ex: Exception) { call.reject(ex.message ?: "write failed", ex) }
        }
    }
}
