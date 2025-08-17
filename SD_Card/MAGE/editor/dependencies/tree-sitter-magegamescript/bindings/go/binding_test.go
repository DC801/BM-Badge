package tree_sitter_magegamescript_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_magegamescript "github.com/alamedyang/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_magegamescript.Language())
	if language == nil {
		t.Errorf("Error loading MageGameScript grammar")
	}
}
