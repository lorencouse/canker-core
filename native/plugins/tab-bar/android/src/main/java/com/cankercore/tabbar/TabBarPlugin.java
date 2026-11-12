package com.cankercore.tabbar;

import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.view.ContextThemeWrapper;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;
import com.google.android.material.shape.MaterialShapeDrawable;
import com.google.android.material.shape.RelativeCornerSize;
import com.google.android.material.shape.ShapeAppearanceModel;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Material 3's own navigation bar, laid over the webview: the Android twin of
 * the iPhone's TabBarPlugin.swift, on the same bridge
 * (components/shell/native-tabs.ts). Kouzr's TabBarPlugin.java, made
 * self-contained for a plugin package.
 *
 * The bar is a display and nothing more. The page owns the tabs, which one is
 * lit, the colours and when the bar is out of the way, and sends the whole of
 * it on every change; a tap is reported back as the tab's id and the page's
 * router does the rest. What a deploy cannot change is the icons: a vector has
 * to be in the APK. The page names one and the bar draws
 * res/drawable/tab_<name> at rest and tab_<name>_fill when lit (the web bar's
 * own lucide glyphs, the lit one heavier); a name with no such pair draws a
 * circle.
 *
 * `set` answers with `top`: how far the bar's top sits above the bottom of the
 * webview, in dp, which are CSS pixels in the webview. The page makes that its
 * --tab-lift. When the insets move it later (gestures and three buttons
 * swapped, the phone turned), a `top` event says so.
 *
 * It floats, as the web bar does (.tab-bar in styles/main.css): a pill inset
 * from both sides and the bottom, the width of a phone and no wider than
 * MAX_WIDTH_DP on anything wider, centred. Its fill is the page's card at
 * SURFACE_ALPHA, so the content that runs under it shows through faintly, as
 * Material's floating bars and the web's glass do.
 *
 * It stands clear of the navigation bar by margin rather than Material's
 * padding, and only by the part of the inset the webview's parent has not
 * already padded. Like the web bar it takes back half of a gesture inset and
 * clears all of a three-button bar. While the keyboard is up the bar is put
 * away, as Android's own apps do.
 *
 * A binary without this plugin is why the page checks before hiding its own
 * bar: Capacitor.isPluginAvailable("NativeTabBar") is false there, and the web
 * bar stays.
 */
@CapacitorPlugin(name = "NativeTabBar")
public class TabBarPlugin extends Plugin {

    /** The length of the page's own transitions. */
    private static final long FADE_MS = 200;
    /** The pill's fill over the page: the card, nearly solid, so the labels
     *  keep their contrast over whatever scrolls under it. */
    private static final int SURFACE_ALPHA = 0xf5;
    /** The web bar's --tab-gap and the least it stands off the bottom, in dp. */
    private static final int SIDE_DP = 12;
    private static final int BOTTOM_DP = 8;
    /** Half the handle's thickness and a hair of air over it. */
    private static final int HANDLE_DP = 6;
    /** The web bar's --tab-bar-h on touch. Material's items keep an 80dp
     *  floor of their own whatever the bar's minimum, so the bar is given its
     *  height outright and the items centre their icon and word in it. */
    private static final int HEIGHT_DP = 64;
    /** The web bar's --tab-bar-max: four tabs need no more. */
    private static final int MAX_WIDTH_DP = 448;

    private BottomNavigationView bar;
    private MaterialShapeDrawable pill;
    /** The tab ids in bar order; a menu item's id is its index here. */
    private final List<String> ids = new ArrayList<>();
    private String shape = "";
    private boolean hiddenByPage = true;
    private boolean keyboardUp = false;
    private boolean shownNow = false;
    /** True while the page's state is being applied, so the selection it
     *  makes is not reported back to the page as a tap. */
    private boolean applying = false;
    private int toldTop = -1;

