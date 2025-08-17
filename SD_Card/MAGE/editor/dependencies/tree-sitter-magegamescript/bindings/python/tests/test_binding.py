from unittest import TestCase

import tree_sitter, tree_sitter_magegamescript


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_magegamescript.language())
        except Exception:
            self.fail("Error loading MageGameScript grammar")
