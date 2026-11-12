import Capacitor
import UIKit

/// The fold of iPhone Duo, for the page (utils/fold.ts), the iPhone twin of
/// the Android FoldPlugin.java: same name, same get() and "change" answer.
/// Aireio's FoldPlugin.swift, made self-contained for a plugin package.
///
/// Opened flat, the inner display is one seamless screen and there is no fold
/// to report. Held partly open, it bends across the hinge, and UIKit reports
/// that strip as a division region. WebKit gives the page nothing of the
/// kind, so the shell reads the regions off the WebView and passes them on in
/// the WebView's own points, which are the page's CSS pixels.
///
/// The regions move when the hinge does (UIHingeInteraction) and when the
/// WebView is laid out again (folding, unfolding and turning all resize it,
/// which its bounds observer hears), so both call refresh(). The page hears
/// only real changes, and asks once with get() when it starts. Every other
/// iPhone and iPad, and anything before iOS 27.1, answers no regions, and the
/// page does nothing.
@objc(FoldPlugin)
public class FoldPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FoldPlugin"
    public let jsName = "Fold"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
    ]

    private var last: [[String: Double]] = []
    private var hinge: UIInteraction?
    private var bounds: NSKeyValueObservation?

    override public func load() {
        DispatchQueue.main.async { [weak self] in self?.watch() }
    }

    deinit {
        bounds?.invalidate()
    }

    @objc func get(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.last = self.regions()
            call.resolve(["regions": self.last])
        }
    }

    private func refresh() {
        let now = regions()
        guard now != last else { return }
        last = now
        notifyListeners("change", data: ["regions": now])
    }

    private func watch() {
        guard let webView = bridge?.webView else { return }
        if bounds == nil {
            bounds = webView.layer.observe(\.bounds, options: [.new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.refresh() }
            }
        }
        if hinge == nil, #available(iOS 27.1, *) {
            let interaction = UIHingeInteraction { [weak self] _, _ in self?.refresh() }
            webView.addInteraction(interaction)
            hinge = interaction
        }
    }

    private func regions() -> [[String: Double]] {
        guard let webView = bridge?.webView else { return [] }
        if #available(iOS 27.1, *) {
            return webView.reservedRegions(kind: .division)
                .filter { $0.isActive && !$0.frame.isEmpty }
                .map { region in
                    ["x": Double(region.frame.minX), "y": Double(region.frame.minY),
                     "width": Double(region.frame.width), "height": Double(region.frame.height)]
                }
        }
        return []
    }
}
