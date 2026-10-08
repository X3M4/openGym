package com.chemafernandez.superopengym

import android.app.Activity
import android.os.Bundle
import android.util.TypedValue
import android.widget.ScrollView
import android.widget.TextView

/**
 * What Health Connect shows when the user asks why SuperOpenGym wants health data (before the
 * permission dialog, and from the app's entry in the system's health permissions on Android 14+).
 * Plain text from strings.xml (Spanish in values-es), no network, nothing stored.
 */
class HealthPermissionsActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 24f, resources.displayMetrics).toInt()
        val text = TextView(this).apply {
            text = getString(R.string.health_rationale)
            textSize = 16f
            setPadding(pad, pad * 2, pad, pad)
            setTextColor(0xFF13233F.toInt())
        }
        setContentView(ScrollView(this).apply { setBackgroundColor(0xFFFFFFFF.toInt()); addView(text) })
        title = getString(R.string.health_rationale_title)
    }
}
