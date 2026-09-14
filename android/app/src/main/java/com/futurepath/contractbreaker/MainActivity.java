package com.futurepath.contractbreaker;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enableImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Immersive mode can be dismissed by system UI (dialogs, notification
        // shade, app switcher); re-apply whenever the window regains focus.
        if (hasFocus) {
            enableImmersiveMode();
        }
    }

    // True immersive/sticky fullscreen: both the status bar and navigation
    // bar are hidden and the WebView gets the entire screen. Bars can still
    // be revealed temporarily with an edge swipe and auto-hide again
    // (matches the behavior of the legacy SYSTEM_UI_FLAG_IMMERSIVE_STICKY).
    private void enableImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
}
