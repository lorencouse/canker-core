import AuthenticationServices
import Capacitor
import Foundation

/// Apple's system sign-in sheet for the web app's OAuth sign-in.
///
/// ASWebAuthenticationSession, unlike SFSafariViewController (the Browser
/// plugin), shares Safari's cookies, saved passwords and passkeys, which is
/// why sign-in runs here rather than in the app's webview. The sheet loads
/// `url`, and when a page redirects to the callback it closes and the call
/// resolves with that URL. The callback is `https://<server host><callbackPath>`
/// when `callbackPath` is given (iOS 17.4+: iOS hands it only to an app the
/// host's apple-app-site-association names, so no other app can catch it),
/// and `callbackScheme://…` otherwise. The sheet captures the scheme itself,
/// so it is not registered in Info.plist.
///
/// JS: `WebAuth.capabilities() -> { httpsCallback }`;
/// `WebAuth.start({ url, callbackScheme, callbackPath? }) -> { url }`, which
/// rejects with code CANCELED when the person closes the sheet. See
/// utils/native.ts.
@objc(WebAuthPlugin)
public class WebAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "WebAuthPlugin"
    public let jsName = "WebAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise)
    ]

    private var session: ASWebAuthenticationSession?

    /// The host an https callback can be caught on: the app's own server, on
    /// iOS 17.4+, when it is https on the default port (universal links are
    /// never anything else).
    private var httpsCallbackHost: String? {
        guard #available(iOS 17.4, *),
              let server = bridge?.config.serverURL,
              server.scheme == "https", server.port == nil,
              let host = server.host else { return nil }
        return host
    }

    @objc func capabilities(_ call: CAPPluginCall) {
        call.resolve(["httpsCallback": httpsCallbackHost != nil])
    }

    @objc func start(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Must provide a valid URL", "INVALID")
            return
        }
        guard let scheme = call.getString("callbackScheme"), !scheme.isEmpty else {
            call.reject("Must provide a callback scheme", "INVALID")
            return
        }
        let callbackPath = call.getString("callbackPath")
        if let path = callbackPath, !path.hasPrefix("/") {
            call.reject("The callback path must start with /", "INVALID")
            return
        }
        // Only the app's own server may be opened: the sheet is a trusted
        // system surface, and a page able to point it anywhere could dress
        // up any site in it.
        guard let server = bridge?.config.serverURL,
              url.scheme == server.scheme, url.host == server.host, url.port == server.port else {
            call.reject("Sign-in may only start on the app's own server", "INVALID")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if self.session != nil {
                call.reject("A sign-in is already in progress", "IN_PROGRESS")
                return
            }
            let completion: ASWebAuthenticationSession.CompletionHandler = { [weak self] callbackURL, error in
                self?.session = nil
                if let error = error {
                    if let authError = error as? ASWebAuthenticationSessionError, authError.code == .canceledLogin {
                        call.reject("Sign-in was cancelled", "CANCELED")
                    } else {
                        call.reject(error.localizedDescription, "FAILED", error)
                    }
                    return
                }
                guard let callbackURL = callbackURL else {
                    call.reject("Sign-in returned no callback", "FAILED")
                    return
                }
                call.resolve(["url": callbackURL.absoluteString])
            }
            let session: ASWebAuthenticationSession
            if let path = callbackPath {
                guard #available(iOS 17.4, *), let host = self.httpsCallbackHost else {
                    call.reject("An https callback needs iOS 17.4 and an https server", "UNAVAILABLE")
                    return
                }
                session = ASWebAuthenticationSession(url: url, callback: .https(host: host, path: path), completionHandler: completion)
            } else {
                session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme, completionHandler: completion)
            }
            session.presentationContextProvider = self
            // Shared, not ephemeral: Safari's accounts and passkeys are the point.
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            if !session.start() {
                self.session = nil
                call.reject("The sign-in sheet could not be opened", "FAILED")
            }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? ASPresentationAnchor()
    }
}
