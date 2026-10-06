package com.chemafernandez.superopengym;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Status and navigation bar icons follow the app's own theme, not the phone's. The activity
 * theme is DayNight, so on a phone in dark mode Android painted light icons over the app's
 * light (default) theme and the clock and battery disappeared into the white ground.
 *
 * Usage from JS (App.jsx, applyPrefs):
 *   registerPlugin('SystemBars').setStyle({ dark: false })   // light app → dark icons
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @PluginMethod
    public void setStyle(PluginCall call) {
        final boolean dark = call.getBoolean("dark", false);
        getActivity().runOnUiThread(() -> {
            WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(
                getActivity().getWindow(), getActivity().getWindow().getDecorView());
            // "Light" bars means dark icons, for a light app.
            bars.setAppearanceLightStatusBars(!dark);
            bars.setAppearanceLightNavigationBars(!dark);
            call.resolve();
        });
    }
}
