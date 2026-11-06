package com.cankercore.webauth;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.verify.domain.DomainVerificationManager;
import android.content.pm.verify.domain.DomainVerificationUserState;
import android.net.Uri;
import android.os.Build;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabsService;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

/**
 * The Android half of the system sign-in (utils/native-auth.ts).
 *
 * Google and GitHub sign-in run in a Chrome Custom Tab rather than the app's
 * webview, because the tab shares the browser's signed-in accounts and
 * passkeys and the webview sees none of them. The tab loads `url` on the
 * app's own server; the flow ends on https://<server host><callbackPath>, an
 * App Link this app claims with an autoVerify intent-filter
 * (scripts/patch-native.mjs) that public/.well-known/assetlinks.json
 * confirms, so Android hands it to this app and no other. MainActivity is
 * singleTask, so the link reaches it through onNewIntent, which also closes
 * the tab, and the call resolves with that URL. There is deliberately no
 * custom-scheme callback: any app can claim a scheme.
 *
 * When the person closes the tab instead, the app comes back to the front
 * with no callback, and the call rejects with code CANCELED.
 *
 * JS: `WebAuth.capabilities({ callbackPath }) -> { httpsCallback }`;
 * `WebAuth.start({ url, callbackPath }) -> { url }`. The same contract as
 * the iOS plugin; see utils/native.ts.
 */
@CapacitorPlugin(name = "WebAuth")
public class WebAuthPlugin extends Plugin {

    // Touched only on the main thread: start hops onto it, and the lifecycle
    // callbacks already run there.
    private String pendingCallId;
    private Uri pendingCallback;
    private boolean leftForTab;

    /** The app's server when an App Link can come back from it: https on the default port. */
    private Uri server() {
        String raw = getBridge().getServerUrl();
        if (raw == null) return null;
        Uri server = Uri.parse(raw);
        if (!"https".equals(server.getScheme()) || server.getHost() == null || server.getPort() != -1 || server.getUserInfo() != null) {
            return null;
        }
        return server;
    }

    private static Uri callbackUri(Uri server, String path) {
        return new Uri.Builder().scheme("https").authority(server.getHost()).path(path).build();
    }

    private static boolean isPath(String path) {
        return path != null && path.startsWith("/") && !path.startsWith("//");
    }

    /** True when this app's own manifest claims the callback URL. */
    private boolean claimsCallback(Uri callback) {
        Context context = getContext();
        Intent intent = new Intent(Intent.ACTION_VIEW, callback)
            .addCategory(Intent.CATEGORY_BROWSABLE)
            .setPackage(context.getPackageName());
        List<ResolveInfo> handlers = context.getPackageManager().queryIntentActivities(intent, 0);
        return !handlers.isEmpty();
    }