    @PluginMethod
    public void set(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            ViewGroup host = host();
            if (host == null) {
                call.reject("no view to draw the bar in");
                return;
            }
            if (bar == null) bar = makeBar(host);
            bar.bringToFront();
            try {
                apply(call);
            } catch (RuntimeException e) {
                call.reject("could not draw the bar: " + e.getMessage());
                return;
            }
            fitInsets();
            int top = measuredTop();
            toldTop = top;
            JSObject ret = new JSObject();
            ret.put("top", toCss(top));
            call.resolve(ret);
        });
    }

    /** The webview's parent, whatever kind of layout the template uses; the
     *  bar is added to it with layout params of its own kind. */
    private ViewGroup host() {
        WebView web = getBridge().getWebView();
        if (web == null || !(web.getParent() instanceof ViewGroup)) return null;
        return (ViewGroup) web.getParent();
    }

    private BottomNavigationView makeBar(ViewGroup host) {
        // Material's views need a Material theme, and the Capacitor
        // template's activity has an AppCompat one: the bar brings its own.
        BottomNavigationView bar = new BottomNavigationView(new ContextThemeWrapper(
            getActivity(), com.google.android.material.R.style.Theme_Material3_DayNight_NoActionBar));
        bar.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_LABELED);
        bar.setItemGravity(NavigationBarView.ITEM_GRAVITY_CENTER);
        bar.setMinimumHeight(0);
        bar.setItemPaddingTop(0);
        bar.setItemPaddingBottom(0);
        bar.setItemIconSize(dp(22));
        bar.setItemTextAppearanceInactive(R.style.CankerTabLabel);
        bar.setItemTextAppearanceActive(R.style.CankerTabLabel);
        bar.setItemTextAppearanceActiveBoldEnabled(true);
        bar.setItemActiveIndicatorWidth(dp(56));
        bar.setItemActiveIndicatorHeight(dp(30));
        bar.setActiveIndicatorLabelPadding(dp(2));
        pill = new MaterialShapeDrawable(ShapeAppearanceModel.builder()
            .setAllCornerSizes(new RelativeCornerSize(0.5f)).build());
        bar.setBackground(pill);
        bar.setClipToOutline(true);
        bar.setElevation(dp(6));
        bar.setVisibility(View.INVISIBLE);
        bar.setAlpha(0f);
        bar.setOnItemSelectedListener((item) -> {
            report(item);
            return true;
        });
        // The lit tab tapped again is a tap like any other: the page scrolls
        // that screen to its top.
        bar.setOnItemReselectedListener(this::report);
        ViewCompat.setOnApplyWindowInsetsListener(bar, (v, insets) -> {
            fitInsets();
            return insets;
        });
        host.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> fitInsets());
        bar.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> {
            if (!shownNow || b - t == ob - ot) return;
            int top = topOf(b - t);
            if (top == toldTop) return;
            toldTop = top;
            JSObject data = new JSObject();
            data.put("top", toCss(top));
            notifyListeners("top", data);
        });
        // A FrameLayout's params are understood by a CoordinatorLayout and a
        // FrameLayout alike, the two parents Capacitor's template has used.
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(HEIGHT_DP),
            Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        lp.setMargins(dp(SIDE_DP), 0, dp(SIDE_DP), dp(BOTTOM_DP));
        if (host instanceof androidx.coordinatorlayout.widget.CoordinatorLayout) {
            androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams clp =
                new androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams(lp);
            clp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            host.addView(bar, clp);
        } else {
            host.addView(bar, lp);
        }
        return bar;
    }

    private void report(MenuItem item) {
        if (applying || !shownNow) return;
        int index = item.getItemId();
        if (index < 0 || index >= ids.size()) return;
        JSObject data = new JSObject();
        data.put("id", ids.get(index));
        notifyListeners("select", data);
    }

    private void apply(PluginCall call) {
        JSArray items = call.getArray("items", new JSArray());
        int count = Math.min(items.length(), bar.getMaxItemCount());
        List<JSONObject> specs = new ArrayList<>();
        StringBuilder newShape = new StringBuilder();
        for (int i = 0; i < count; i++) {
            JSONObject spec = items.optJSONObject(i);
            if (spec == null) spec = new JSONObject();
            specs.add(spec);
            newShape.append(spec.optString("id")).append('\u001f')
                .append(spec.optString("title")).append('\u001f')
                .append(spec.optString("symbol")).append('\u001e');
        }

        applying = true;
        try {
            Menu menu = bar.getMenu();
            if (!newShape.toString().equals(shape)) {
                menu.clear();
                ids.clear();
                for (int i = 0; i < specs.size(); i++) {
                    JSONObject spec = specs.get(i);
                    MenuItem item = menu.add(Menu.NONE, i, i, spec.optString("title"));
                    item.setIcon(icon(spec.optString("symbol", "circle")));
                    ids.add(spec.optString("id"));
                }
                shape = newShape.toString();
            }

            boolean dark = call.getBoolean("dark", false);
            Palette p = new Palette(call, dark);
            int[][] states = { { android.R.attr.state_checked }, {} };
            pill.setFillColor(ColorStateList.valueOf((p.surface & 0x00ffffff) | (SURFACE_ALPHA << 24)));
            pill.setStroke(dp(1) / 2f, (p.ink & 0x00ffffff) | 0x1f000000);
            bar.setItemIconTintList(new ColorStateList(states, new int[] { p.tint, p.muted }));
            bar.setItemTextColor(new ColorStateList(states, new int[] { p.ink, p.muted }));
            bar.setItemActiveIndicatorColor(ColorStateList.valueOf(p.indicator));
            bar.setItemRippleColor(ColorStateList.valueOf((p.tint & 0x00ffffff) | 0x1f000000));

            // A page under no tab lights none, as the web bar does.
            String selected = call.getString("selected");
            int index = selected == null ? -1 : ids.indexOf(selected);
            if (index >= 0) {
                menu.setGroupCheckable(Menu.NONE, true, true);
                menu.findItem(index).setChecked(true);
            } else {
                menu.setGroupCheckable(Menu.NONE, true, false);
                for (int i = 0; i < menu.size(); i++) menu.getItem(i).setChecked(false);
            }
        } finally {
            applying = false;
        }

        hiddenByPage = call.getBoolean("hidden", false);
        showIfWanted(true);
    }

    /** Shown when the page wants it and the keyboard is down: a fade when the
     *  page asks, a cut when the keyboard does. */
    private void showIfWanted(boolean fade) {
        boolean want = !hiddenByPage && !keyboardUp;
        if (want == shownNow) return;
        shownNow = want;
        bar.animate().cancel();
        if (want) {
            bar.setVisibility(View.VISIBLE);
            bar.animate().alpha(1f).setDuration(fade ? FADE_MS : 0).start();
        } else {
            bar.animate().alpha(0f).setDuration(fade ? FADE_MS : 0).withEndAction(() -> {
                if (!shownNow) bar.setVisibility(View.INVISIBLE);
            }).start();
        }
    }

    /**
     * The insets the bar still has to stand clear of: the window's, less
     * whatever the webview's parent has padded already. And its width: the
     * room between them, no more than MAX_WIDTH_DP.
     */
    private void fitInsets() {
        if (bar == null || !(bar.getParent() instanceof ViewGroup)) return;
        ViewGroup host = (ViewGroup) bar.getParent();
        WindowInsetsCompat root = ViewCompat.getRootWindowInsets(host);
        if (root == null) return;
        boolean keyboard = root.isVisible(WindowInsetsCompat.Type.ime());
        if (keyboard != keyboardUp) {
            keyboardUp = keyboard;
            showIfWanted(false);
        }
        if (keyboard) return;

        Insets sys = root.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
        View window = host.getRootView();
        int[] at = new int[2];
        host.getLocationInWindow(at);
        int padLeft = at[0] + host.getPaddingLeft();
        int padRight = window.getWidth() - (at[0] + host.getWidth() - host.getPaddingRight());
        int padBottom = window.getHeight() - (at[1] + host.getHeight() - host.getPaddingBottom());
        int left = Math.max(dp(SIDE_DP), sys.left - padLeft);
        int right = Math.max(dp(SIDE_DP), sys.right - padRight);
        int inset = Math.max(0, sys.bottom - padBottom);
        // A gesture handle needs only the middle of its strip; the buttons of
        // a three-button bar (48dp) are pressable all the way up.
        int bottom = inset < dp(40)
            ? Math.max(dp(BOTTOM_DP), inset - inset / 2 + (inset > 0 ? dp(HANDLE_DP) : 0))
            : inset + dp(BOTTOM_DP);
        int room = host.getWidth() - host.getPaddingLeft() - host.getPaddingRight() - left - right;
        int width = room > 0 && room > dp(MAX_WIDTH_DP) ? dp(MAX_WIDTH_DP) : ViewGroup.LayoutParams.MATCH_PARENT;
        if (bar.getPaddingLeft() != 0 || bar.getPaddingRight() != 0 || bar.getPaddingBottom() != 0) {
            bar.setPadding(0, 0, 0, 0);
        }
        ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) bar.getLayoutParams();
        if (lp.leftMargin != left || lp.rightMargin != right || lp.bottomMargin != bottom || lp.width != width) {
            lp.setMargins(left, 0, right, bottom);
            lp.width = width;
            bar.setLayoutParams(lp);
        }
    }

    private int dp(int v) {
        return Math.round(v * getContext().getResources().getDisplayMetrics().density);
    }

    /** How far the bar's top sits above the webview's bottom. */
    private int topOf(int height) {
        return height + ((ViewGroup.MarginLayoutParams) bar.getLayoutParams()).bottomMargin;
    }

    /** Measured now rather than at the next layout, so the first `set` can
     *  already answer with it. */
    private int measuredTop() {
        ViewGroup host = (ViewGroup) bar.getParent();
        ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) bar.getLayoutParams();
        int width = lp.width > 0
            ? lp.width
            : host.getWidth() - host.getPaddingLeft() - host.getPaddingRight() - lp.leftMargin - lp.rightMargin;
        if (width <= 0) return 0;
        bar.measure(
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(dp(HEIGHT_DP), View.MeasureSpec.EXACTLY)
        );
        return topOf(bar.getMeasuredHeight());
    }

    private double toCss(int px) {
        float density = getContext().getResources().getDisplayMetrics().density;
        return Math.round(px / density * 10) / 10.0;
    }

    private Drawable icon(String symbol) {
        int rest = drawable("tab_" + symbol);
        int lit = drawable("tab_" + symbol + "_fill");
        if (rest == 0 || lit == 0) {
            rest = R.drawable.tab_circle;
            lit = R.drawable.tab_circle_fill;
        }
        StateListDrawable d = new StateListDrawable();
        d.addState(new int[] { android.R.attr.state_checked }, ContextCompat.getDrawable(getContext(), lit));
        d.addState(new int[] {}, ContextCompat.getDrawable(getContext(), rest));
        return d;
    }

    /** A drawable by name, 0 when there is none. By name because the page
     *  sends a name; the release build does not shrink resources. */
    private int drawable(String name) {
        if (!name.matches("[a-z0-9_]+")) return 0;
        return getContext().getResources().getIdentifier(name, "drawable", getContext().getPackageName());
    }

    /** The colours the page sent, its own tokens read at the time. The
     *  fallbacks are the stylesheet's, for a token the page could not read. */
    static final class Palette {
        final int tint, ink, muted, surface, indicator;

        Palette(PluginCall call, boolean dark) {
            ink = color(call.getString("ink"), dark ? 0xfff3f3fd : 0xff16163f);
            tint = color(call.getString("tint"), ink);
            muted = color(call.getString("muted"), dark ? 0xffbcbdea : 0xff4a4a78);
            surface = color(call.getString("surface"), dark ? 0xff1a1b48 : 0xffffffff);
            indicator = color(call.getString("indicator"), dark ? 0xff2a2b66 : 0xffe6e6fb);
        }
    }

    /** "#rrggbb" or "#rrggbbaa" (CSS puts the alpha last, Android first).
     *  Anything else is the fallback. */
    static int color(String hex, int fallback) {
        if (hex == null) return fallback;
        String s = hex.trim();
        if (!s.startsWith("#")) return fallback;
        s = s.substring(1);
        if (s.length() != 6 && s.length() != 8) return fallback;
        long v;
        try {
            v = Long.parseLong(s, 16);
        } catch (NumberFormatException e) {
            return fallback;
        }
        if (s.length() == 6) return (int) (0xff000000L | v);
        return (int) (((v & 0xff) << 24) | (v >>> 8));
    }
}
