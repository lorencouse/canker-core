package com.cankercore.fold;

import android.graphics.Rect;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import androidx.core.util.Consumer;
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter;
import androidx.window.layout.DisplayFeature;
import androidx.window.layout.FoldingFeature;
import androidx.window.layout.WindowInfoTracker;
import androidx.window.layout.WindowLayoutInfo;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;

/**
 * The hinge of a Surface Duo or a folding Android phone, for the page
 * (utils/fold.ts, components/shell/LayoutWatch.tsx). Aireio's FoldPlugin.java,
 * without its tab bar and lab.
 *
 * Chrome has the Viewport Segments API for this, but the Android System
 * WebView does not expose it (Surface Duo, Android 12, WebView 149: no
 * window.viewport, spanned or not). Jetpack WindowManager does see the hinge,
 * so the shell reads the folding features off the window and passes them on:
 * get() and a "change" event, one rect per fold in the WebView's CSS pixels.
 *
 * Only a separating fold is reported: a Duo's hinge always (it is a gap
 * between two screens), a foldable's crease only while it is bent into book
 * or tabletop posture. On one screen of a Duo, flat, closed, or on a phone
 * without a fold: no regions, and nothing on the page moves.
 */
@CapacitorPlugin(name = "Fold")
public class FoldPlugin extends Plugin {

    private WindowInfoTrackerCallbackAdapter tracker;
    private final Consumer<WindowLayoutInfo> listener = this::changed;
    /** The separating folds, in window px, as the device last reported them. */
    private Rect[] reported = new Rect[0];
    private String last = "";

    @Override
    public void load() {
        tracker = new WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(getActivity()));
        tracker.addWindowLayoutInfoListener(getActivity(), ContextCompat.getMainExecutor(getContext()), listener);
    }

    @Override
    protected void handleOnDestroy() {
        if (tracker != null) tracker.removeWindowLayoutInfoListener(listener);
    }

    @PluginMethod
    public void get(PluginCall call) {
        getActivity().runOnUiThread(() -> call.resolve(answer()));
    }

    private void changed(WindowLayoutInfo info) {
        List<Rect> folds = new ArrayList<>();
        for (DisplayFeature f : info.getDisplayFeatures()) {
            if (f instanceof FoldingFeature && ((FoldingFeature) f).isSeparating()) folds.add(f.getBounds());
        }
        reported = folds.toArray(new Rect[0]);
        JSObject data = answer();
        String now = data.toString();
        if (now.equals(last)) return;
        last = now;
        // Retained until the page listens: a turn or a change of posture
        // recreates the activity, and WindowManager's first answer lands
        // before the reloaded page has added its listener or asked get().
        notifyListeners("change", data, true);
    }

    /** Window pixels to the WebView's CSS pixels, from its own top left. */
    private JSObject answer() {
        JSArray out = new JSArray();
        WebView web = getBridge().getWebView();
        if (web != null) {
            float density = web.getResources().getDisplayMetrics().density;
            int[] at = new int[2];
            web.getLocationInWindow(at);
            for (Rect b : reported) {
                JSObject r = new JSObject();
                r.put("x", (b.left - at[0]) / density);
                r.put("y", (b.top - at[1]) / density);
                r.put("width", b.width() / density);
                r.put("height", b.height() / density);
                out.put(r);
            }
        }
        JSObject ret = new JSObject();
        ret.put("regions", out);
        return ret;
    }
}
