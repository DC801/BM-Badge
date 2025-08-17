import XCTest
import SwiftTreeSitter
import TreeSitterMageGameScript

final class TreeSitterMageGameScriptTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_magegamescript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading MageGameScript grammar")
    }
}
