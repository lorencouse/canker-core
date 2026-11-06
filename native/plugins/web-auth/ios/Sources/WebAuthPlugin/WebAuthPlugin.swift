import AuthenticationServices
import Capacitor
import Foundation

/// Apple's system sign-in sheet for the web app's OAuth sign-in.
///
/// ASWebAuthenticationSession, unlike SFSafariViewController (the Browser
/// plugin), shares Safari's cookies, saved passwords and passkeys, which is
/// why sign-in runs here rather than in the app's webview. The sheet loads
/// `url`, and when a page redirects to `callbackScheme://…` it closes and the
/// call resolves with that URL. The sheet captures the scheme itself, so it
/// is not registered in Info.plist.
///
/// JS: `WebAuth.start({ url, callbackScheme }) -> { url }`; rejects with code
/// CANCELED when the person closes the sheet. See utils/native.ts.
@objc(WebAuthPlugin)
public class WebAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "WebAuthPlugin"
    public let jsName = "WebAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise)
    ]

    private var session: ASWebAuthenticationSession?

    @objc func start(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Must provide a valid URL", "INVALID")
            return
        }
        guard let scheme = call.getString("callbackScheme"), !scheme.isEmpty else {
            call.reject("Must provide a callback scheme", "INVALID")
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
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callbackURL, error in
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
