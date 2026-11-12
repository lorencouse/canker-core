import Capacitor
import UIKit

/// Apple's own tab bar, laid over the webview, so iOS 26 draws it as Liquid
/// Glass and older iOS as the standard frosted bar. No CSS can do the first:
/// the glass refracts what is under it, and only the system can see that.
/// Kouzr's TabBar.swift, made self-contained for a plugin package.
///
/// The bar is a display and nothing more. The page
/// (components/shell/native-tabs.ts) owns the tabs, which one is lit, the
/// colours and when the bar is out of the way, and sends the whole of it on
/// every change; a tap is reported back as the tab's id and the page's router
/// does the rest. So the routes and the rules live in one place, and a deploy
/// can change any of them.
///
/// `set` answers with `top`: how far the bar's top sits above the bottom of
/// the webview, in points, which are CSS pixels in the webview. The page makes
/// that its --tab-lift, the clearance every screen keeps at its foot.
///
/// It floats over the content, which runs under it edge to edge. iOS 26 and
/// later float it themselves, so the bar is left as the system lays it out.
/// Older iOS gets a capsule of our own (FloatingTabBar): inset from both
/// sides, standing just over the home indicator, the system's own material
/// clipped to that shape. On a window wider than a phone it is no wider than
/// its four tabs need (maxWidth), centred, as the web bar is.
///
/// A binary without this plugin is why the page checks before hiding its own
/// bar: Capacitor.isPluginAvailable("NativeTabBar") is false there, and the
/// web bar stays.
@objc(TabBarPlugin)
public class TabBarPlugin: CAPPlugin, CAPBridgedPlugin, UITabBarDelegate {
    public let identifier = "TabBarPlugin"
    public let jsName = "NativeTabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise)
    ]

    /// The web bar's --tab-bar-max: four tabs need no more.
    static let maxWidth: CGFloat = 448

    private var bar: UITabBar?
    /// The tab ids in bar order; a UITabBarItem's tag is its index here.
    private var ids: [String] = []
    /// What the current items were built from, so a change of selection
    /// updates them in place rather than rebuilding the bar.
    private var shape: [String] = []
    private var hiddenNow = true

    @objc func set(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self, let host = self.bridge?.viewController?.view else {
                call.reject("no view to draw the bar in")
                return
            }
            let bar = self.bar ?? self.makeBar(in: host)
            // The webview can add views of its own after ours; the bar stays
            // on top of all of them.
            host.bringSubviewToFront(bar)
            self.apply(call, to: bar)
            host.layoutIfNeeded()
            if bar is FloatingTabBar { bar.layer.cornerRadius = bar.bounds.height / 2 }
            let top = max(0, host.bounds.height - bar.frame.minY)
            call.resolve(["top": Double(top)])
        }
    }

    /// Centred, the whole width of a phone and no more than maxWidth on
    /// anything wider.
    private func centre(_ bar: UIView, in host: UIView, inset: CGFloat) {
        let guide = host.safeAreaLayoutGuide
        let wide = bar.widthAnchor.constraint(equalToConstant: TabBarPlugin.maxWidth)
        wide.priority = .defaultHigh
        NSLayoutConstraint.activate([
            bar.centerXAnchor.constraint(equalTo: guide.centerXAnchor),
            bar.leadingAnchor.constraint(greaterThanOrEqualTo: guide.leadingAnchor, constant: inset),
            bar.trailingAnchor.constraint(lessThanOrEqualTo: guide.trailingAnchor, constant: -inset),
            wide
        ])
    }

    private func makeBar(in host: UIView) -> UITabBar {
        // iOS 26 floats the bar itself: a Liquid Glass capsule over the home
        // indicator, sized to its items. Given its bottom edge, as a tab bar
        // controller gives it, the capsule's top is the bar's own top. Boxed
        // in a capsule of our own, Kouzr found it laid its platter inside
        // ours and the clip cut the buttons to half height.
        if #available(iOS 26, *) {
            let bar = UITabBar()
            bar.delegate = self
            bar.isHidden = true
            bar.alpha = 0
            bar.itemPositioning = .centered
            bar.translatesAutoresizingMaskIntoConstraints = false
            host.addSubview(bar)
            centre(bar, in: host, inset: 0)
            bar.bottomAnchor.constraint(equalTo: host.bottomAnchor).isActive = true
            self.bar = bar
            return bar
        }
        let bar = FloatingTabBar()
        bar.delegate = self
        bar.isHidden = true
        bar.alpha = 0
        bar.itemPositioning = .centered
        bar.translatesAutoresizingMaskIntoConstraints = false
        host.addSubview(bar)
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.shadowColor = nil
        appearance.stackedItemPositioning = .centered
        // The items are laid out from the top of the bar; lifting the word
        // closes it on its icon, so the pair sits in the middle of the capsule.
        for item in [appearance.stackedLayoutAppearance, appearance.compactInlineLayoutAppearance, appearance.inlineLayoutAppearance] {
            item.normal.titlePositionAdjustment = UIOffset(horizontal: 0, vertical: -3)
            item.selected.titlePositionAdjustment = UIOffset(horizontal: 0, vertical: -3)
        }
        bar.standardAppearance = appearance
        bar.scrollEdgeAppearance = appearance
        bar.layer.cornerCurve = .continuous
        bar.layer.borderWidth = 0.5
        bar.layer.borderColor = UIColor.separator.cgColor
        bar.clipsToBounds = true
        // The web bar's --tab-gap at the sides. At the foot it gives back
        // part of the home indicator's 34pt, sitting just over the handle as
        // the web bar does, and keeps a few points off the edge on a phone
        // with no indicator.
        centre(bar, in: host, inset: 12)
        let overHandle = bar.bottomAnchor.constraint(equalTo: host.safeAreaLayoutGuide.bottomAnchor, constant: 14)
        overHandle.priority = .defaultHigh
        NSLayoutConstraint.activate([
            overHandle,
            bar.bottomAnchor.constraint(lessThanOrEqualTo: host.bottomAnchor, constant: -8),
            bar.heightAnchor.constraint(equalToConstant: FloatingTabBar.height)
        ])
        self.bar = bar
        return bar
    }

    private func apply(_ call: CAPPluginCall, to bar: UITabBar) {
        let specs: [(id: String, title: String, symbol: String)] =
            (call.getArray("items", JSObject.self) ?? []).map { item in
                (item["id"] as? String ?? "",
                 item["title"] as? String ?? "",
                 item["symbol"] as? String ?? "circle.fill")
            }

        let newShape = specs.map { "\($0.id)\u{1f}\($0.title)\u{1f}\($0.symbol)" }
        if newShape != shape {
            let items = specs.enumerated().map { index, spec -> UITabBarItem in
                let item = UITabBarItem(title: spec.title, image: TabBarPlugin.symbol(spec.symbol), tag: index)
                item.accessibilityIdentifier = "tab-\(spec.id)"
                return item
            }
            bar.setItems(items, animated: false)
            ids = specs.map(\.id)
            shape = newShape
        }

        bar.overrideUserInterfaceStyle = call.getBool("dark") == true ? .dark : .light
        if bar is FloatingTabBar {
            bar.layer.borderColor = UIColor.separator.resolvedColor(with: bar.traitCollection).cgColor
        }
        if let tint = TabBarPlugin.color(call.getString("tint")) {
            bar.tintColor = tint
        }

        if let selected = call.getString("selected"), let index = ids.firstIndex(of: selected) {
            bar.selectedItem = bar.items?[index]
        } else {
            bar.selectedItem = nil
        }

        setHidden(call.getBool("hidden") ?? false, bar)
    }

    /// A fade rather than a cut, the length of the page's own transitions,
    /// and no taps while it is going away.
    private func setHidden(_ hide: Bool, _ bar: UITabBar) {
        guard hide != hiddenNow else { return }
        hiddenNow = hide
        bar.isUserInteractionEnabled = !hide
        if !hide { bar.isHidden = false }
        UIView.animate(withDuration: 0.2, animations: {
            bar.alpha = hide ? 0 : 1
        }, completion: { [weak self] _ in
            if self?.hiddenNow == hide { bar.isHidden = hide }
        })
    }

    public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard item.tag >= 0, item.tag < ids.count else { return }
        notifyListeners("select", data: ["id": ids[item.tag]])
    }

    /// The symbol the page asked for, then its outline (a fill that does not
    /// exist on this iOS), then a plain circle rather than an empty slot.
    private static func symbol(_ name: String) -> UIImage? {
        UIImage(systemName: name)
            ?? UIImage(systemName: name.replacingOccurrences(of: ".fill", with: ""))
            ?? UIImage(systemName: "circle.fill")
    }

    /// "#rrggbb" or "#rrggbbaa", as the page sends them. Anything else is nil
    /// and the bar keeps the system's colour.
    private static func color(_ hex: String?) -> UIColor? {
        guard var s = hex?.trimmingCharacters(in: .whitespaces), s.hasPrefix("#") else { return nil }
        s.removeFirst()
        guard s.count == 6 || s.count == 8, let v = UInt64(s, radix: 16) else { return nil }
        let rgba = s.count == 6 ? (v << 8) | 0xff : v
        return UIColor(red: CGFloat((rgba >> 24) & 0xff) / 255,
                       green: CGFloat((rgba >> 16) & 0xff) / 255,
                       blue: CGFloat((rgba >> 8) & 0xff) / 255,
                       alpha: CGFloat(rgba & 0xff) / 255)
    }
}

/// A tab bar that floats over the home indicator rather than standing on it,
/// before iOS 26, which floats its own. UITabBar grows by its own bottom
/// safe-area inset and lays its items out for that taller box, so a bar
/// dipping into the indicator's strip would clip the tops of its icons. Its
/// height is the web bar's --tab-bar-h on touch.
final class FloatingTabBar: UITabBar {
    static let height: CGFloat = 60

    override var safeAreaInsets: UIEdgeInsets { .zero }

    override func sizeThatFits(_ size: CGSize) -> CGSize {
        CGSize(width: size.width, height: FloatingTabBar.height)
    }
}
