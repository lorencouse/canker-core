import AuthenticationServices
import Capacitor
import Foundation

/// Apple's system sign-in sheet for the web app's OAuth sign-in.
///
/// ASWebAuthenticationSession, unlike SFSafariViewController (the Browser
/// plugin), shares Safari's cookies, saved passwords and passkeys, which is
/// why sign-in runs here rather than in the app's webview. The sheet loads
/// `url`, and when a page redirects to `https://<server host><callbackPath>`
/// it closes and the call resolves with that URL. That callback needs iOS
/// 17.4, and iOS hands it only to an app the host's
/// apple-app-site-association names, so no other app can catch it. There is
/// deliberately no custom-scheme callback: any app can claim a scheme. Where
/// the https callback is unavailable, the web app keeps OAuth in the webview.
///
/// JS: `WebAuth.capabilities() -> { httpsCallback }`;
/// `WebAuth.start({ url, callbackPath }) -> { url }`, which rejects with code
/// CANCELED when the person closes the sheet. See utils/native.ts.
///
/// `WebAuth.apple({ nonce }) -> { idToken, authorizationCode?, givenName?,
/// familyName? }` is Sign in with Apple as the system's own sheet
/// (ASAuthorizationController), which Apple's guidelines prefer to its web
/// flow in an app. The identity token's audience is this app's bundle id and
/// it carries `nonce`, which the server checks. Apple gives the name on the
/// first authorization only; the email is read from the signed token on the
/// server, never passed here. Rejects with CANCELED when the person closes
/// the sheet and FAILED otherwise. Needs the
/// com.apple.developer.applesignin entitlement (scripts/patch-native.mjs).
@objc(WebAuthPlugin)
public class WebAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding,
    ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "WebAuthPlugin"
    public let jsName = "WebAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "apple", returnType: CAPPluginReturnPromise)
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
        guard let path = call.getString("callbackPath"), path.hasPrefix("/") else {
            call.reject("Must provide a callback path starting with /", "INVALID")
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
            guard #available(iOS 17.4, *), let host = self.httpsCallbackHost else {
                call.reject("System sign-in needs iOS 17.4 and an https server", "UNAVAILABLE")
                return
            }
            let session = ASWebAuthenticationSession(url: url, callback: .https(host: host, path: path), completionHandler: completion)
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

    // MARK: Sign in with Apple

    /// Each Apple sheet that is up, with the call waiting on it, keyed by its
    /// controller, so a second tap gets its own answer.
    private var appleSheets: [ObjectIdentifier: (controller: ASAuthorizationController, call: CAPPluginCall)] = [:]

    @objc func apple(_ call: CAPPluginCall) {
        guard let nonce = call.getString("nonce"), !nonce.isEmpty else {
            call.reject("Must provide a nonce", "INVALID")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = nonce
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.appleSheets[ObjectIdentifier(controller)] = (controller, call)
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? ASPresentationAnchor()
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let call = appleSheets.removeValue(forKey: ObjectIdentifier(controller))?.call else { return }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8) else {
            call.reject("Apple returned no identity token", "FAILED")
            return
        }
        var result: [String: Any] = ["idToken": idToken]
        if let codeData = credential.authorizationCode, let code = String(data: codeData, encoding: .utf8) {
            result["authorizationCode"] = code
        }
        if let given = credential.fullName?.givenName { result["givenName"] = given }
        if let family = credential.fullName?.familyName { result["familyName"] = family }
        call.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = appleSheets.removeValue(forKey: ObjectIdentifier(controller))?.call else { return }
        let canceled = (error as? ASAuthorizationError)?.code == .canceled
        call.reject(error.localizedDescription, canceled ? "CANCELED" : "FAILED", error)
    }
}
