// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterMageGameScript",
    products: [
        .library(name: "TreeSitterMageGameScript", targets: ["TreeSitterMageGameScript"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterMageGameScript",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterMageGameScriptTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterMageGameScript",
            ],
            path: "bindings/swift/TreeSitterMageGameScriptTests"
        )
    ],
    cLanguageStandard: .c11
)