    /**
     * True when Android will open the callback in this app rather than the
     * browser. Android 12+ says so, and an unverified link would leave the
     * tab on the callback page, so it falls back to the webview instead.
     * Android 11 and older cannot say; an unverified link there asks which
     * app to open it in.
     */
    private boolean linkReachesApp(String host) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        Context context = getContext();
        DomainVerificationManager manager = context.getSystemService(DomainVerificationManager.class);
        if (manager == null) return false;
        try {
            DomainVerificationUserState state = manager.getDomainVerificationUserState(context.getPackageName());
            if (state == null || !state.isLinkHandlingAllowed()) return false;
            Integer hostState = state.getHostToStateMap().get(host);
            return (
                hostState != null &&
                (hostState == DomainVerificationUserState.DOMAIN_STATE_VERIFIED ||
                    hostState == DomainVerificationUserState.DOMAIN_STATE_SELECTED)
            );
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /** A browser that can show a Custom Tab: the default one, else Chrome, else any. */
    private String customTabsBrowser() {
        Context context = getContext();
        String browser = CustomTabsClient.getPackageName(context, null);
        if (browser != null) return browser;
        Intent service = new Intent(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION);
        List<ResolveInfo> services = context.getPackageManager().queryIntentServices(service, 0);
        for (ResolveInfo info : services) {
            if ("com.android.chrome".equals(info.serviceInfo.packageName)) return "com.android.chrome";
        }
        return services.isEmpty() ? null : services.get(0).serviceInfo.packageName;
    }

    /** Why system sign-in cannot run for this callback path, or null when it can. */
    private String unavailableReason(Uri server, String callbackPath) {
        if (server == null) return "System sign-in needs an https server";
        if (!claimsCallback(callbackUri(server, callbackPath))) return "The app does not claim the sign-in callback";
        if (!linkReachesApp(server.getHost())) return "The sign-in callback is not verified for this app";
        if (customTabsBrowser() == null) return "No browser offers Custom Tabs";
        return null;
    }

    @PluginMethod
    public void capabilities(PluginCall call) {
        String path = call.getString("callbackPath");
        JSObject result = new JSObject();
        result.put("httpsCallback", isPath(path) && unavailableReason(server(), path) == null);
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        String urlString = call.getString("url");
        String path = call.getString("callbackPath");
        if (urlString == null) {
            call.reject("Must provide a valid URL", "INVALID");
            return;
        }
        if (!isPath(path)) {
            call.reject("Must provide a callback path starting with /", "INVALID");
            return;
        }
        Uri server = server();
        String unavailable = unavailableReason(server, path);
        if (unavailable != null) {
            call.reject(unavailable, "UNAVAILABLE");
            return;
        }
        // Only the app's own server may be opened: the tab is a trusted
        // browser surface, and a page able to point it anywhere could dress
        // up any site in it.
        Uri url = Uri.parse(urlString);
        if (
            !"https".equals(url.getScheme()) ||
            !server.getHost().equals(url.getHost()) ||
            url.getPort() != -1 ||
            url.getUserInfo() != null
        ) {
            call.reject("Sign-in may only start on the app's own server", "INVALID");
            return;
        }
        String browser = customTabsBrowser();
        Uri callback = callbackUri(server, path);

        getActivity()
            .runOnUiThread(() -> {
                if (pendingCallId != null) {
                    call.reject("A sign-in is already in progress", "IN_PROGRESS");
                    return;
                }
                getBridge().saveCall(call);
                pendingCallId = call.getCallbackId();
                pendingCallback = callback;
                leftForTab = false;
                CustomTabsIntent tab = new CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    // The tab's URLs carry the flow's nonce; nothing offers to send them on.
                    .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
                    .build();
                tab.intent.setPackage(browser);
                try {
                    tab.launchUrl(getActivity(), url);
                } catch (ActivityNotFoundException e) {
                    PluginCall saved = takePending();
                    if (saved != null) saved.reject("The sign-in tab could not be opened", "FAILED");
                }
            });
    }

    /** The waiting call, released, with the pending state cleared. */
    private PluginCall takePending() {
        if (pendingCallId == null) return null;
        PluginCall call = getBridge().getSavedCall(pendingCallId);
        if (call != null) getBridge().releaseCall(call);
        pendingCallId = null;
        pendingCallback = null;
        leftForTab = false;
        return call;
    }

    /** Exactly the callback this sign-in waits for: https, its host and path, nothing else. */
    private boolean isPendingCallback(Uri data) {
        return (
            data != null &&
            "https".equals(data.getScheme()) &&
            pendingCallback.getHost().equals(data.getHost()) &&
            data.getPort() == -1 &&
            data.getUserInfo() == null &&
            pendingCallback.getPath().equals(data.getPath())
        );
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (pendingCallId == null || intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return;
        Uri data = intent.getData();
        if (!isPendingCallback(data)) return;
        PluginCall call = takePending();
        if (call == null) return;
        JSObject result = new JSObject();
        result.put("url", data.toString());
        call.resolve(result);
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (pendingCallId != null) leftForTab = true;
    }

    /**
     * Back in front without the callback: the person closed the tab (or
     * switched back to the app). Android delivers a callback through
     * onNewIntent before onResume, so a sign-in that finished has already
     * resolved by now.
     */
    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (pendingCallId == null || !leftForTab) return;
        PluginCall call = takePending();
        if (call != null) call.reject("Sign-in was cancelled", "CANCELED");
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        takePending();
    }
}
