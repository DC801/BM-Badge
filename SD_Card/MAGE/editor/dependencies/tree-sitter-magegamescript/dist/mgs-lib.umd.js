(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.MGSParser = {}));
})(this, function(exports) {
  "use strict";var __defProp2 = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var _a, _b, _c, _d, _e, _f, _g, _h;
  var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var SIZE_OF_SHORT = 2;
  var SIZE_OF_INT = 4;
  var SIZE_OF_CURSOR = 4 * SIZE_OF_INT;
  var SIZE_OF_NODE = 5 * SIZE_OF_INT;
  var SIZE_OF_POINT = 2 * SIZE_OF_INT;
  var SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT;
  var ZERO_POINT = { row: 0, column: 0 };
  var INTERNAL = Symbol("INTERNAL");
  function assertInternal(x) {
    if (x !== INTERNAL) throw new Error("Illegal constructor");
  }
  __name(assertInternal, "assertInternal");
  function isPoint(point) {
    return !!point && typeof point.row === "number" && typeof point.column === "number";
  }
  __name(isPoint, "isPoint");
  function setModule(module2) {
    C = module2;
  }
  __name(setModule, "setModule");
  var C;
  var LookaheadIterator = (_a = class {
    /** @internal */
    constructor(internal, address, language) {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, "language");
      assertInternal(internal);
      this[0] = address;
      this.language = language;
    }
    /** Get the current symbol of the lookahead iterator. */
    get currentTypeId() {
      return C._ts_lookahead_iterator_current_symbol(this[0]);
    }
    /** Get the current symbol name of the lookahead iterator. */
    get currentType() {
      return this.language.types[this.currentTypeId] || "ERROR";
    }
    /** Delete the lookahead iterator, freeing its resources. */
    delete() {
      C._ts_lookahead_iterator_delete(this[0]);
      this[0] = 0;
    }
    /**
     * Reset the lookahead iterator.
     *
     * This returns `true` if the language was set successfully and `false`
     * otherwise.
     */
    reset(language, stateId) {
      if (C._ts_lookahead_iterator_reset(this[0], language[0], stateId)) {
        this.language = language;
        return true;
      }
      return false;
    }
    /**
     * Reset the lookahead iterator to another state.
     *
     * This returns `true` if the iterator was reset to the given state and
     * `false` otherwise.
     */
    resetState(stateId) {
      return Boolean(C._ts_lookahead_iterator_reset_state(this[0], stateId));
    }
    /**
     * Returns an iterator that iterates over the symbols of the lookahead iterator.
     *
     * The iterator will yield the current symbol name as a string for each step
     * until there are no more symbols to iterate over.
     */
    [Symbol.iterator]() {
      return {
        next: /* @__PURE__ */ __name(() => {
          if (C._ts_lookahead_iterator_next(this[0])) {
            return { done: false, value: this.currentType };
          }
          return { done: true, value: "" };
        }, "next")
      };
    }
  }, __name(_a, "LookaheadIterator"), _a);
  function getText(tree, startIndex, endIndex, startPosition) {
    const length = endIndex - startIndex;
    let result = tree.textCallback(startIndex, startPosition);
    if (result) {
      startIndex += result.length;
      while (startIndex < endIndex) {
        const string = tree.textCallback(startIndex, startPosition);
        if (string && string.length > 0) {
          startIndex += string.length;
          result += string;
        } else {
          break;
        }
      }
      if (startIndex > endIndex) {
        result = result.slice(0, length);
      }
    }
    return result ?? "";
  }
  __name(getText, "getText");
  var Tree = (_b = class {
    /** @internal */
    constructor(internal, address, language, textCallback) {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, "textCallback");
      /** The language that was used to parse the syntax tree. */
      __publicField(this, "language");
      assertInternal(internal);
      this[0] = address;
      this.language = language;
      this.textCallback = textCallback;
    }
    /** Create a shallow copy of the syntax tree. This is very fast. */
    copy() {
      const address = C._ts_tree_copy(this[0]);
      return new _b(INTERNAL, address, this.language, this.textCallback);
    }
    /** Delete the syntax tree, freeing its resources. */
    delete() {
      C._ts_tree_delete(this[0]);
      this[0] = 0;
    }
    /** Get the root node of the syntax tree. */
    get rootNode() {
      C._ts_tree_root_node_wasm(this[0]);
      return unmarshalNode(this);
    }
    /**
     * Get the root node of the syntax tree, but with its position shifted
     * forward by the given offset.
     */
    rootNodeWithOffset(offsetBytes, offsetExtent) {
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      C.setValue(address, offsetBytes, "i32");
      marshalPoint(address + SIZE_OF_INT, offsetExtent);
      C._ts_tree_root_node_with_offset_wasm(this[0]);
      return unmarshalNode(this);
    }
    /**
     * Edit the syntax tree to keep it in sync with source code that has been
     * edited.
     *
     * You must describe the edit both in terms of byte offsets and in terms of
     * row/column coordinates.
     */
    edit(edit) {
      marshalEdit(edit);
      C._ts_tree_edit_wasm(this[0]);
    }
    /** Create a new {@link TreeCursor} starting from the root of the tree. */
    walk() {
      return this.rootNode.walk();
    }
    /**
     * Compare this old edited syntax tree to a new syntax tree representing
     * the same document, returning a sequence of ranges whose syntactic
     * structure has changed.
     *
     * For this to work correctly, this syntax tree must have been edited such
     * that its ranges match up to the new tree. Generally, you'll want to
     * call this method right after calling one of the [`Parser::parse`]
     * functions. Call it on the old tree that was passed to parse, and
     * pass the new tree that was returned from `parse`.
     */
    getChangedRanges(other) {
      if (!(other instanceof _b)) {
        throw new TypeError("Argument must be a Tree");
      }
      C._ts_tree_get_changed_ranges_wasm(this[0], other[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          result[i2] = unmarshalRange(address);
          address += SIZE_OF_RANGE;
        }
        C._free(buffer);
      }
      return result;
    }
    /** Get the included ranges that were used to parse the syntax tree. */
    getIncludedRanges() {
      C._ts_tree_included_ranges_wasm(this[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          result[i2] = unmarshalRange(address);
          address += SIZE_OF_RANGE;
        }
        C._free(buffer);
      }
      return result;
    }
  }, __name(_b, "Tree"), _b);
  var TreeCursor = (_c = class {
    /** @internal */
    constructor(internal, tree) {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, 1, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, 2, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, 3, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, "tree");
      assertInternal(internal);
      this.tree = tree;
      unmarshalTreeCursor(this);
    }
    /** Creates a deep copy of the tree cursor. This allocates new memory. */
    copy() {
      const copy = new _c(INTERNAL, this.tree);
      C._ts_tree_cursor_copy_wasm(this.tree[0]);
      unmarshalTreeCursor(copy);
      return copy;
    }
    /** Delete the tree cursor, freeing its resources. */
    delete() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_delete_wasm(this.tree[0]);
      this[0] = this[1] = this[2] = 0;
    }
    /** Get the tree cursor's current {@link Node}. */
    get currentNode() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_current_node_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /**
     * Get the numerical field id of this tree cursor's current node.
     *
     * See also {@link TreeCursor#currentFieldName}.
     */
    get currentFieldId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_field_id_wasm(this.tree[0]);
    }
    /** Get the field name of this tree cursor's current node. */
    get currentFieldName() {
      return this.tree.language.fields[this.currentFieldId];
    }
    /**
     * Get the depth of the cursor's current node relative to the original
     * node that the cursor was constructed with.
     */
    get currentDepth() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_depth_wasm(this.tree[0]);
    }
    /**
     * Get the index of the cursor's current node out of all of the
     * descendants of the original node that the cursor was constructed with.
     */
    get currentDescendantIndex() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_descendant_index_wasm(this.tree[0]);
    }
    /** Get the type of the cursor's current node. */
    get nodeType() {
      return this.tree.language.types[this.nodeTypeId] || "ERROR";
    }
    /** Get the type id of the cursor's current node. */
    get nodeTypeId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0]);
    }
    /** Get the state id of the cursor's current node. */
    get nodeStateId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_state_id_wasm(this.tree[0]);
    }
    /** Get the id of the cursor's current node. */
    get nodeId() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_id_wasm(this.tree[0]);
    }
    /**
     * Check if the cursor's current node is *named*.
     *
     * Named nodes correspond to named rules in the grammar, whereas
     * *anonymous* nodes correspond to string literals in the grammar.
     */
    get nodeIsNamed() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]) === 1;
    }
    /**
     * Check if the cursor's current node is *missing*.
     *
     * Missing nodes are inserted by the parser in order to recover from
     * certain kinds of syntax errors.
     */
    get nodeIsMissing() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]) === 1;
    }
    /** Get the string content of the cursor's current node. */
    get nodeText() {
      marshalTreeCursor(this);
      const startIndex = C._ts_tree_cursor_start_index_wasm(this.tree[0]);
      const endIndex = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
      C._ts_tree_cursor_start_position_wasm(this.tree[0]);
      const startPosition = unmarshalPoint(TRANSFER_BUFFER);
      return getText(this.tree, startIndex, endIndex, startPosition);
    }
    /** Get the start position of the cursor's current node. */
    get startPosition() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_start_position_wasm(this.tree[0]);
      return unmarshalPoint(TRANSFER_BUFFER);
    }
    /** Get the end position of the cursor's current node. */
    get endPosition() {
      marshalTreeCursor(this);
      C._ts_tree_cursor_end_position_wasm(this.tree[0]);
      return unmarshalPoint(TRANSFER_BUFFER);
    }
    /** Get the start index of the cursor's current node. */
    get startIndex() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_start_index_wasm(this.tree[0]);
    }
    /** Get the end index of the cursor's current node. */
    get endIndex() {
      marshalTreeCursor(this);
      return C._ts_tree_cursor_end_index_wasm(this.tree[0]);
    }
    /**
     * Move this cursor to the first child of its current node.
     *
     * This returns `true` if the cursor successfully moved, and returns
     * `false` if there were no children.
     */
    gotoFirstChild() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Move this cursor to the last child of its current node.
     *
     * This returns `true` if the cursor successfully moved, and returns
     * `false` if there were no children.
     *
     * Note that this function may be slower than
     * {@link TreeCursor#gotoFirstChild} because it needs to
     * iterate through all the children to compute the child's position.
     */
    gotoLastChild() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_last_child_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Move this cursor to the parent of its current node.
     *
     * This returns `true` if the cursor successfully moved, and returns
     * `false` if there was no parent node (the cursor was already on the
     * root node).
     *
     * Note that the node the cursor was constructed with is considered the root
     * of the cursor, and the cursor cannot walk outside this node.
     */
    gotoParent() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Move this cursor to the next sibling of its current node.
     *
     * This returns `true` if the cursor successfully moved, and returns
     * `false` if there was no next sibling node.
     *
     * Note that the node the cursor was constructed with is considered the root
     * of the cursor, and the cursor cannot walk outside this node.
     */
    gotoNextSibling() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Move this cursor to the previous sibling of its current node.
     *
     * This returns `true` if the cursor successfully moved, and returns
     * `false` if there was no previous sibling node.
     *
     * Note that this function may be slower than
     * {@link TreeCursor#gotoNextSibling} due to how node
     * positions are stored. In the worst case, this will need to iterate
     * through all the children up to the previous sibling node to recalculate
     * its position. Also note that the node the cursor was constructed with is
     * considered the root of the cursor, and the cursor cannot walk outside this node.
     */
    gotoPreviousSibling() {
      marshalTreeCursor(this);
      const result = C._ts_tree_cursor_goto_previous_sibling_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Move the cursor to the node that is the nth descendant of
     * the original node that the cursor was constructed with, where
     * zero represents the original node itself.
     */
    gotoDescendant(goalDescendantIndex) {
      marshalTreeCursor(this);
      C._ts_tree_cursor_goto_descendant_wasm(this.tree[0], goalDescendantIndex);
      unmarshalTreeCursor(this);
    }
    /**
     * Move this cursor to the first child of its current node that contains or
     * starts after the given byte offset.
     *
     * This returns `true` if the cursor successfully moved to a child node, and returns
     * `false` if no such child was found.
     */
    gotoFirstChildForIndex(goalIndex) {
      marshalTreeCursor(this);
      C.setValue(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalIndex, "i32");
      const result = C._ts_tree_cursor_goto_first_child_for_index_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Move this cursor to the first child of its current node that contains or
     * starts after the given byte offset.
     *
     * This returns the index of the child node if one was found, and returns
     * `null` if no such child was found.
     */
    gotoFirstChildForPosition(goalPosition) {
      marshalTreeCursor(this);
      marshalPoint(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalPosition);
      const result = C._ts_tree_cursor_goto_first_child_for_position_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
      return result === 1;
    }
    /**
     * Re-initialize this tree cursor to start at the original node that the
     * cursor was constructed with.
     */
    reset(node) {
      marshalNode(node);
      marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE);
      C._ts_tree_cursor_reset_wasm(this.tree[0]);
      unmarshalTreeCursor(this);
    }
    /**
     * Re-initialize a tree cursor to the same position as another cursor.
     *
     * Unlike {@link TreeCursor#reset}, this will not lose parent
     * information and allows reusing already created cursors.
     */
    resetTo(cursor) {
      marshalTreeCursor(this, TRANSFER_BUFFER);
      marshalTreeCursor(cursor, TRANSFER_BUFFER + SIZE_OF_CURSOR);
      C._ts_tree_cursor_reset_to_wasm(this.tree[0], cursor.tree[0]);
      unmarshalTreeCursor(this);
    }
  }, __name(_c, "TreeCursor"), _c);
  var Node = (_d = class {
    /** @internal */
    constructor(internal, {
      id,
      tree,
      startIndex,
      startPosition,
      other
    }) {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, "_children");
      /** @internal */
      __publicField(this, "_namedChildren");
      /**
       * The numeric id for this node that is unique.
       *
       * Within a given syntax tree, no two nodes have the same id. However:
       *
       * * If a new tree is created based on an older tree, and a node from the old tree is reused in
       *   the process, then that node will have the same id in both trees.
       *
       * * A node not marked as having changes does not guarantee it was reused.
       *
       * * If a node is marked as having changed in the old tree, it will not be reused.
       */
      __publicField(this, "id");
      /** The byte index where this node starts. */
      __publicField(this, "startIndex");
      /** The position where this node starts. */
      __publicField(this, "startPosition");
      /** The tree that this node belongs to. */
      __publicField(this, "tree");
      assertInternal(internal);
      this[0] = other;
      this.id = id;
      this.tree = tree;
      this.startIndex = startIndex;
      this.startPosition = startPosition;
    }
    /** Get this node's type as a numerical id. */
    get typeId() {
      marshalNode(this);
      return C._ts_node_symbol_wasm(this.tree[0]);
    }
    /**
     * Get the node's type as a numerical id as it appears in the grammar,
     * ignoring aliases.
     */
    get grammarId() {
      marshalNode(this);
      return C._ts_node_grammar_symbol_wasm(this.tree[0]);
    }
    /** Get this node's type as a string. */
    get type() {
      return this.tree.language.types[this.typeId] || "ERROR";
    }
    /**
     * Get this node's symbol name as it appears in the grammar, ignoring
     * aliases as a string.
     */
    get grammarType() {
      return this.tree.language.types[this.grammarId] || "ERROR";
    }
    /**
     * Check if this node is *named*.
     *
     * Named nodes correspond to named rules in the grammar, whereas
     * *anonymous* nodes correspond to string literals in the grammar.
     */
    get isNamed() {
      marshalNode(this);
      return C._ts_node_is_named_wasm(this.tree[0]) === 1;
    }
    /**
     * Check if this node is *extra*.
     *
     * Extra nodes represent things like comments, which are not required
     * by the grammar, but can appear anywhere.
     */
    get isExtra() {
      marshalNode(this);
      return C._ts_node_is_extra_wasm(this.tree[0]) === 1;
    }
    /**
     * Check if this node represents a syntax error.
     *
     * Syntax errors represent parts of the code that could not be incorporated
     * into a valid syntax tree.
     */
    get isError() {
      marshalNode(this);
      return C._ts_node_is_error_wasm(this.tree[0]) === 1;
    }
    /**
     * Check if this node is *missing*.
     *
     * Missing nodes are inserted by the parser in order to recover from
     * certain kinds of syntax errors.
     */
    get isMissing() {
      marshalNode(this);
      return C._ts_node_is_missing_wasm(this.tree[0]) === 1;
    }
    /** Check if this node has been edited. */
    get hasChanges() {
      marshalNode(this);
      return C._ts_node_has_changes_wasm(this.tree[0]) === 1;
    }
    /**
     * Check if this node represents a syntax error or contains any syntax
     * errors anywhere within it.
     */
    get hasError() {
      marshalNode(this);
      return C._ts_node_has_error_wasm(this.tree[0]) === 1;
    }
    /** Get the byte index where this node ends. */
    get endIndex() {
      marshalNode(this);
      return C._ts_node_end_index_wasm(this.tree[0]);
    }
    /** Get the position where this node ends. */
    get endPosition() {
      marshalNode(this);
      C._ts_node_end_point_wasm(this.tree[0]);
      return unmarshalPoint(TRANSFER_BUFFER);
    }
    /** Get the string content of this node. */
    get text() {
      return getText(this.tree, this.startIndex, this.endIndex, this.startPosition);
    }
    /** Get this node's parse state. */
    get parseState() {
      marshalNode(this);
      return C._ts_node_parse_state_wasm(this.tree[0]);
    }
    /** Get the parse state after this node. */
    get nextParseState() {
      marshalNode(this);
      return C._ts_node_next_parse_state_wasm(this.tree[0]);
    }
    /** Check if this node is equal to another node. */
    equals(other) {
      return this.tree === other.tree && this.id === other.id;
    }
    /**
     * Get the node's child at the given index, where zero represents the first child.
     *
     * This method is fairly fast, but its cost is technically log(n), so if
     * you might be iterating over a long list of children, you should use
     * {@link Node#children} instead.
     */
    child(index) {
      marshalNode(this);
      C._ts_node_child_wasm(this.tree[0], index);
      return unmarshalNode(this.tree);
    }
    /**
     * Get this node's *named* child at the given index.
     *
     * See also {@link Node#isNamed}.
     * This method is fairly fast, but its cost is technically log(n), so if
     * you might be iterating over a long list of children, you should use
     * {@link Node#namedChildren} instead.
     */
    namedChild(index) {
      marshalNode(this);
      C._ts_node_named_child_wasm(this.tree[0], index);
      return unmarshalNode(this.tree);
    }
    /**
     * Get this node's child with the given numerical field id.
     *
     * See also {@link Node#childForFieldName}. You can
     * convert a field name to an id using {@link Language#fieldIdForName}.
     */
    childForFieldId(fieldId) {
      marshalNode(this);
      C._ts_node_child_by_field_id_wasm(this.tree[0], fieldId);
      return unmarshalNode(this.tree);
    }
    /**
     * Get the first child with the given field name.
     *
     * If multiple children may have the same field name, access them using
     * {@link Node#childrenForFieldName}.
     */
    childForFieldName(fieldName) {
      const fieldId = this.tree.language.fields.indexOf(fieldName);
      if (fieldId !== -1) return this.childForFieldId(fieldId);
      return null;
    }
    /** Get the field name of this node's child at the given index. */
    fieldNameForChild(index) {
      marshalNode(this);
      const address = C._ts_node_field_name_for_child_wasm(this.tree[0], index);
      if (!address) return null;
      return C.AsciiToString(address);
    }
    /** Get the field name of this node's named child at the given index. */
    fieldNameForNamedChild(index) {
      marshalNode(this);
      const address = C._ts_node_field_name_for_named_child_wasm(this.tree[0], index);
      if (!address) return null;
      return C.AsciiToString(address);
    }
    /**
     * Get an array of this node's children with a given field name.
     *
     * See also {@link Node#children}.
     */
    childrenForFieldName(fieldName) {
      const fieldId = this.tree.language.fields.indexOf(fieldName);
      if (fieldId !== -1 && fieldId !== 0) return this.childrenForFieldId(fieldId);
      return [];
    }
    /**
      * Get an array of this node's children with a given field id.
      *
      * See also {@link Node#childrenForFieldName}.
      */
    childrenForFieldId(fieldId) {
      marshalNode(this);
      C._ts_node_children_by_field_id_wasm(this.tree[0], fieldId);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          result[i2] = unmarshalNode(this.tree, address);
          address += SIZE_OF_NODE;
        }
        C._free(buffer);
      }
      return result;
    }
    /** Get the node's first child that contains or starts after the given byte offset. */
    firstChildForIndex(index) {
      marshalNode(this);
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      C.setValue(address, index, "i32");
      C._ts_node_first_child_for_byte_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get the node's first named child that contains or starts after the given byte offset. */
    firstNamedChildForIndex(index) {
      marshalNode(this);
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      C.setValue(address, index, "i32");
      C._ts_node_first_named_child_for_byte_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get this node's number of children. */
    get childCount() {
      marshalNode(this);
      return C._ts_node_child_count_wasm(this.tree[0]);
    }
    /**
     * Get this node's number of *named* children.
     *
     * See also {@link Node#isNamed}.
     */
    get namedChildCount() {
      marshalNode(this);
      return C._ts_node_named_child_count_wasm(this.tree[0]);
    }
    /** Get this node's first child. */
    get firstChild() {
      return this.child(0);
    }
    /**
     * Get this node's first named child.
     *
     * See also {@link Node#isNamed}.
     */
    get firstNamedChild() {
      return this.namedChild(0);
    }
    /** Get this node's last child. */
    get lastChild() {
      return this.child(this.childCount - 1);
    }
    /**
     * Get this node's last named child.
     *
     * See also {@link Node#isNamed}.
     */
    get lastNamedChild() {
      return this.namedChild(this.namedChildCount - 1);
    }
    /**
     * Iterate over this node's children.
     *
     * If you're walking the tree recursively, you may want to use the
     * {@link TreeCursor} APIs directly instead.
     */
    get children() {
      if (!this._children) {
        marshalNode(this);
        C._ts_node_children_wasm(this.tree[0]);
        const count = C.getValue(TRANSFER_BUFFER, "i32");
        const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
        this._children = new Array(count);
        if (count > 0) {
          let address = buffer;
          for (let i2 = 0; i2 < count; i2++) {
            this._children[i2] = unmarshalNode(this.tree, address);
            address += SIZE_OF_NODE;
          }
          C._free(buffer);
        }
      }
      return this._children;
    }
    /**
     * Iterate over this node's named children.
     *
     * See also {@link Node#children}.
     */
    get namedChildren() {
      if (!this._namedChildren) {
        marshalNode(this);
        C._ts_node_named_children_wasm(this.tree[0]);
        const count = C.getValue(TRANSFER_BUFFER, "i32");
        const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
        this._namedChildren = new Array(count);
        if (count > 0) {
          let address = buffer;
          for (let i2 = 0; i2 < count; i2++) {
            this._namedChildren[i2] = unmarshalNode(this.tree, address);
            address += SIZE_OF_NODE;
          }
          C._free(buffer);
        }
      }
      return this._namedChildren;
    }
    /**
     * Get the descendants of this node that are the given type, or in the given types array.
     *
     * The types array should contain node type strings, which can be retrieved from {@link Language#types}.
     *
     * Additionally, a `startPosition` and `endPosition` can be passed in to restrict the search to a byte range.
     */
    descendantsOfType(types, startPosition = ZERO_POINT, endPosition = ZERO_POINT) {
      if (!Array.isArray(types)) types = [types];
      const symbols = [];
      const typesBySymbol = this.tree.language.types;
      for (const node_type of types) {
        if (node_type == "ERROR") {
          symbols.push(65535);
        }
      }
      for (let i2 = 0, n = typesBySymbol.length; i2 < n; i2++) {
        if (types.includes(typesBySymbol[i2])) {
          symbols.push(i2);
        }
      }
      const symbolsAddress = C._malloc(SIZE_OF_INT * symbols.length);
      for (let i2 = 0, n = symbols.length; i2 < n; i2++) {
        C.setValue(symbolsAddress + i2 * SIZE_OF_INT, symbols[i2], "i32");
      }
      marshalNode(this);
      C._ts_node_descendants_of_type_wasm(
        this.tree[0],
        symbolsAddress,
        symbols.length,
        startPosition.row,
        startPosition.column,
        endPosition.row,
        endPosition.column
      );
      const descendantCount = C.getValue(TRANSFER_BUFFER, "i32");
      const descendantAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(descendantCount);
      if (descendantCount > 0) {
        let address = descendantAddress;
        for (let i2 = 0; i2 < descendantCount; i2++) {
          result[i2] = unmarshalNode(this.tree, address);
          address += SIZE_OF_NODE;
        }
      }
      C._free(descendantAddress);
      C._free(symbolsAddress);
      return result;
    }
    /** Get this node's next sibling. */
    get nextSibling() {
      marshalNode(this);
      C._ts_node_next_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get this node's previous sibling. */
    get previousSibling() {
      marshalNode(this);
      C._ts_node_prev_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /**
     * Get this node's next *named* sibling.
     *
     * See also {@link Node#isNamed}.
     */
    get nextNamedSibling() {
      marshalNode(this);
      C._ts_node_next_named_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /**
     * Get this node's previous *named* sibling.
     *
     * See also {@link Node#isNamed}.
     */
    get previousNamedSibling() {
      marshalNode(this);
      C._ts_node_prev_named_sibling_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get the node's number of descendants, including one for the node itself. */
    get descendantCount() {
      marshalNode(this);
      return C._ts_node_descendant_count_wasm(this.tree[0]);
    }
    /**
     * Get this node's immediate parent.
     * Prefer {@link Node#childWithDescendant} for iterating over this node's ancestors.
     */
    get parent() {
      marshalNode(this);
      C._ts_node_parent_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /**
     * Get the node that contains `descendant`.
     *
     * Note that this can return `descendant` itself.
     */
    childWithDescendant(descendant) {
      marshalNode(this);
      marshalNode(descendant, 1);
      C._ts_node_child_with_descendant_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get the smallest node within this node that spans the given byte range. */
    descendantForIndex(start2, end = start2) {
      if (typeof start2 !== "number" || typeof end !== "number") {
        throw new Error("Arguments must be numbers");
      }
      marshalNode(this);
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      C.setValue(address, start2, "i32");
      C.setValue(address + SIZE_OF_INT, end, "i32");
      C._ts_node_descendant_for_index_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get the smallest named node within this node that spans the given byte range. */
    namedDescendantForIndex(start2, end = start2) {
      if (typeof start2 !== "number" || typeof end !== "number") {
        throw new Error("Arguments must be numbers");
      }
      marshalNode(this);
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      C.setValue(address, start2, "i32");
      C.setValue(address + SIZE_OF_INT, end, "i32");
      C._ts_node_named_descendant_for_index_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get the smallest node within this node that spans the given point range. */
    descendantForPosition(start2, end = start2) {
      if (!isPoint(start2) || !isPoint(end)) {
        throw new Error("Arguments must be {row, column} objects");
      }
      marshalNode(this);
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      marshalPoint(address, start2);
      marshalPoint(address + SIZE_OF_POINT, end);
      C._ts_node_descendant_for_position_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /** Get the smallest named node within this node that spans the given point range. */
    namedDescendantForPosition(start2, end = start2) {
      if (!isPoint(start2) || !isPoint(end)) {
        throw new Error("Arguments must be {row, column} objects");
      }
      marshalNode(this);
      const address = TRANSFER_BUFFER + SIZE_OF_NODE;
      marshalPoint(address, start2);
      marshalPoint(address + SIZE_OF_POINT, end);
      C._ts_node_named_descendant_for_position_wasm(this.tree[0]);
      return unmarshalNode(this.tree);
    }
    /**
     * Create a new {@link TreeCursor} starting from this node.
     *
     * Note that the given node is considered the root of the cursor,
     * and the cursor cannot walk outside this node.
     */
    walk() {
      marshalNode(this);
      C._ts_tree_cursor_new_wasm(this.tree[0]);
      return new TreeCursor(INTERNAL, this.tree);
    }
    /**
     * Edit this node to keep it in-sync with source code that has been edited.
     *
     * This function is only rarely needed. When you edit a syntax tree with
     * the {@link Tree#edit} method, all of the nodes that you retrieve from
     * the tree afterward will already reflect the edit. You only need to
     * use {@link Node#edit} when you have a specific {@link Node} instance that
     * you want to keep and continue to use after an edit.
     */
    edit(edit) {
      if (this.startIndex >= edit.oldEndIndex) {
        this.startIndex = edit.newEndIndex + (this.startIndex - edit.oldEndIndex);
        let subbedPointRow;
        let subbedPointColumn;
        if (this.startPosition.row > edit.oldEndPosition.row) {
          subbedPointRow = this.startPosition.row - edit.oldEndPosition.row;
          subbedPointColumn = this.startPosition.column;
        } else {
          subbedPointRow = 0;
          subbedPointColumn = this.startPosition.column;
          if (this.startPosition.column >= edit.oldEndPosition.column) {
            subbedPointColumn = this.startPosition.column - edit.oldEndPosition.column;
          }
        }
        if (subbedPointRow > 0) {
          this.startPosition.row += subbedPointRow;
          this.startPosition.column = subbedPointColumn;
        } else {
          this.startPosition.column += subbedPointColumn;
        }
      } else if (this.startIndex > edit.startIndex) {
        this.startIndex = edit.newEndIndex;
        this.startPosition.row = edit.newEndPosition.row;
        this.startPosition.column = edit.newEndPosition.column;
      }
    }
    /** Get the S-expression representation of this node. */
    toString() {
      marshalNode(this);
      const address = C._ts_node_to_string_wasm(this.tree[0]);
      const result = C.AsciiToString(address);
      C._free(address);
      return result;
    }
  }, __name(_d, "Node"), _d);
  function unmarshalCaptures(query, tree, address, patternIndex, result) {
    for (let i2 = 0, n = result.length; i2 < n; i2++) {
      const captureIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const node = unmarshalNode(tree, address);
      address += SIZE_OF_NODE;
      result[i2] = { patternIndex, name: query.captureNames[captureIndex], node };
    }
    return address;
  }
  __name(unmarshalCaptures, "unmarshalCaptures");
  function marshalNode(node, index = 0) {
    let address = TRANSFER_BUFFER + index * SIZE_OF_NODE;
    C.setValue(address, node.id, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, node.startIndex, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, node.startPosition.row, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, node.startPosition.column, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, node[0], "i32");
  }
  __name(marshalNode, "marshalNode");
  function unmarshalNode(tree, address = TRANSFER_BUFFER) {
    const id = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    if (id === 0) return null;
    const index = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    const row = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    const column = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    const other = C.getValue(address, "i32");
    const result = new Node(INTERNAL, {
      id,
      tree,
      startIndex: index,
      startPosition: { row, column },
      other
    });
    return result;
  }
  __name(unmarshalNode, "unmarshalNode");
  function marshalTreeCursor(cursor, address = TRANSFER_BUFFER) {
    C.setValue(address + 0 * SIZE_OF_INT, cursor[0], "i32");
    C.setValue(address + 1 * SIZE_OF_INT, cursor[1], "i32");
    C.setValue(address + 2 * SIZE_OF_INT, cursor[2], "i32");
    C.setValue(address + 3 * SIZE_OF_INT, cursor[3], "i32");
  }
  __name(marshalTreeCursor, "marshalTreeCursor");
  function unmarshalTreeCursor(cursor) {
    cursor[0] = C.getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32");
    cursor[1] = C.getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32");
    cursor[2] = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
    cursor[3] = C.getValue(TRANSFER_BUFFER + 3 * SIZE_OF_INT, "i32");
  }
  __name(unmarshalTreeCursor, "unmarshalTreeCursor");
  function marshalPoint(address, point) {
    C.setValue(address, point.row, "i32");
    C.setValue(address + SIZE_OF_INT, point.column, "i32");
  }
  __name(marshalPoint, "marshalPoint");
  function unmarshalPoint(address) {
    const result = {
      row: C.getValue(address, "i32") >>> 0,
      column: C.getValue(address + SIZE_OF_INT, "i32") >>> 0
    };
    return result;
  }
  __name(unmarshalPoint, "unmarshalPoint");
  function marshalRange(address, range) {
    marshalPoint(address, range.startPosition);
    address += SIZE_OF_POINT;
    marshalPoint(address, range.endPosition);
    address += SIZE_OF_POINT;
    C.setValue(address, range.startIndex, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, range.endIndex, "i32");
    address += SIZE_OF_INT;
  }
  __name(marshalRange, "marshalRange");
  function unmarshalRange(address) {
    const result = {};
    result.startPosition = unmarshalPoint(address);
    address += SIZE_OF_POINT;
    result.endPosition = unmarshalPoint(address);
    address += SIZE_OF_POINT;
    result.startIndex = C.getValue(address, "i32") >>> 0;
    address += SIZE_OF_INT;
    result.endIndex = C.getValue(address, "i32") >>> 0;
    return result;
  }
  __name(unmarshalRange, "unmarshalRange");
  function marshalEdit(edit, address = TRANSFER_BUFFER) {
    marshalPoint(address, edit.startPosition);
    address += SIZE_OF_POINT;
    marshalPoint(address, edit.oldEndPosition);
    address += SIZE_OF_POINT;
    marshalPoint(address, edit.newEndPosition);
    address += SIZE_OF_POINT;
    C.setValue(address, edit.startIndex, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, edit.oldEndIndex, "i32");
    address += SIZE_OF_INT;
    C.setValue(address, edit.newEndIndex, "i32");
    address += SIZE_OF_INT;
  }
  __name(marshalEdit, "marshalEdit");
  function unmarshalLanguageMetadata(address) {
    const result = {};
    result.major_version = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    result.minor_version = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    result.field_count = C.getValue(address, "i32");
    return result;
  }
  __name(unmarshalLanguageMetadata, "unmarshalLanguageMetadata");
  var PREDICATE_STEP_TYPE_CAPTURE = 1;
  var PREDICATE_STEP_TYPE_STRING = 2;
  var QUERY_WORD_REGEX = /[\w-]+/g;
  var isCaptureStep = /* @__PURE__ */ __name((step) => step.type === "capture", "isCaptureStep");
  var isStringStep = /* @__PURE__ */ __name((step) => step.type === "string", "isStringStep");
  var QueryErrorKind = {
    Syntax: 1,
    NodeName: 2,
    FieldName: 3,
    CaptureName: 4,
    PatternStructure: 5
  };
  var QueryError = (_e = class extends Error {
    constructor(kind, info2, index, length) {
      super(_e.formatMessage(kind, info2));
      this.kind = kind;
      this.info = info2;
      this.index = index;
      this.length = length;
      this.name = "QueryError";
    }
    /** Formats an error message based on the error kind and info */
    static formatMessage(kind, info2) {
      switch (kind) {
        case QueryErrorKind.NodeName:
          return `Bad node name '${info2.word}'`;
        case QueryErrorKind.FieldName:
          return `Bad field name '${info2.word}'`;
        case QueryErrorKind.CaptureName:
          return `Bad capture name @${info2.word}`;
        case QueryErrorKind.PatternStructure:
          return `Bad pattern structure at offset ${info2.suffix}`;
        case QueryErrorKind.Syntax:
          return `Bad syntax at offset ${info2.suffix}`;
      }
    }
  }, __name(_e, "QueryError"), _e);
  function parseAnyPredicate(steps, index, operator, textPredicates) {
    if (steps.length !== 3) {
      throw new Error(
        `Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}`
      );
    }
    if (!isCaptureStep(steps[1])) {
      throw new Error(
        `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}"`
      );
    }
    const isPositive = operator === "eq?" || operator === "any-eq?";
    const matchAll = !operator.startsWith("any-");
    if (isCaptureStep(steps[2])) {
      const captureName1 = steps[1].name;
      const captureName2 = steps[2].name;
      textPredicates[index].push((captures) => {
        const nodes1 = [];
        const nodes2 = [];
        for (const c of captures) {
          if (c.name === captureName1) nodes1.push(c.node);
          if (c.name === captureName2) nodes2.push(c.node);
        }
        const compare = /* @__PURE__ */ __name((n1, n2, positive) => {
          return positive ? n1.text === n2.text : n1.text !== n2.text;
        }, "compare");
        return matchAll ? nodes1.every((n1) => nodes2.some((n2) => compare(n1, n2, isPositive))) : nodes1.some((n1) => nodes2.some((n2) => compare(n1, n2, isPositive)));
      });
    } else {
      const captureName = steps[1].name;
      const stringValue = steps[2].value;
      const matches = /* @__PURE__ */ __name((n) => n.text === stringValue, "matches");
      const doesNotMatch = /* @__PURE__ */ __name((n) => n.text !== stringValue, "doesNotMatch");
      textPredicates[index].push((captures) => {
        const nodes = [];
        for (const c of captures) {
          if (c.name === captureName) nodes.push(c.node);
        }
        const test = isPositive ? matches : doesNotMatch;
        return matchAll ? nodes.every(test) : nodes.some(test);
      });
    }
  }
  __name(parseAnyPredicate, "parseAnyPredicate");
  function parseMatchPredicate(steps, index, operator, textPredicates) {
    if (steps.length !== 3) {
      throw new Error(
        `Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}.`
      );
    }
    if (steps[1].type !== "capture") {
      throw new Error(
        `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
      );
    }
    if (steps[2].type !== "string") {
      throw new Error(
        `Second argument of \`#${operator}\` predicate must be a string. Got @${steps[2].name}.`
      );
    }
    const isPositive = operator === "match?" || operator === "any-match?";
    const matchAll = !operator.startsWith("any-");
    const captureName = steps[1].name;
    const regex = new RegExp(steps[2].value);
    textPredicates[index].push((captures) => {
      const nodes = [];
      for (const c of captures) {
        if (c.name === captureName) nodes.push(c.node.text);
      }
      const test = /* @__PURE__ */ __name((text, positive) => {
        return positive ? regex.test(text) : !regex.test(text);
      }, "test");
      if (nodes.length === 0) return !isPositive;
      return matchAll ? nodes.every((text) => test(text, isPositive)) : nodes.some((text) => test(text, isPositive));
    });
  }
  __name(parseMatchPredicate, "parseMatchPredicate");
  function parseAnyOfPredicate(steps, index, operator, textPredicates) {
    if (steps.length < 2) {
      throw new Error(
        `Wrong number of arguments to \`#${operator}\` predicate. Expected at least 1. Got ${steps.length - 1}.`
      );
    }
    if (steps[1].type !== "capture") {
      throw new Error(
        `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
      );
    }
    const isPositive = operator === "any-of?";
    const captureName = steps[1].name;
    const stringSteps = steps.slice(2);
    if (!stringSteps.every(isStringStep)) {
      throw new Error(
        `Arguments to \`#${operator}\` predicate must be strings.".`
      );
    }
    const values = stringSteps.map((s) => s.value);
    textPredicates[index].push((captures) => {
      const nodes = [];
      for (const c of captures) {
        if (c.name === captureName) nodes.push(c.node.text);
      }
      if (nodes.length === 0) return !isPositive;
      return nodes.every((text) => values.includes(text)) === isPositive;
    });
  }
  __name(parseAnyOfPredicate, "parseAnyOfPredicate");
  function parseIsPredicate(steps, index, operator, assertedProperties, refutedProperties) {
    var _a2;
    if (steps.length < 2 || steps.length > 3) {
      throw new Error(
        `Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`
      );
    }
    if (!steps.every(isStringStep)) {
      throw new Error(
        `Arguments to \`#${operator}\` predicate must be strings.".`
      );
    }
    const properties = operator === "is?" ? assertedProperties : refutedProperties;
    if (!properties[index]) properties[index] = {};
    properties[index][steps[1].value] = ((_a2 = steps[2]) == null ? void 0 : _a2.value) ?? null;
  }
  __name(parseIsPredicate, "parseIsPredicate");
  function parseSetDirective(steps, index, setProperties) {
    var _a2;
    if (steps.length < 2 || steps.length > 3) {
      throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
    }
    if (!steps.every(isStringStep)) {
      throw new Error(`Arguments to \`#set!\` predicate must be strings.".`);
    }
    if (!setProperties[index]) setProperties[index] = {};
    setProperties[index][steps[1].value] = ((_a2 = steps[2]) == null ? void 0 : _a2.value) ?? null;
  }
  __name(parseSetDirective, "parseSetDirective");
  function parsePattern(index, stepType, stepValueId, captureNames, stringValues, steps, textPredicates, predicates, setProperties, assertedProperties, refutedProperties) {
    if (stepType === PREDICATE_STEP_TYPE_CAPTURE) {
      const name2 = captureNames[stepValueId];
      steps.push({ type: "capture", name: name2 });
    } else if (stepType === PREDICATE_STEP_TYPE_STRING) {
      steps.push({ type: "string", value: stringValues[stepValueId] });
    } else if (steps.length > 0) {
      if (steps[0].type !== "string") {
        throw new Error("Predicates must begin with a literal value");
      }
      const operator = steps[0].value;
      switch (operator) {
        case "any-not-eq?":
        case "not-eq?":
        case "any-eq?":
        case "eq?":
          parseAnyPredicate(steps, index, operator, textPredicates);
          break;
        case "any-not-match?":
        case "not-match?":
        case "any-match?":
        case "match?":
          parseMatchPredicate(steps, index, operator, textPredicates);
          break;
        case "not-any-of?":
        case "any-of?":
          parseAnyOfPredicate(steps, index, operator, textPredicates);
          break;
        case "is?":
        case "is-not?":
          parseIsPredicate(steps, index, operator, assertedProperties, refutedProperties);
          break;
        case "set!":
          parseSetDirective(steps, index, setProperties);
          break;
        default:
          predicates[index].push({ operator, operands: steps.slice(1) });
      }
      steps.length = 0;
    }
  }
  __name(parsePattern, "parsePattern");
  var Query = (_f = class {
    /**
     * Create a new query from a string containing one or more S-expression
     * patterns.
     *
     * The query is associated with a particular language, and can only be run
     * on syntax nodes parsed with that language. References to Queries can be
     * shared between multiple threads.
     *
     * @link {@see https://tree-sitter.github.io/tree-sitter/using-parsers/queries}
     */
    constructor(language, source) {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, "exceededMatchLimit");
      /** @internal */
      __publicField(this, "textPredicates");
      /** The names of the captures used in the query. */
      __publicField(this, "captureNames");
      /** The quantifiers of the captures used in the query. */
      __publicField(this, "captureQuantifiers");
      /**
       * The other user-defined predicates associated with the given index.
       *
       * This includes predicates with operators other than:
       * - `match?`
       * - `eq?` and `not-eq?`
       * - `any-of?` and `not-any-of?`
       * - `is?` and `is-not?`
       * - `set!`
       */
      __publicField(this, "predicates");
      /** The properties for predicates with the operator `set!`. */
      __publicField(this, "setProperties");
      /** The properties for predicates with the operator `is?`. */
      __publicField(this, "assertedProperties");
      /** The properties for predicates with the operator `is-not?`. */
      __publicField(this, "refutedProperties");
      /** The maximum number of in-progress matches for this cursor. */
      __publicField(this, "matchLimit");
      var _a2;
      const sourceLength = C.lengthBytesUTF8(source);
      const sourceAddress = C._malloc(sourceLength + 1);
      C.stringToUTF8(source, sourceAddress, sourceLength + 1);
      const address = C._ts_query_new(
        language[0],
        sourceAddress,
        sourceLength,
        TRANSFER_BUFFER,
        TRANSFER_BUFFER + SIZE_OF_INT
      );
      if (!address) {
        const errorId = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
        const errorByte = C.getValue(TRANSFER_BUFFER, "i32");
        const errorIndex = C.UTF8ToString(sourceAddress, errorByte).length;
        const suffix = source.slice(errorIndex, errorIndex + 100).split("\n")[0];
        const word = ((_a2 = suffix.match(QUERY_WORD_REGEX)) == null ? void 0 : _a2[0]) ?? "";
        C._free(sourceAddress);
        switch (errorId) {
          case QueryErrorKind.Syntax:
            throw new QueryError(QueryErrorKind.Syntax, { suffix: `${errorIndex}: '${suffix}'...` }, errorIndex, 0);
          case QueryErrorKind.NodeName:
            throw new QueryError(errorId, { word }, errorIndex, word.length);
          case QueryErrorKind.FieldName:
            throw new QueryError(errorId, { word }, errorIndex, word.length);
          case QueryErrorKind.CaptureName:
            throw new QueryError(errorId, { word }, errorIndex, word.length);
          case QueryErrorKind.PatternStructure:
            throw new QueryError(errorId, { suffix: `${errorIndex}: '${suffix}'...` }, errorIndex, 0);
        }
      }
      const stringCount = C._ts_query_string_count(address);
      const captureCount = C._ts_query_capture_count(address);
      const patternCount = C._ts_query_pattern_count(address);
      const captureNames = new Array(captureCount);
      const captureQuantifiers = new Array(patternCount);
      const stringValues = new Array(stringCount);
      for (let i2 = 0; i2 < captureCount; i2++) {
        const nameAddress = C._ts_query_capture_name_for_id(
          address,
          i2,
          TRANSFER_BUFFER
        );
        const nameLength = C.getValue(TRANSFER_BUFFER, "i32");
        captureNames[i2] = C.UTF8ToString(nameAddress, nameLength);
      }
      for (let i2 = 0; i2 < patternCount; i2++) {
        const captureQuantifiersArray = new Array(captureCount);
        for (let j = 0; j < captureCount; j++) {
          const quantifier = C._ts_query_capture_quantifier_for_id(address, i2, j);
          captureQuantifiersArray[j] = quantifier;
        }
        captureQuantifiers[i2] = captureQuantifiersArray;
      }
      for (let i2 = 0; i2 < stringCount; i2++) {
        const valueAddress = C._ts_query_string_value_for_id(
          address,
          i2,
          TRANSFER_BUFFER
        );
        const nameLength = C.getValue(TRANSFER_BUFFER, "i32");
        stringValues[i2] = C.UTF8ToString(valueAddress, nameLength);
      }
      const setProperties = new Array(patternCount);
      const assertedProperties = new Array(patternCount);
      const refutedProperties = new Array(patternCount);
      const predicates = new Array(patternCount);
      const textPredicates = new Array(patternCount);
      for (let i2 = 0; i2 < patternCount; i2++) {
        const predicatesAddress = C._ts_query_predicates_for_pattern(address, i2, TRANSFER_BUFFER);
        const stepCount = C.getValue(TRANSFER_BUFFER, "i32");
        predicates[i2] = [];
        textPredicates[i2] = [];
        const steps = new Array();
        let stepAddress = predicatesAddress;
        for (let j = 0; j < stepCount; j++) {
          const stepType = C.getValue(stepAddress, "i32");
          stepAddress += SIZE_OF_INT;
          const stepValueId = C.getValue(stepAddress, "i32");
          stepAddress += SIZE_OF_INT;
          parsePattern(
            i2,
            stepType,
            stepValueId,
            captureNames,
            stringValues,
            steps,
            textPredicates,
            predicates,
            setProperties,
            assertedProperties,
            refutedProperties
          );
        }
        Object.freeze(textPredicates[i2]);
        Object.freeze(predicates[i2]);
        Object.freeze(setProperties[i2]);
        Object.freeze(assertedProperties[i2]);
        Object.freeze(refutedProperties[i2]);
      }
      C._free(sourceAddress);
      this[0] = address;
      this.captureNames = captureNames;
      this.captureQuantifiers = captureQuantifiers;
      this.textPredicates = textPredicates;
      this.predicates = predicates;
      this.setProperties = setProperties;
      this.assertedProperties = assertedProperties;
      this.refutedProperties = refutedProperties;
      this.exceededMatchLimit = false;
    }
    /** Delete the query, freeing its resources. */
    delete() {
      C._ts_query_delete(this[0]);
      this[0] = 0;
    }
    /**
     * Iterate over all of the matches in the order that they were found.
     *
     * Each match contains the index of the pattern that matched, and a list of
     * captures. Because multiple patterns can match the same set of nodes,
     * one match may contain captures that appear *before* some of the
     * captures from a previous match.
     *
     * @param {Node} node - The node to execute the query on.
     *
     * @param {QueryOptions} options - Options for query execution.
     */
    matches(node, options = {}) {
      const startPosition = options.startPosition ?? ZERO_POINT;
      const endPosition = options.endPosition ?? ZERO_POINT;
      const startIndex = options.startIndex ?? 0;
      const endIndex = options.endIndex ?? 0;
      const matchLimit = options.matchLimit ?? 4294967295;
      const maxStartDepth = options.maxStartDepth ?? 4294967295;
      const timeoutMicros = options.timeoutMicros ?? 0;
      const progressCallback = options.progressCallback;
      if (typeof matchLimit !== "number") {
        throw new Error("Arguments must be numbers");
      }
      this.matchLimit = matchLimit;
      if (endIndex !== 0 && startIndex > endIndex) {
        throw new Error("`startIndex` cannot be greater than `endIndex`");
      }
      if (endPosition !== ZERO_POINT && (startPosition.row > endPosition.row || startPosition.row === endPosition.row && startPosition.column > endPosition.column)) {
        throw new Error("`startPosition` cannot be greater than `endPosition`");
      }
      if (progressCallback) {
        C.currentQueryProgressCallback = progressCallback;
      }
      marshalNode(node);
      C._ts_query_matches_wasm(
        this[0],
        node.tree[0],
        startPosition.row,
        startPosition.column,
        endPosition.row,
        endPosition.column,
        startIndex,
        endIndex,
        matchLimit,
        maxStartDepth,
        timeoutMicros
      );
      const rawCount = C.getValue(TRANSFER_BUFFER, "i32");
      const startAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const didExceedMatchLimit = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
      const result = new Array(rawCount);
      this.exceededMatchLimit = Boolean(didExceedMatchLimit);
      let filteredCount = 0;
      let address = startAddress;
      for (let i2 = 0; i2 < rawCount; i2++) {
        const patternIndex = C.getValue(address, "i32");
        address += SIZE_OF_INT;
        const captureCount = C.getValue(address, "i32");
        address += SIZE_OF_INT;
        const captures = new Array(captureCount);
        address = unmarshalCaptures(this, node.tree, address, patternIndex, captures);
        if (this.textPredicates[patternIndex].every((p) => p(captures))) {
          result[filteredCount] = { pattern: patternIndex, patternIndex, captures };
          const setProperties = this.setProperties[patternIndex];
          result[filteredCount].setProperties = setProperties;
          const assertedProperties = this.assertedProperties[patternIndex];
          result[filteredCount].assertedProperties = assertedProperties;
          const refutedProperties = this.refutedProperties[patternIndex];
          result[filteredCount].refutedProperties = refutedProperties;
          filteredCount++;
        }
      }
      result.length = filteredCount;
      C._free(startAddress);
      C.currentQueryProgressCallback = null;
      return result;
    }
    /**
     * Iterate over all of the individual captures in the order that they
     * appear.
     *
     * This is useful if you don't care about which pattern matched, and just
     * want a single, ordered sequence of captures.
     *
     * @param {Node} node - The node to execute the query on.
     *
     * @param {QueryOptions} options - Options for query execution.
     */
    captures(node, options = {}) {
      const startPosition = options.startPosition ?? ZERO_POINT;
      const endPosition = options.endPosition ?? ZERO_POINT;
      const startIndex = options.startIndex ?? 0;
      const endIndex = options.endIndex ?? 0;
      const matchLimit = options.matchLimit ?? 4294967295;
      const maxStartDepth = options.maxStartDepth ?? 4294967295;
      const timeoutMicros = options.timeoutMicros ?? 0;
      const progressCallback = options.progressCallback;
      if (typeof matchLimit !== "number") {
        throw new Error("Arguments must be numbers");
      }
      this.matchLimit = matchLimit;
      if (endIndex !== 0 && startIndex > endIndex) {
        throw new Error("`startIndex` cannot be greater than `endIndex`");
      }
      if (endPosition !== ZERO_POINT && (startPosition.row > endPosition.row || startPosition.row === endPosition.row && startPosition.column > endPosition.column)) {
        throw new Error("`startPosition` cannot be greater than `endPosition`");
      }
      if (progressCallback) {
        C.currentQueryProgressCallback = progressCallback;
      }
      marshalNode(node);
      C._ts_query_captures_wasm(
        this[0],
        node.tree[0],
        startPosition.row,
        startPosition.column,
        endPosition.row,
        endPosition.column,
        startIndex,
        endIndex,
        matchLimit,
        maxStartDepth,
        timeoutMicros
      );
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const startAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const didExceedMatchLimit = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
      const result = new Array();
      this.exceededMatchLimit = Boolean(didExceedMatchLimit);
      const captures = new Array();
      let address = startAddress;
      for (let i2 = 0; i2 < count; i2++) {
        const patternIndex = C.getValue(address, "i32");
        address += SIZE_OF_INT;
        const captureCount = C.getValue(address, "i32");
        address += SIZE_OF_INT;
        const captureIndex = C.getValue(address, "i32");
        address += SIZE_OF_INT;
        captures.length = captureCount;
        address = unmarshalCaptures(this, node.tree, address, patternIndex, captures);
        if (this.textPredicates[patternIndex].every((p) => p(captures))) {
          const capture = captures[captureIndex];
          const setProperties = this.setProperties[patternIndex];
          capture.setProperties = setProperties;
          const assertedProperties = this.assertedProperties[patternIndex];
          capture.assertedProperties = assertedProperties;
          const refutedProperties = this.refutedProperties[patternIndex];
          capture.refutedProperties = refutedProperties;
          result.push(capture);
        }
      }
      C._free(startAddress);
      C.currentQueryProgressCallback = null;
      return result;
    }
    /** Get the predicates for a given pattern. */
    predicatesForPattern(patternIndex) {
      return this.predicates[patternIndex];
    }
    /**
     * Disable a certain capture within a query.
     *
     * This prevents the capture from being returned in matches, and also
     * avoids any resource usage associated with recording the capture.
     */
    disableCapture(captureName) {
      const captureNameLength = C.lengthBytesUTF8(captureName);
      const captureNameAddress = C._malloc(captureNameLength + 1);
      C.stringToUTF8(captureName, captureNameAddress, captureNameLength + 1);
      C._ts_query_disable_capture(this[0], captureNameAddress, captureNameLength);
      C._free(captureNameAddress);
    }
    /**
     * Disable a certain pattern within a query.
     *
     * This prevents the pattern from matching, and also avoids any resource
     * usage associated with the pattern. This throws an error if the pattern
     * index is out of bounds.
     */
    disablePattern(patternIndex) {
      if (patternIndex >= this.predicates.length) {
        throw new Error(
          `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
        );
      }
      C._ts_query_disable_pattern(this[0], patternIndex);
    }
    /**
     * Check if, on its last execution, this cursor exceeded its maximum number
     * of in-progress matches.
     */
    didExceedMatchLimit() {
      return this.exceededMatchLimit;
    }
    /** Get the byte offset where the given pattern starts in the query's source. */
    startIndexForPattern(patternIndex) {
      if (patternIndex >= this.predicates.length) {
        throw new Error(
          `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
        );
      }
      return C._ts_query_start_byte_for_pattern(this[0], patternIndex);
    }
    /** Get the byte offset where the given pattern ends in the query's source. */
    endIndexForPattern(patternIndex) {
      if (patternIndex >= this.predicates.length) {
        throw new Error(
          `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
        );
      }
      return C._ts_query_end_byte_for_pattern(this[0], patternIndex);
    }
    /** Get the number of patterns in the query. */
    patternCount() {
      return C._ts_query_pattern_count(this[0]);
    }
    /** Get the index for a given capture name. */
    captureIndexForName(captureName) {
      return this.captureNames.indexOf(captureName);
    }
    /** Check if a given pattern within a query has a single root node. */
    isPatternRooted(patternIndex) {
      return C._ts_query_is_pattern_rooted(this[0], patternIndex) === 1;
    }
    /** Check if a given pattern within a query has a single root node. */
    isPatternNonLocal(patternIndex) {
      return C._ts_query_is_pattern_non_local(this[0], patternIndex) === 1;
    }
    /**
     * Check if a given step in a query is 'definite'.
     *
     * A query step is 'definite' if its parent pattern will be guaranteed to
     * match successfully once it reaches the step.
     */
    isPatternGuaranteedAtStep(byteIndex) {
      return C._ts_query_is_pattern_guaranteed_at_step(this[0], byteIndex) === 1;
    }
  }, __name(_f, "Query"), _f);
  var LANGUAGE_FUNCTION_REGEX = /^tree_sitter_\w+$/;
  var Language = (_g = class {
    /** @internal */
    constructor(internal, address) {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /**
       * A list of all node types in the language. The index of each type in this
       * array is its node type id.
       */
      __publicField(this, "types");
      /**
       * A list of all field names in the language. The index of each field name in
       * this array is its field id.
       */
      __publicField(this, "fields");
      assertInternal(internal);
      this[0] = address;
      this.types = new Array(C._ts_language_symbol_count(this[0]));
      for (let i2 = 0, n = this.types.length; i2 < n; i2++) {
        if (C._ts_language_symbol_type(this[0], i2) < 2) {
          this.types[i2] = C.UTF8ToString(C._ts_language_symbol_name(this[0], i2));
        }
      }
      this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
      for (let i2 = 0, n = this.fields.length; i2 < n; i2++) {
        const fieldName = C._ts_language_field_name_for_id(this[0], i2);
        if (fieldName !== 0) {
          this.fields[i2] = C.UTF8ToString(fieldName);
        } else {
          this.fields[i2] = null;
        }
      }
    }
    /**
     * Gets the name of the language.
     */
    get name() {
      const ptr = C._ts_language_name(this[0]);
      if (ptr === 0) return null;
      return C.UTF8ToString(ptr);
    }
    /**
     * @deprecated since version 0.25.0, use {@link Language#abiVersion} instead
     * Gets the version of the language.
     */
    get version() {
      return C._ts_language_version(this[0]);
    }
    /**
     * Gets the ABI version of the language.
     */
    get abiVersion() {
      return C._ts_language_abi_version(this[0]);
    }
    /**
    * Get the metadata for this language. This information is generated by the
    * CLI, and relies on the language author providing the correct metadata in
    * the language's `tree-sitter.json` file.
    */
    get metadata() {
      C._ts_language_metadata(this[0]);
      const length = C.getValue(TRANSFER_BUFFER, "i32");
      const address = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      if (length === 0) return null;
      return unmarshalLanguageMetadata(address);
    }
    /**
     * Gets the number of fields in the language.
     */
    get fieldCount() {
      return this.fields.length - 1;
    }
    /**
     * Gets the number of states in the language.
     */
    get stateCount() {
      return C._ts_language_state_count(this[0]);
    }
    /**
     * Get the field id for a field name.
     */
    fieldIdForName(fieldName) {
      const result = this.fields.indexOf(fieldName);
      return result !== -1 ? result : null;
    }
    /**
     * Get the field name for a field id.
     */
    fieldNameForId(fieldId) {
      return this.fields[fieldId] ?? null;
    }
    /**
     * Get the node type id for a node type name.
     */
    idForNodeType(type, named) {
      const typeLength = C.lengthBytesUTF8(type);
      const typeAddress = C._malloc(typeLength + 1);
      C.stringToUTF8(type, typeAddress, typeLength + 1);
      const result = C._ts_language_symbol_for_name(this[0], typeAddress, typeLength, named ? 1 : 0);
      C._free(typeAddress);
      return result || null;
    }
    /**
     * Gets the number of node types in the language.
     */
    get nodeTypeCount() {
      return C._ts_language_symbol_count(this[0]);
    }
    /**
     * Get the node type name for a node type id.
     */
    nodeTypeForId(typeId) {
      const name2 = C._ts_language_symbol_name(this[0], typeId);
      return name2 ? C.UTF8ToString(name2) : null;
    }
    /**
     * Check if a node type is named.
     *
     * @see {@link https://tree-sitter.github.io/tree-sitter/using-parsers/2-basic-parsing.html#named-vs-anonymous-nodes}
     */
    nodeTypeIsNamed(typeId) {
      return C._ts_language_type_is_named_wasm(this[0], typeId) ? true : false;
    }
    /**
     * Check if a node type is visible.
     */
    nodeTypeIsVisible(typeId) {
      return C._ts_language_type_is_visible_wasm(this[0], typeId) ? true : false;
    }
    /**
     * Get the supertypes ids of this language.
     *
     * @see {@link https://tree-sitter.github.io/tree-sitter/using-parsers/6-static-node-types.html?highlight=supertype#supertype-nodes}
     */
    get supertypes() {
      C._ts_language_supertypes_wasm(this[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          result[i2] = C.getValue(address, "i16");
          address += SIZE_OF_SHORT;
        }
      }
      return result;
    }
    /**
     * Get the subtype ids for a given supertype node id.
     */
    subtypes(supertype) {
      C._ts_language_subtypes_wasm(this[0], supertype);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          result[i2] = C.getValue(address, "i16");
          address += SIZE_OF_SHORT;
        }
      }
      return result;
    }
    /**
     * Get the next state id for a given state id and node type id.
     */
    nextState(stateId, typeId) {
      return C._ts_language_next_state(this[0], stateId, typeId);
    }
    /**
     * Create a new lookahead iterator for this language and parse state.
     *
     * This returns `null` if state is invalid for this language.
     *
     * Iterating {@link LookaheadIterator} will yield valid symbols in the given
     * parse state. Newly created lookahead iterators will return the `ERROR`
     * symbol from {@link LookaheadIterator#currentType}.
     *
     * Lookahead iterators can be useful for generating suggestions and improving
     * syntax error diagnostics. To get symbols valid in an `ERROR` node, use the
     * lookahead iterator on its first leaf node state. For `MISSING` nodes, a
     * lookahead iterator created on the previous non-extra leaf node may be
     * appropriate.
     */
    lookaheadIterator(stateId) {
      const address = C._ts_lookahead_iterator_new(this[0], stateId);
      if (address) return new LookaheadIterator(INTERNAL, address, this);
      return null;
    }
    /**
     * @deprecated since version 0.25.0, call `new` on a {@link Query} instead
     *
     * Create a new query from a string containing one or more S-expression
     * patterns.
     *
     * The query is associated with a particular language, and can only be run
     * on syntax nodes parsed with that language. References to Queries can be
     * shared between multiple threads.
     *
     * @link {@see https://tree-sitter.github.io/tree-sitter/using-parsers/queries}
     */
    query(source) {
      console.warn("Language.query is deprecated. Use new Query(language, source) instead.");
      return new Query(this, source);
    }
    /**
     * Load a language from a WebAssembly module.
     * The module can be provided as a path to a file or as a buffer.
     */
    static async load(input) {
      var _a2;
      let bytes;
      if (input instanceof Uint8Array) {
        bytes = Promise.resolve(input);
      } else {
        if ((_a2 = globalThis.process) == null ? void 0 : _a2.versions.node) {
          const fs2 = await Promise.resolve().then(() => __viteBrowserExternal);
          bytes = fs2.readFile(input);
        } else {
          bytes = fetch(input).then((response) => response.arrayBuffer().then((buffer) => {
            if (response.ok) {
              return new Uint8Array(buffer);
            } else {
              const body2 = new TextDecoder("utf-8").decode(buffer);
              throw new Error(`Language.load failed with status ${response.status}.

${body2}`);
            }
          }));
        }
      }
      const mod = await C.loadWebAssemblyModule(await bytes, { loadAsync: true });
      const symbolNames = Object.keys(mod);
      const functionName = symbolNames.find((key) => LANGUAGE_FUNCTION_REGEX.test(key) && !key.includes("external_scanner_"));
      if (!functionName) {
        console.log(`Couldn't find language function in WASM file. Symbols:
${JSON.stringify(symbolNames, null, 2)}`);
        throw new Error("Language.load failed: no language function found in WASM file");
      }
      const languageAddress = mod[functionName]();
      return new _g(INTERNAL, languageAddress);
    }
  }, __name(_g, "Language"), _g);
  var Module2 = (() => {
    var _scriptName = typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("mgs-lib.umd.js", document.baseURI).href;
    return async function(moduleArg = {}) {
      var moduleRtn;
      var Module = moduleArg;
      var readyPromiseResolve, readyPromiseReject;
      var readyPromise = new Promise((resolve, reject) => {
        readyPromiseResolve = resolve;
        readyPromiseReject = reject;
      });
      var ENVIRONMENT_IS_WEB = typeof window == "object";
      var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
      var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
      if (ENVIRONMENT_IS_NODE) {
        const { createRequire } = await Promise.resolve().then(() => __viteBrowserExternal);
        var require$1 = createRequire(typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("mgs-lib.umd.js", document.baseURI).href);
      }
      Module.currentQueryProgressCallback = null;
      Module.currentProgressCallback = null;
      Module.currentLogCallback = null;
      Module.currentParseCallback = null;
      var moduleOverrides = Object.assign({}, Module);
      var arguments_ = [];
      var thisProgram = "./this.program";
      var quit_ = /* @__PURE__ */ __name((status, toThrow) => {
        throw toThrow;
      }, "quit_");
      var scriptDirectory = "";
      function locateFile(path) {
        if (Module["locateFile"]) {
          return Module["locateFile"](path, scriptDirectory);
        }
        return scriptDirectory + path;
      }
      __name(locateFile, "locateFile");
      var readAsync, readBinary;
      if (ENVIRONMENT_IS_NODE) {
        var fs = require$1("fs");
        var nodePath = require$1("path");
        if (!(typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("mgs-lib.umd.js", document.baseURI).href).startsWith("data:")) {
          scriptDirectory = nodePath.dirname(require$1("url").fileURLToPath(typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("mgs-lib.umd.js", document.baseURI).href)) + "/";
        }
        readBinary = /* @__PURE__ */ __name((filename) => {
          filename = isFileURI(filename) ? new URL(filename) : filename;
          var ret = fs.readFileSync(filename);
          return ret;
        }, "readBinary");
        readAsync = /* @__PURE__ */ __name(async (filename, binary2 = true) => {
          filename = isFileURI(filename) ? new URL(filename) : filename;
          var ret = fs.readFileSync(filename, binary2 ? void 0 : "utf8");
          return ret;
        }, "readAsync");
        if (!Module["thisProgram"] && process.argv.length > 1) {
          thisProgram = process.argv[1].replace(/\\/g, "/");
        }
        arguments_ = process.argv.slice(2);
        quit_ = /* @__PURE__ */ __name((status, toThrow) => {
          process.exitCode = status;
          throw toThrow;
        }, "quit_");
      } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
        if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = self.location.href;
        } else if (typeof document != "undefined" && document.currentScript) {
          scriptDirectory = document.currentScript.src;
        }
        if (_scriptName) {
          scriptDirectory = _scriptName;
        }
        if (scriptDirectory.startsWith("blob:")) {
          scriptDirectory = "";
        } else {
          scriptDirectory = scriptDirectory.slice(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
        }
        {
          if (ENVIRONMENT_IS_WORKER) {
            readBinary = /* @__PURE__ */ __name((url) => {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", url, false);
              xhr.responseType = "arraybuffer";
              xhr.send(null);
              return new Uint8Array(
                /** @type{!ArrayBuffer} */
                xhr.response
              );
            }, "readBinary");
          }
          readAsync = /* @__PURE__ */ __name(async (url) => {
            if (isFileURI(url)) {
              return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);
                xhr.responseType = "arraybuffer";
                xhr.onload = () => {
                  if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    resolve(xhr.response);
                    return;
                  }
                  reject(xhr.status);
                };
                xhr.onerror = reject;
                xhr.send(null);
              });
            }
            var response = await fetch(url, {
              credentials: "same-origin"
            });
            if (response.ok) {
              return response.arrayBuffer();
            }
            throw new Error(response.status + " : " + response.url);
          }, "readAsync");
        }
      } else ;
      var out = Module["print"] || console.log.bind(console);
      var err = Module["printErr"] || console.error.bind(console);
      Object.assign(Module, moduleOverrides);
      moduleOverrides = null;
      if (Module["arguments"]) arguments_ = Module["arguments"];
      if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
      var dynamicLibraries = Module["dynamicLibraries"] || [];
      var wasmBinary = Module["wasmBinary"];
      var wasmMemory;
      var ABORT = false;
      var EXITSTATUS;
      function assert(condition, text) {
        if (!condition) {
          abort(text);
        }
      }
      __name(assert, "assert");
      var HEAP8, HEAPU8, HEAP64;
      var HEAP_DATA_VIEW;
      var runtimeInitialized = false;
      var isFileURI = /* @__PURE__ */ __name((filename) => filename.startsWith("file://"), "isFileURI");
      function updateMemoryViews() {
        var b = wasmMemory.buffer;
        Module["HEAP_DATA_VIEW"] = HEAP_DATA_VIEW = new DataView(b);
        Module["HEAP8"] = HEAP8 = new Int8Array(b);
        Module["HEAP16"] = new Int16Array(b);
        Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
        Module["HEAPU16"] = new Uint16Array(b);
        Module["HEAP32"] = new Int32Array(b);
        Module["HEAPU32"] = new Uint32Array(b);
        Module["HEAPF32"] = new Float32Array(b);
        Module["HEAPF64"] = new Float64Array(b);
        Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
        Module["HEAPU64"] = new BigUint64Array(b);
      }
      __name(updateMemoryViews, "updateMemoryViews");
      if (Module["wasmMemory"]) {
        wasmMemory = Module["wasmMemory"];
      } else {
        var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
        wasmMemory = new WebAssembly.Memory({
          "initial": INITIAL_MEMORY / 65536,
          // In theory we should not need to emit the maximum if we want "unlimited"
          // or 4GB of memory, but VMs error on that atm, see
          // https://github.com/emscripten-core/emscripten/issues/14130
          // And in the pthreads case we definitely need to emit a maximum. So
          // always emit one.
          "maximum": 32768
        });
      }
      updateMemoryViews();
      var __RELOC_FUNCS__ = [];
      function preRun() {
        if (Module["preRun"]) {
          if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
          while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift());
          }
        }
        callRuntimeCallbacks(onPreRuns);
      }
      __name(preRun, "preRun");
      function initRuntime() {
        runtimeInitialized = true;
        callRuntimeCallbacks(__RELOC_FUNCS__);
        wasmExports["__wasm_call_ctors"]();
        callRuntimeCallbacks(onPostCtors);
      }
      __name(initRuntime, "initRuntime");
      function preMain() {
      }
      __name(preMain, "preMain");
      function postRun() {
        if (Module["postRun"]) {
          if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
          while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift());
          }
        }
        callRuntimeCallbacks(onPostRuns);
      }
      __name(postRun, "postRun");
      var runDependencies = 0;
      var dependenciesFulfilled = null;
      function getUniqueRunDependency(id) {
        return id;
      }
      __name(getUniqueRunDependency, "getUniqueRunDependency");
      function addRunDependency(id) {
        var _a2;
        runDependencies++;
        (_a2 = Module["monitorRunDependencies"]) == null ? void 0 : _a2.call(Module, runDependencies);
      }
      __name(addRunDependency, "addRunDependency");
      function removeRunDependency(id) {
        var _a2;
        runDependencies--;
        (_a2 = Module["monitorRunDependencies"]) == null ? void 0 : _a2.call(Module, runDependencies);
        if (runDependencies == 0) {
          if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
          }
        }
      }
      __name(removeRunDependency, "removeRunDependency");
      function abort(what) {
        var _a2;
        (_a2 = Module["onAbort"]) == null ? void 0 : _a2.call(Module, what);
        what = "Aborted(" + what + ")";
        err(what);
        ABORT = true;
        what += ". Build with -sASSERTIONS for more info.";
        var e = new WebAssembly.RuntimeError(what);
        readyPromiseReject(e);
        throw e;
      }
      __name(abort, "abort");
      var wasmBinaryFile;
      function findWasmBinary() {
        if (Module["locateFile"]) {
          return locateFile("tree-sitter.wasm");
        }
        return new URL("data:application/wasm;base64,AGFzbQEAAAAAEAhkeWxpbmsuMAEFjFsEHgABvwEaYAF/AX9gAn9/AX9gAX8AYAN/f38AYAN/f38Bf2ACf38AYAR/f39/AX9gBX9/f39/AGAAAGAEf39/fwBgBX9/f39/AX9gAAF/YAh/f39/f39/fwF/YAd/f39/f39/AGALf39/f39/f39/f38AYAZ/fH9/f38Bf2ADf35/AX9gBH9+f38Bf2ABfwF+YAJ/fgBgBn9/f39/fwBgBH9/f38BfmADf35/AX5gAnx/AXxgB39/f39/f38Bf2ACfn8BfwLUAxADZW52GHRyZWVfc2l0dGVyX2xvZ19jYWxsYmFjawAFA2Vudhp0cmVlX3NpdHRlcl9wYXJzZV9jYWxsYmFjawAHA2Vudh10cmVlX3NpdHRlcl9wcm9ncmVzc19jYWxsYmFjawABA2VudiN0cmVlX3NpdHRlcl9xdWVyeV9wcm9ncmVzc19jYWxsYmFjawAAFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfY2xvc2UAABZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX3dyaXRlAAYDZW52CV9hYm9ydF9qcwAIFndhc2lfc25hcHNob3RfcHJldmlldzEOY2xvY2tfdGltZV9nZXQAEBZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxB2ZkX3NlZWsAEQNlbnYWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAAAA2Vudg9fX3N0YWNrX3BvaW50ZXIDfwEDZW52DV9fbWVtb3J5X2Jhc2UDfwADZW52DF9fdGFibGVfYmFzZQN/AAdHT1QubWVtC19faGVhcF9iYXNlA38BA2VudgZtZW1vcnkCAYAEgIACA2VudhlfX2luZGlyZWN0X2Z1bmN0aW9uX3RhYmxlAXAAHgOXApUCCAgIAAEBBwECAAAAAAAABAEGAQEEAQIBBAAAAwAAAAIFBQIABQAMAAADCQMDAwEJBw0FAgICAQMSEwQHAwUDBAEUCQMGAgEDDAMHCgACCgkCAgIFAQQAAAAEBAQEAQEBAQEDBQsDBQMBAQUJCgAEAQQBAQEBBQUHBQAAFQAEAAUAAAIEBAQEBAMECwgFAwoGAAIBAQIFAgICAgUCAgICBQAAAAAAAAUAAAAAAAACAgAAAAAAAgABAQUCAgAAAAUFBQICAgIAAgICAgICAgIAAAACAg0AAAAAAAAAAA4ADgAWBAgCBAAFBQQEBQAAAAQGAAQEFxgDAAkZBw8FBgQBAAIBBQEABQABAAACAAsAAAQABAQAAQY5CH8BQbjTAAt/AUGw0wALfwFBvNMAC38BQbTTAAt/AUHw1AALfwFBgNUAC38BQYTbAAt/AUGI2wALB6EhmQERX193YXNtX2NhbGxfY3RvcnMACgZtYWxsb2MAiQIGY2FsbG9jAI0CB3JlYWxsb2MAiwIEZnJlZQCKAgZtZW1jbXAA+AEYdHNfbGFuZ3VhZ2Vfc3ltYm9sX2NvdW50ABMXdHNfbGFuZ3VhZ2Vfc3RhdGVfY291bnQAFBN0c19sYW5ndWFnZV92ZXJzaW9uABUXdHNfbGFuZ3VhZ2VfYWJpX3ZlcnNpb24AFRR0c19sYW5ndWFnZV9tZXRhZGF0YQAWEHRzX2xhbmd1YWdlX25hbWUAFxd0c19sYW5ndWFnZV9maWVsZF9jb3VudAAYFnRzX2xhbmd1YWdlX25leHRfc3RhdGUAGRd0c19sYW5ndWFnZV9zeW1ib2xfbmFtZQAaG3RzX2xhbmd1YWdlX3N5bWJvbF9mb3JfbmFtZQAbB3N0cm5jbXAA+wEXdHNfbGFuZ3VhZ2Vfc3ltYm9sX3R5cGUAHB10c19sYW5ndWFnZV9maWVsZF9uYW1lX2Zvcl9pZAAdGXRzX2xvb2thaGVhZF9pdGVyYXRvcl9uZXcAHxx0c19sb29rYWhlYWRfaXRlcmF0b3JfZGVsZXRlACAhdHNfbG9va2FoZWFkX2l0ZXJhdG9yX3Jlc2V0X3N0YXRlACEbdHNfbG9va2FoZWFkX2l0ZXJhdG9yX3Jlc2V0ACIadHNfbG9va2FoZWFkX2l0ZXJhdG9yX25leHQAIyR0c19sb29rYWhlYWRfaXRlcmF0b3JfY3VycmVudF9zeW1ib2wAJBB0c19wYXJzZXJfZGVsZXRlAD4PdHNfcGFyc2VyX3Jlc2V0AD8WdHNfcGFyc2VyX3NldF9sYW5ndWFnZQBAGHRzX3BhcnNlcl90aW1lb3V0X21pY3JvcwBCHHRzX3BhcnNlcl9zZXRfdGltZW91dF9taWNyb3MAQx10c19wYXJzZXJfc2V0X2luY2x1ZGVkX3JhbmdlcwBEDHRzX3F1ZXJ5X25ldwBVD3RzX3F1ZXJ5X2RlbGV0ZQBaCGlzd3NwYWNlAPcBCGlzd2FsbnVtAPUBFnRzX3F1ZXJ5X3BhdHRlcm5fY291bnQAYBZ0c19xdWVyeV9jYXB0dXJlX2NvdW50AGEVdHNfcXVlcnlfc3RyaW5nX2NvdW50AGIcdHNfcXVlcnlfY2FwdHVyZV9uYW1lX2Zvcl9pZABjInRzX3F1ZXJ5X2NhcHR1cmVfcXVhbnRpZmllcl9mb3JfaWQAZBx0c19xdWVyeV9zdHJpbmdfdmFsdWVfZm9yX2lkAGUfdHNfcXVlcnlfcHJlZGljYXRlc19mb3JfcGF0dGVybgBmH3RzX3F1ZXJ5X3N0YXJ0X2J5dGVfZm9yX3BhdHRlcm4AZx10c19xdWVyeV9lbmRfYnl0ZV9mb3JfcGF0dGVybgBoGnRzX3F1ZXJ5X2lzX3BhdHRlcm5fcm9vdGVkAGkddHNfcXVlcnlfaXNfcGF0dGVybl9ub25fbG9jYWwAaiZ0c19xdWVyeV9pc19wYXR0ZXJuX2d1YXJhbnRlZWRfYXRfc3RlcABrGHRzX3F1ZXJ5X2Rpc2FibGVfY2FwdHVyZQBsGHRzX3F1ZXJ5X2Rpc2FibGVfcGF0dGVybgBtDHRzX3RyZWVfY29weQCLAQ50c190cmVlX2RlbGV0ZQCMAQd0c19pbml0AJQBEnRzX3BhcnNlcl9uZXdfd2FzbQCVARx0c19wYXJzZXJfZW5hYmxlX2xvZ2dlcl93YXNtAJYBFHRzX3BhcnNlcl9wYXJzZV93YXNtAJgBHnRzX3BhcnNlcl9pbmNsdWRlZF9yYW5nZXNfd2FzbQCbAR50c19sYW5ndWFnZV90eXBlX2lzX25hbWVkX3dhc20AnAEgdHNfbGFuZ3VhZ2VfdHlwZV9pc192aXNpYmxlX3dhc20AnQEbdHNfbGFuZ3VhZ2Vfc3VwZXJ0eXBlc193YXNtAJ4BGXRzX2xhbmd1YWdlX3N1YnR5cGVzX3dhc20AnwEWdHNfdHJlZV9yb290X25vZGVfd2FzbQCgASJ0c190cmVlX3Jvb3Rfbm9kZV93aXRoX29mZnNldF93YXNtAKEBEXRzX3RyZWVfZWRpdF93YXNtAKIBHHRzX3RyZWVfaW5jbHVkZWRfcmFuZ2VzX3dhc20AowEfdHNfdHJlZV9nZXRfY2hhbmdlZF9yYW5nZXNfd2FzbQCkARd0c190cmVlX2N1cnNvcl9uZXdfd2FzbQClARh0c190cmVlX2N1cnNvcl9jb3B5X3dhc20ApgEadHNfdHJlZV9jdXJzb3JfZGVsZXRlX3dhc20ApwEZdHNfdHJlZV9jdXJzb3JfcmVzZXRfd2FzbQCoARx0c190cmVlX2N1cnNvcl9yZXNldF90b193YXNtAKkBJHRzX3RyZWVfY3Vyc29yX2dvdG9fZmlyc3RfY2hpbGRfd2FzbQCqASN0c190cmVlX2N1cnNvcl9nb3RvX2xhc3RfY2hpbGRfd2FzbQCrAS50c190cmVlX2N1cnNvcl9nb3RvX2ZpcnN0X2NoaWxkX2Zvcl9pbmRleF93YXNtAKwBMXRzX3RyZWVfY3Vyc29yX2dvdG9fZmlyc3RfY2hpbGRfZm9yX3Bvc2l0aW9uX3dhc20ArQEldHNfdHJlZV9jdXJzb3JfZ290b19uZXh0X3NpYmxpbmdfd2FzbQCuASl0c190cmVlX2N1cnNvcl9nb3RvX3ByZXZpb3VzX3NpYmxpbmdfd2FzbQCvASN0c190cmVlX2N1cnNvcl9nb3RvX2Rlc2NlbmRhbnRfd2FzbQCwAR90c190cmVlX2N1cnNvcl9nb3RvX3BhcmVudF93YXNtALEBKHRzX3RyZWVfY3Vyc29yX2N1cnJlbnRfbm9kZV90eXBlX2lkX3dhc20AsgEpdHNfdHJlZV9jdXJzb3JfY3VycmVudF9ub2RlX3N0YXRlX2lkX3dhc20AswEpdHNfdHJlZV9jdXJzb3JfY3VycmVudF9ub2RlX2lzX25hbWVkX3dhc20AtAErdHNfdHJlZV9jdXJzb3JfY3VycmVudF9ub2RlX2lzX21pc3Npbmdfd2FzbQC1ASN0c190cmVlX2N1cnNvcl9jdXJyZW50X25vZGVfaWRfd2FzbQC2ASJ0c190cmVlX2N1cnNvcl9zdGFydF9wb3NpdGlvbl93YXNtALcBIHRzX3RyZWVfY3Vyc29yX2VuZF9wb3NpdGlvbl93YXNtALgBH3RzX3RyZWVfY3Vyc29yX3N0YXJ0X2luZGV4X3dhc20AuQEddHNfdHJlZV9jdXJzb3JfZW5kX2luZGV4X3dhc20AugEkdHNfdHJlZV9jdXJzb3JfY3VycmVudF9maWVsZF9pZF93YXNtALsBIXRzX3RyZWVfY3Vyc29yX2N1cnJlbnRfZGVwdGhfd2FzbQC8ASx0c190cmVlX2N1cnNvcl9jdXJyZW50X2Rlc2NlbmRhbnRfaW5kZXhfd2FzbQC9ASB0c190cmVlX2N1cnNvcl9jdXJyZW50X25vZGVfd2FzbQC+ARN0c19ub2RlX3N5bWJvbF93YXNtAL8BIXRzX25vZGVfZmllbGRfbmFtZV9mb3JfY2hpbGRfd2FzbQDAASd0c19ub2RlX2ZpZWxkX25hbWVfZm9yX25hbWVkX2NoaWxkX3dhc20AwQEhdHNfbm9kZV9jaGlsZHJlbl9ieV9maWVsZF9pZF93YXNtAMIBIXRzX25vZGVfZmlyc3RfY2hpbGRfZm9yX2J5dGVfd2FzbQDDASd0c19ub2RlX2ZpcnN0X25hbWVkX2NoaWxkX2Zvcl9ieXRlX3dhc20AxAEbdHNfbm9kZV9ncmFtbWFyX3N5bWJvbF93YXNtAMUBGHRzX25vZGVfY2hpbGRfY291bnRfd2FzbQDGAR50c19ub2RlX25hbWVkX2NoaWxkX2NvdW50X3dhc20AxwESdHNfbm9kZV9jaGlsZF93YXNtAMgBGHRzX25vZGVfbmFtZWRfY2hpbGRfd2FzbQDJAR50c19ub2RlX2NoaWxkX2J5X2ZpZWxkX2lkX3dhc20AygEZdHNfbm9kZV9uZXh0X3NpYmxpbmdfd2FzbQDLARl0c19ub2RlX3ByZXZfc2libGluZ193YXNtAMwBH3RzX25vZGVfbmV4dF9uYW1lZF9zaWJsaW5nX3dhc20AzQEfdHNfbm9kZV9wcmV2X25hbWVkX3NpYmxpbmdfd2FzbQDOAR10c19ub2RlX2Rlc2NlbmRhbnRfY291bnRfd2FzbQDPARN0c19ub2RlX3BhcmVudF93YXNtANABInRzX25vZGVfY2hpbGRfd2l0aF9kZXNjZW5kYW50X3dhc20A0QEhdHNfbm9kZV9kZXNjZW5kYW50X2Zvcl9pbmRleF93YXNtANIBJ3RzX25vZGVfbmFtZWRfZGVzY2VuZGFudF9mb3JfaW5kZXhfd2FzbQDTASR0c19ub2RlX2Rlc2NlbmRhbnRfZm9yX3Bvc2l0aW9uX3dhc20A1AEqdHNfbm9kZV9uYW1lZF9kZXNjZW5kYW50X2Zvcl9wb3NpdGlvbl93YXNtANUBGHRzX25vZGVfc3RhcnRfcG9pbnRfd2FzbQDWARZ0c19ub2RlX2VuZF9wb2ludF93YXNtANcBGHRzX25vZGVfc3RhcnRfaW5kZXhfd2FzbQDYARZ0c19ub2RlX2VuZF9pbmRleF93YXNtANkBFnRzX25vZGVfdG9fc3RyaW5nX3dhc20A2gEVdHNfbm9kZV9jaGlsZHJlbl93YXNtANsBG3RzX25vZGVfbmFtZWRfY2hpbGRyZW5fd2FzbQDcASB0c19ub2RlX2Rlc2NlbmRhbnRzX29mX3R5cGVfd2FzbQDdARV0c19ub2RlX2lzX25hbWVkX3dhc20A3gEYdHNfbm9kZV9oYXNfY2hhbmdlc193YXNtAN8BFnRzX25vZGVfaGFzX2Vycm9yX3dhc20A4AEVdHNfbm9kZV9pc19lcnJvcl93YXNtAOEBF3RzX25vZGVfaXNfbWlzc2luZ193YXNtAOIBFXRzX25vZGVfaXNfZXh0cmFfd2FzbQDjARh0c19ub2RlX3BhcnNlX3N0YXRlX3dhc20A5AEddHNfbm9kZV9uZXh0X3BhcnNlX3N0YXRlX3dhc20A5QEVdHNfcXVlcnlfbWF0Y2hlc193YXNtAOYBFnRzX3F1ZXJ5X2NhcHR1cmVzX3dhc20A6AEGbWVtc2V0AO4BBm1lbWNweQDyAQdtZW1tb3ZlAJsCCGlzd2FscGhhAPYBCGlzd2JsYW5rAJgCCGlzd2RpZ2l0AJMCCGlzd2xvd2VyAJcCCGlzd3VwcGVyAJoCCWlzd3hkaWdpdACdAgZtZW1jaHIA/AEGc3RybGVuAPoBBnN0cmNtcACeAgdzdHJuY2F0AJkCB3N0cm5jcHkAnAIIdG93bG93ZXIAkAIIdG93dXBwZXIAkgIIc2V0VGhyZXcAjwIZX2Vtc2NyaXB0ZW5fc3RhY2tfcmVzdG9yZQCUAhdfZW1zY3JpcHRlbl9zdGFja19hbGxvYwCVAhxlbXNjcmlwdGVuX3N0YWNrX2dldF9jdXJyZW50AJYCGF9fd2FzbV9hcHBseV9kYXRhX3JlbG9jcwALCAEMCTMBACMCCx4lJicoKSpKe318fniHAQ0OD4oCjQGOAY8BlwGZAZoB5wHpAesB6gGEAoUChwIMAQEKj4sLlQIgAQJ/IwEiAEGE1gBqIgEgAEHs1QBqNgJgIAFBKjYCGAvkAQAjAUGw0wBq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BigCABECACABQQA2AiAgAUIANwIYCyABKAIwIAFBJGoiCCABKAI0EEEgASgCBCIDBEADQCABKAIAIAVBBXRqIgIoAgAEQCABKAI0IQcgAigCDARAIAYgAikCDDcDCCAHIAZBCGoQPAsgAigCFARAIAYgAikCFDcDACAHIAYQPAsgAigCBCIDBEAgAygCACIKBH8gCiMGKAIAEQIAIANBADYCCCADQgA3AgAgAigCBAUgAwsjBigCABECAAsgAigCACAIIAcQQSABKAIEIQMLIAVBAWoiBSADSQ0ACwtBACEDIAFBADYCBAJAIAEoAiQiBUUNACABKAIoBEADQCABKAIkIANBAnRqKAIAIwYoAgARAgAgA0EBaiIDIAEoAihJDQALIAgoAgAiBUUNAQsgBSMGKAIAEQIAIAFBADYCLCABQgA3AiQLIAEoAgAiAgRAIAIjBigCABECACABQQA2AgggAUIANwIACyABIwYoAgARAgAgBkEQaiQAIAAoAqgJIgEEQCABIwYoAgARAgAgAEEANgKwCSAAQgA3AqgJCyAAKAK8CiIBBEAgASMGKAIAEQIAIABBADYCxAogAEIANwK8CgsgACgCtAoEQCAEIABBtApqKQIANwMYIABBiAlqIARBGGoQPCAAQgA3ArQKCyAAKAJEIwYoAgARAgAgAEHgCWohASAAKALgCQRAIAQgASkCADcDECAAQYgJaiAEQRBqEDwLIAAoAugJBEAgBCAAQegJaikCADcDCCAAQYgJaiAEQQhqEDwLIAFCADcCACABQQA2AhAgAUIANwIIAkAgACgCiAkiAUUNACAAKAKMCQRAA0AgACgCiAkgCUEDdGooAgAjBigCABECACAJQQFqIgkgACgCjAlJDQALIAAoAogJIgFFDQELIAEjBigCABECACAAQQA2ApAJIABCADcCiAkLIAAoApQJIgEEQCABIwYoAgARAgAgAEEANgKcCSAAQgA3ApQJCyAAKAL0CSIBBEAgASMGKAIAEQIAIABBADYC/AkgAEIANwL0CQsgACgCvAkiAQRAIAEjBigCABECACAAQQA2AsQJIABCADcCvAkLIAAoAsgJIgEEQCABIwYoAgARAgAgAEEANgLQCSAAQgA3AsgJCyAAKALUCSIBBEAgASMGKAIAEQIAIABBADYC3AkgAEIANwLUCQsgACMGKAIA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BykDCDcCAAsgJkEBaiImQYACRw0ACyADQQE6AEgLIAdB0ABqJAALpQQBBH8gAARAIAAoAjwiAQRAIAEjBigCABECACAAQQA2AkQgAEIANwI8CyAAKAJIIgEEQCABIwYoAgARAgAgAEEANgJQIABCADcCSAsgACgCVCIBBEAgASMGKAIAEQIAIABBADYCXCAAQgA3AlQLIAAoAmAiAQRAIAEjBigCABECACAAQQA2AmggAEIANwJgCyAAKAJsIgEEQCABIwYoAgARAgAgAEEANgJ0IABCADcCbAsgACgChAEiAQRAIAEjBigCABECACAAQQA2AowBIABCADcChAELIAAoAngiAQRAIAEjBigCABECACAAQQA2AoABIABCADcCeAsgACgCkAEiAQRAIAEjBigCABECACAAQQA2ApgBIABCADcCkAELIAAoAgAiAQRAIAEjBigCABECACAAQQA2AgggAEIANwIACyAAKAIMIgEEQCABIwYoAgARAgAgAEEANgIUIABCADcCDAsgACgCGCIBBEAgASMGKAIAEQIAIABBADYCICAAQgA3AhgLIAAoAiQiAQRAIAEjBigCABECACAAQQA2AiwgAEIANwIkCyAAKAI0IgIEQEEAIQEDQCAAKAIwIAFBDGxqIgMoAgAiBARAIAQjBigCABECACADQQA2AgggA0IANwIAIAAoAjQhAgsgAUEBaiIBIAJJDQALCyAAKAIwIgEEQCABIwYoAgARAgAgAEEANgI4IABCADcCMAsgACMGKAIAEQIACwtuAQN/IAAoAgRBAWoiASAAKAIIIgJLBEBBCCACQQF0IgIgASABIAJJGyIBIAFBCE0bIgJBFGwhAQJ/IAAoAgAiAwRAIAMgASMEKAIAEQEADAELIAEjBSgCABEAAAshASAAIAI2AgggACABNgIACwvLAwEGfwNAIAAgACgCACAALQAQaiIENgIAAkACQCAAKAIIIgUgBEsEQCAAIAQsAAAiAUH/AXEiAjYCDEEBIQMgAUEASARAAkAgBSAEayIFQQFGDQACQCABQWBPBEACQCABQW9NBEAgACACQQ9xIgI2AgwjAUHeCmogAmotAAAgBC0AASIBQQV2dkEBcUUNBCABQT9xIQZBAiEBDAELIAAgAkHwAWsiAjYCDCABQXRLDQMjAUGwDGogBC0AASIBQQR2aiwAACACdkEBcUUNAyAAIAFBP3EgAkEGdHIiAjYCDEECIQMgBUECRg0DQQMhASAELQACQYB/cyIGQf8BcUE/Sw0DCyAAIAZB/wFxIAJBBnRyIgI2AgwgBSIDIAFHDQEMAgsgAUFCSQ0BIAAgAkEfcSICNgIMQQEhAQsgASAEai0AAEGAf3NB/wFxIgNBP00NAyABIQMLIABBfzYCDEF/IQILIAAgAzoAEAwCC0EAIQIgAEEANgIMIABBADoAEAwBCyAAIAJBBnQgA3IiAjYCDCAAIAFBAWo6ABALIAIQ9QENACAAKAIMIgNBIWsiAUEeTUEAQQEgAXRBgeCAgARxGw0AIANB3wBGDQALC/oCAQR/IAAoAgQiAyABKAIEIgJJBEAgACgCACEEIAAoAggiBSACSQR/QQggBUEBdCIDIAIgAiADSRsiAiACQQhNGyECAn8gBARAIAQgAiMEKAIAEQEADAELIAIjBSgCABEAAAshBCAAIAI2AgggACAENgIAIAAoAgQhAyABKAIEBSACCyADayICBEAgAyAEakEAIAL8CwALIAAgASgCBCICNgIECyACQf//A3EEQEEAIQNBACEEA0AgASgCACADai0AACECAkACQAJAAkACQAJAIAAoAgAgA2oiAy0AAA4FBQECAwAEC0EEIQIMBAsgAkH/AXFBBU8NAkKBhIigwAAgAkEDdK1C+AGDiKchAgwDCyACQf8BcUEFTw0BQoKEiKDAACACQQN0rUL4AYOIpyECDAILIAJB/wFxQQVPDQBCg4iQoMAAIAJBA3StQvgBg4inIQIMAQtBACECCyADIAI6AAAgBEEBaiIEQf//A3EiAyABLwEESQ0ACwsL2goBCH9BASEDIAEoAgxBIkYEQCABKAIAIQggARBWGiABKAIAIQIgAEEANgKIAQJ/A0ACQCABKAIMIQMCfwJAAkAgBEEBcQRAIAAoAogBIQQCQAJAAkACQAJAIANB7gBrDgcABAQEAQQCAwsgACgChAEhAyAAIARBAWoiAiAAKAKMASIFSwR/QQggBUEBdCIEIAIgAiAESRsiAiACQQhNGyECAn8gAwRAIAMgAiMEKAIAEQEADAELIAIjBSgCABEAAAshAyAAIAI2AowBIAAgAzYChAEgACgCiAEiBEEBagUgAgs2AogBIAMgBGpBCjoAAAwGCyAAKAKEASEDIAAgBEEBaiICIAAoAowBIgVLBH9BCCAFQQF0IgQgAiACIARJGyICIAJBCE0bIQICfyADBEAgAyACIwQoAgARAQAMAQsgAiMFKAIAEQAACyEDIAAgAjYCjAEgACADNgKEASAAKAKIASIEQQFqBSACCzYCiAEgAyAEakENOgAADAULIAAoAoQBIQMgACAEQQFqIgIgACgCjAEiBUsEf0EIIAVBAXQiBCACIAIgBEkbIgIgAkEITRshAgJ/IAMEQCADIAIjBCgCABEBAAwBCyACIwUoAgARAAALIQMgACACNgKMASAAIAM2AoQBIAAoAogBIgRBAWoFIAILNgKIASADIARqQQk6AAAMBAsgA0EwRg0CCyAAKAKEASECIAEoAgAhBgJAIAQgAS0AECIDaiIFIAAoAowBTQ0AAn8gAgRAIAIgBSMEKAIAEQEADAELIAUjBSgCABEAAAshAiAAIAU2AowBIAAgAjYChAEgACgCiAEiBSAETQ0AIAUgBGsiBUUNACACIARqIgcgA2ogByAF/AoAAAsCQCADRSIFDQAgAiAEaiECIAYEQCAFDQEgAiAGIAP8CgAADAELIANFDQAgAkEAIAP8CwALIAAgACgCiAEgA2o2AogBDAILAkACQAJ/AkAgA0HcAEcEQCADQQpGDQRBACADQSJHDQcaIAAoAoQBIQMgASgCACIIIAJrIgQgACgCiAEiBWoiBiAAKAKMAU0NAyADRQ0BIAMgBiMEKAIAEQEADAILIAAoAoQBIQMCQCABKAIAIgcgAmsiBCAAKAKIASIFaiIGIAAoAowBTQ0AAn8gAwRAIAMgBiMEKAIAEQEADAELIAYjBSgCABEAAAshAyAAIAY2AowBIAAgAzYChAEgACgCiAEiBiAFTQ0AIAYgBWsiBkUNACADIAVqIgkgBGogCSAG/AoAAAsCQCACIAdGDQAgAyAFaiEDIAIEQCAERQ0BIAMgAiAE/AoAAAwBCyAERQ0AIANBACAE/AsACyAAIAAoAogBIARqNgKIASABKAIAQQFqIQJBAQwGCyAGIwUoAgARAAALIQMgACAGNgKMASAAIAM2AoQBIAAoAogBIgYgBU0NACAGIAVrIgZFDQAgAyAFaiIHIARqIAcgBvwKAAALAkAgAiAIRg0AIAMgBWohAyACBEAgBEUNASADIAIgBPwKAAAMAQsgBEUNACADQQAgBPwLAAsgACAAKAKIASAEajYCiAFBAAwGCwwDCyAAKAKEASEDIAAgBEEBaiICIAAoAowBIgVLBH9BCCAFQQF0IgQgAiACIARJGyICIAJBCE0bIQICfyADBEAgAyACIwQoAgARAQAMAQsgAiMFKAIAEQAACyEDIAAgAjYCjAEgACADNgKEASAAKAKIASIEQQFqBSACCzYCiAEgAyAEakEAOgAACyABKAIAIAEtABBqIQJBAAshBCABEFYNAQsLIAFBADoAECABIAg2AgBBAQshAyABEFYaCyADC84DAQV/AkACQCAAKAIQIgRFDQAgACgCDCEGA0ACQCACIAYgA0EDdGoiBSgCBEYEQCAAKAIAIAUoAgBqIAEgAhD7AUUNAQsgA0EBaiIDIARHDQEMAgsLIANBAE4NAQsgACgCACEDIAAoAgQhBiACQQFqIgUEQCAFIAZqIgQgACgCCCIHTQR/IAYFQQggB0EBdCIHIAQgBCAHSRsiBCAEQQhNGyEEAn8gAwRAIAMgBCMEKAIAEQEADAELIAQjBSgCABEAAAshAyAAIAQ2AgggACADNgIAIAAoAgQLIQQgBQRAIAMgBGpBACAF/AsACyAAIAAoAgQgBWo2AgQgACgCACEDCyACBEAgAyAGaiABIAL8CgAACyAAKAIAIAAoAgRqQQFrQQA6AAAgACgCDCEDIAAgACgCECIEQQFqIgEgACgCFCIFSwR/QQggBUEBdCIEIAEgASAESRsiASABQQhNGyIEQQN0IQECfyADBEAgAyABIwQoAgARAQAMAQsgASMFKAIAEQAACyEDIAAgBDYCFCAAIAM2AgwgACgCECIEQQFqBSABCzYCECADIARBA3RqIgEgAjYCBCABIAY2AgAgAC8BEEEBayEDCyADQf//A3ELBwAgACgCZAsHACAAKAIQCwcAIAAoAigLMQEBfyAAKAIMIAFB//8DcUEDdGoiASgCACEDIAAoAgAhACACIAEoAgQ2AgAgACADagsvAQF/IAJB//8DcSICIAAoAjAgAUEMbGoiACgCBEkEfyAAKAIAIAJqLQAABUEACwsxAQF/IAAoAiQgAUH//wNxQQN0aiIBKAIAIQMgACgCGCEAIAIgASgCBDYCACAAIANqCzYBAX8gACgCYCABQRxsaiIBKAIIIQMgAiABKAIMIgE2AgAgAUUEQEEADwsgACgCVCADQQN0agsQACAAKAJgIAFBHGxqKAIQCxAAIAAoAmAgAUEcbGooAhQLUAEDfyAAKAJMIgJFBEBBAQ8LIAAoAkghA0EAIQADQAJAIAEgAyAAQQZsaiIELwECRw0AIAQtAARBAUYNAEEADwsgAEEBaiIAIAJHDQALQQELIwEBfyAAKAJkIAFLBH8gACgCYCABQRxsai0AGAVBAAtBAXELeAEEfyAAKAJwIgRFBEBBAA8LQX8hAiABIAAoAmwiAygCAE8EQEEAIQIDQCAEIAIiBUEBaiICRwRAIAMgAkEDdGooAgAgAU0NAQsLIAMgBUEDdGovAQQhAgsgACgCQCACTQRAQQAPCyAAKAI8IAJBFGxqLQASQQd2C7MCAQZ/AkAgACgCECIERQ0AIAAoAgwhBQNAAkAgAiAFIANBA3RqIgYoAgRGBEAgACgCACAGKAIAaiABIAIQ+wFFDQELIANBAWoiAyAERw0BDAILCyADQX9GDQAgACgCQCIFRQ0AIAAoAjwhBkEAIQIgA0H//wNxIQEDQEEAIQMgBiACQRRsaiIAQQZqIgchBAJAAkAgAC8BBiIIIAFGDQAgASAALwEIRgRAIABBCGohBEEBIQMMAQsgAC8BCiABRw0BIABB//8DOwEKDAELIARB//8DOwEAIANBAXQgB2oiA0ECai8BACIEQf//A0YNACADIAQ7AQAgA0H//wM7AQIgASAIRw0AIAAvAQoiA0H//wNGDQAgAEH//wM7AQogACADOwEICyACQQFqIgIgBUcNAAsLC2YBA38gACgCTCIDBEADQCAAKAJIIAJBBmxqIgQvAQIgAUYEQCADIAJBf3NqQQZsIgMEQCAEIARBBmogA/wKAAALIAAgACgCTEEBayIDNgJMIAJBAWshAgsgAkEBaiICIANJDQALCwvfAQECf0GoASMFIgEoAgARAAAiAEEAQcgA/AsAIABCADcDcCAAQn83A2ggAEIANwNgIABCgICAgHA3A1ggAEKAgICAcDcDUCAAQv////8PNwNIIABCADcDeCAAQgA3A4ABIABCADcDiAEgAEIANwOQASAAQgA3A5gBIABCADcDoAFBgAEgASgCABEAACEBIABBCDYCICAAIAE2AhggACgCLEEHTQRAAn8gACgCJCIBBEAgAUGAASMEKAIAEQEADAELQYABIwUoAgARAAALIQEgAEEINgIsIAAgATYCJAsgAAu1BQIGfwJ+IwBBEGsiBSQAIABBADYCKCAAQQA2AhwgAigCECEGIAIoAgghByACKAIEIQQgAigCACEIIAIoAhQhAyAAIAIoAgw7ARQgACADNgIEIABBADYCDCAAKAIIIQIgACAAKAIQBH9BAAUCfyACBEAgAkHgASMEKAIAEQEADAELQeABIwUoAgARAAALIQIgAEEINgIQIAAgAjYCCCAAKAIMCyIDQQFqNgIMIAIgA0EcbGoiAkEANgIYIAJCADcCECACIAc2AgwgAiAENgIIIAIgCDYCBCACIAY2AgACQCAAKAI0IgZB//8DcSIERQ0AIAAoAjAhA0EAIQdBACECIARBCE8EQCAGQfj/A3EhCEEAIQQDQCADIAJBDGxqQX82AgQgAyACQQFyQQxsakF/NgIEIAMgAkECckEMbGpBfzYCBCADIAJBA3JBDGxqQX82AgQgAyACQQRyQQxsakF/NgIEIAMgAkEFckEMbGpBfzYCBCADIAJBBnJBDGxqQX82AgQgAyACQQdyQQxsakF/NgIEIAJBCGohAiAEQQhqIgQgCEcNAAsLIAZBB3EiBEUNAANAIAMgAkEMbGpBfzYCBCACQQFqIQIgB0EBaiIHIARHDQALCyAAQQE6AKABIAAgBjYCTCAAQQA2AnAgAEEAOwChASAAQQA2AlAgAEEAOgCjASAAIAE2AgAgAEEANgKcAQJAIAApA4gBQgBSBEAgBRDtASAFKQMAIQogBSgCCCEBIAAgBSgCDDYChAEgACABIAApA4gBIgkgCULAhD2AIglCwIQ9fn2nQegHbGoiAUGAlOvcA2sgASABQf+T69wDSiIBGzYCgAEgACABrSAJIAp8fDcDeAwBCyAAQfgAaiIBQgA3AwAgAUIANwMICyAAQQA2ApgBIABCADcDkAEgBUEQaiQAC8QBAQV/IAEoAhAhAyABKAIIIQQgASgCBCEFIAEoAgAhBiABKAIUIQIgACABKAIMOwEQIAAgAjYCACAAQQA2AgggACgCBCEBIAAgACgCDAR/QQAFAn8gAQRAIAFB4AEjBCgCABEBAAwBC0HgASMFKAIAEQAACyEBIABBCDYCDCAAIAE2AgQgACgCCAsiAkEBajYCCCABIAJBHGxqIgBBADYCGCAAQgA3AhAgACAENgIMIAAgBTYCCCAAIAY2AgQgACADNgIAC1cBA38CQAJAIAIoAgAiAyACKAIEIgRyRQRAIAJCfzcCAAwBCyABKAIAIgUgA0sNASADIAVHDQAgASgCBCAESw0BCyAAIAEpAgA3A2AgACACKQIANwNoCwvfAQEDfwJ/IAAoAihFBEBBACAAQQAQc0UNARoLIAAoAiQiAygCACICQX9GBEAgACAAKAJwIgJBAWo2AnAgAyACNgIACyABIAI2AgAgASADLwEMOwEEAkAgAy8BBCICIAAoAjRPBEAgACgCQCECIAAoAjwhBAwBCyAAKAIwIAJBDGxqIgQoAgQhAiAEQX82AgQgBCgCACEEIAAgACgCTEEBajYCTAsgASACOwEGIAEgBDYCCCAAKAIoQQR0QRBrIgEEQCADIANBEGogAfwKAAALIAAgACgCKEEBazYCKEEBCwvdRAIefwJ+IwBB0AFrIgckACAAQTxqIRwgAEEEaiEVIABBlAFqIR0DQAJAIAAtAKIBIgZBAUcNACAAKAIcIgRFDQAgACgCNCEDIAAoAhghBQJAIAQiAkEBcUUNACAAIAJBAWsiAjYCHCADIAUgAkEEdGovAQQiCU0NACAAKAIwIAlBDGxqQX82AgQgACAAKAJMQQFqNgJMCyAEQQFGDQADQCAAIAJBAWsiBDYCHCAFIARBBHRqLwEEIgQgA0kEQCAAKAIwIARBDGxqQX82AgQgACAAKAJMQQFqNgJMCyAAIAJBAmsiAjYCHCAFIAJBBHRqLwEEIgQgA0kEQCAAKAIwIARBDGxqQX82AgQgACAAKAJMQQFqNgJMCyACDQALCyAAIAAoApwBQQFqIgJBACACQeQARxsiBDYCnAECQCAAKAKQASICRQ0AIAIoAgRFDQAgACAAKAIIIAAoAgxBHGxqQRhrKAAANgKYAQsCQAJAIAYgDnJBAXENACAEDQECQCAAKQN4UARAIAAoAoABRQ0BCyAHQbgBahDtAUEAIQ4gBykDuAEiICAAKQN4IiFVDQEgICAhWQRAIAcoAsABIAAoAoABSg0CCyAAKAKQASECCyACRQ0BIAIoAgQiAkUNASAdIAIRAABFDQFBACEOCyAHQdABaiQAIA5BAXEPCwJAIAACfwJAIAAtAKEBQQFGBEBBACEOIAAtAKABQQFHDQNBACEIQQAhAkEAIAAoAhwiCUUNAhoDQAJAAkAgACgCACgCPCAAKAIYIgQgAkEEdGoiAy8BCkEUbGovAQwiBUH//wNGBEAgACgCUCIFIAMvAQhPQQAgBRsNASAAKAIkIQQgACAAKAIoIgZBAWoiBSAAKAIsIhRLBH9BCCAUQQF0IgYgBSAFIAZJGyIFIAVBCE0bIgZBBHQhBQJ/IAQEQCAEIAUjBCgCABEBAAwBCyAFIwUoAgARAAALIQQgACAGNgIsIAAgBDYCJCAAKAIoIgZBAWoFIAULNgIoIAQgBkEEdGoiBCADKQIANwIAIAQgAykCCDcCCEEBIQ4gCEEBaiEIDAILIAAoAlAgAy8BCCAFak8NACADLwEEIgQgACgCNEkEQCAAKAIwIARBDGxqQX82AgQgACAAKAJMQQFqNgJMCyAIQQFqIQgMAQsgCEUEQEEAIQgMAQsgBCACIAhrQQR0aiIEIAMpAgA3AgAgBCADKQIINwIICyAJIAJBAWoiAkcNAAsMAQtBACEKAn9BAAJ/IAAoAggiBCAAKAIMIgNBHGxqIgJBHGsoAgAiCygAACIFQQFxBEAgBUEDdkEBcQwBCyAFLwEsQQJ2QQFxCw0AGiADQQJJBEAgAC8BFAwBC0EAIAJBOGsoAgAoAgAvAUIiBUUNABogFSgCACgCCCIGKAJUIAYvASQgBWxBAXRqIAJBCGsoAgBBAXRqLwEACyEFIAJBGGsoAAAhFCACQRRrKAAAIQ4gAkEQaygAACEPIAcgFSgCACIMNgK0ASAHIAs2ArABIAcgBUH//wNxIhA2AqwBIAcgDzYCqAEgByAONgKkASAHIBQ2AqABAn8gA0ECSARAQQAhBkEAIQ1BACEJQQAhCEEADAELQQAhBgJAIANBAmsiAkUNAANAAkAgBCACQRxsaiIDQRxrKAIAKAIALwFCIglFDQAgDCgCCCIKKAJUIAovASQgCWxBAXRqIAMoAhRBAXRqLwEAIglFDQAgAyEEIAkhBgwCCwJ/IAMoAgAoAAAiCUEBcQRAIAlBAXZBAXEMAQsgCS8BLEEBcQtFBEAgAkEBayICRQ0CDAELCyADIQQLIAQoAAwhDSAEKAAIIQkgBCgABCEIIAwhCiAEKAIACyETAn8gCykCACIhpyICQQFxIgMEQCAhQhiIQoCAgIDwH4MhICAUICFCOIinagwBCyACKQIUISAgAigCECAUagshBAJAAkACQAJAAkACfyATRQRAIAAoAlghC0EADAELAn9BASAJAn4CQAJAIBMpAgAiIaciEUEBcQRAIAAoAlgiCyAIICFCOIinakkNAUEBDAQLIAAoAlgiCyARKAIQIAhqSQ0BQQEMAwsgIUIYiEKAgICA8B+DDAELIBEpAhQLIiGnIhFqIhIgACgCYCIXSQ0AGiASIBdGIAAoAmQgIUIgiKdBACANIBEbak9xCyERAkAgCCAAKAJcTw0AIAkgACgCaCIISw0AIAggCUYgDSAAKAJsT3EiCSARRQ0BGkEAIRFBASEIDAMLQQEhCCARDQFBAQshCUEAIQggBCALSQRAQQAhEQwCCyAOICCnIhFqIg0gACgCYCISSQRAQQAhESAJRQ0EQQEhBAwFCyANIBJGICBCIIinQQAgDyARG2oiFyAAKAJkIhhJcSIZRSERIBkNASAEIBRGDQEgBCALRgRAQQAhEQwCCyAJDQIgDSASRyAXIBhHciERDAMLQQAhEUEBIQQMAwsgCUUNAQtBASEEQQAhEQwBCyAAKAJcIBRNBEBBACERQQAhBAwBC0EAIQQgACgCaCIJIA5PBH8gCSAORyAPIAAoAmxJcgVBAAsgEXEhEQtBACEOAkAgAC0AoAFBAUcNAAJ/AkAgEEUEQCADBEAgAkGA/gNxQQh2IQUMAgsgAi8BKCEFC0H//wMgBUH//wNxQf//A0YNARoLIAwoAggoAkwgBUH//wNxQQF0ai8BAAshGkEBIRQCQAJAAkAgEEH+/wNrDgIAAgELQQAhFAwBCyAQBEAgDCgCCCgCSCAQQQNsai0AAUEARyEUDAELIAMEQCACQQJ2QQFxIRQMAQsgAi8BLEEBdkEBcSEUCyADBH8gAkEFdkEBcQUgAi8BLEEJdkEBcQshFyAHQgA3A4gBIAdCADcDgAEgB0EINgJ8IAdBgAFqIRYgBygCfCEbIAdBADsBmgEgB0EANgJ8IAdBADoAnwEgB0EAOgCeASAHQQA6AJ0BAkAgFSgCCCIDQQFrIgJFDQAgFSgCBCIeQThrIR8gFSgCACgCCCENA0AgAyEJIB4gAiIDQRxsaiEMIB8gCUEcbGooAgAiDygCAC8BQiICBH8gDSgCVCANLwEkIAJsQQF0agVBAAshEAJAAkACfyAMKAIAIhgoAAAiAkEBcSILBEAgAkEDdkEBcQwBCyACLwEsQQJ2QQFxCw0AIBBFDQAgECAMKAIUQQF0ai8BACIFDQELIAsEQCACQYD+A3FBCHYhBQwBCyACLwEoIQULQQAhC0EAIQICQAJAAkAgBUH+/wNrDgICAQALIA0oAkggBUEDbGoiAi0AAEEBcyELIAItAAIhAgsgC0EBcUUgFSgCCCAJR3ENAiACIA4gG0lxRQ0AIBYgDkEBdGogBTsBACAHIA5BAWoiDjYCfAsCQCAHLQCfAQ0AIA8oAgAoAiQhGQJ/IBgoAAAiAkEBcQRAIAJBA3ZBAXEMAQsgAi8BLEECdkEBcQshAiAMKAIQQQFqIgUgGU8NACAMKAIUIAJFaiELA0ACQAJAAn8gDygCACICIAIoAiRBA3RrIAVBA3RqKAIAIglBAXEiEgRAIAlBA3ZBAXEMAQsgCS8BLEECdkEBcQsNACAQRQ0AIBAgC0EBdGovAQAiAg0BCyASBEAgCUGA/gNxQQh2IQIMAQsgCS8BKCECCyALAn8CQAJAAkACQAJAAkAgAkH+/wNrDgIBAwALIA0oAkggAkEDbGoiAi0AAEEBcUUNACACLQABIQIgB0EBOgCfASAHLQCeAQ0HIAJBAXENAyASRQ0BDAQLIBINAyAJKAIkRQ0AIAkoAjBFDQAgB0EBOgCfASAHLQCeAQ0GIAkoAjQNAgsgCS8BLEECdkEBcQwDCyAHQQE6AJ8BIActAJ4BDQQLIAdBAToAngEMAwsgCUEDdkEBcQtFaiELIAVBAWoiBSAZRw0ACwsCQAJ/IBgoAAAiAkEBcQRAIAJBA3ZBAXEMAQsgAi8BLEECdkEBcQsNACANKAIgRQ0AIA0oAkQgDSgCQCAPKAIALwFCQQJ0aiIFLwEAQQJ0aiICIAUvAQIiCUECdGohCyAHLwGaASIFRQRAIAlFDQEgAiEFA0ACQCAFLQADRQRAIAwoAhQgBS0AAkYNAQsgBUEEaiIFIAtJDQEMAwsLIAcgBS8BACIFOwGaASAFRQ0BCyAJRQ0AA0ACQCACLwEAIAVHDQAgDCgCFCACLQACTw0AIAdBAToAnQEMAgsgAkEEaiICIAtJDQALCyADQQFrIgINAAsLAn9BACATRQ0AGgJAIAZFBEAgEygCACICQQFxBEAgAkGA/gNxQQh2IQYMAgsgAi8BKCEGCyAGQf//A3FB//8DRw0AQQEMAQsgCigCCCgCTCAGQf//A3FBAXRqLwEAQf//A0YLIQUgBCAIciEJIAAoAgAiAi8BoAEhCAJAIBpB//8DcSINQf//A0YiGA0AIAhB//8DcUUEQEEAIQgMAQtBACEDIAcoAnwhCiAHLwGaASEMIAUgCXJBAXEhCwNAIAIoAjwgAigCSCADQQZsaiIELwEAQRRsaiIGLwEMIQggACgCUCEOAkACQCAELQAEQQFGBEAgEQ0BDAILIAsNAQsgBi8BBCIQQQAgDCAQRxsNAEEAIAYvAQIgChsNACAAKAJUIA4gCGtJDQAgACAEEHQgACgCACECCyADQQFqIgMgAi8BoAEiCEkNAAsLAkACQAJAAkAgAigCTCIKIAhB//8DcSIDayIIDgIDAAELIAIoAkghBCACKAI8IQYMAQsgAigCSCEEIAIoAjwhBgNAIAhBAXYiDCADaiILIAMgDSAGIAQgC0EGbGovAQBBFGxqLwEASxshAyAIIAxrIghBAUsNAAsLAkAgDSAGIAQgA0EGbGovAQBBFGxqLwEAIghNDQAgA0EBaiIDIApPDQAgBiAEIANBBmxqLwEAQRRsai8BACEICyANIAhB//8DcUcNACAAKAJQIAYgBCADQQZsaiIILwEAQRRsaiIELwEMayEGIAcvAZoBIQogBSAJckEBcSEFA0ACQAJAIAgtAARBAUYEQCARDQEMAgsgBQ0BCyAELwEEIgRBACAEIApHGw0AIAYgACgCVEsNACAAIAgQdCAAKAIAIQILIANBAWoiAyACKAJMRg0BIAIoAjwgAigCSCADQQZsaiIILwEAQRRsaiIELwEAIA1GDQALCyAAKAIcRQRAQQAhDgwBCyAUQQFzIRkgDUH//wNHIRpBACEOQQAhCQNAIAcgCUEEdCIPIAAoAhhqIgQ2AnggACgCACgCPCEDIAQgBC8BDiIMQf+/f3EiCzsBDkEBIQIgACgCUCADIAQvAQpBFGwiCGoiCi8BDCAELwEIakYEfwJ/IAovAQAiAkUEQCAKLwESIgZBgARxQQl2IgIgGHIgFHJBAXEEQCAXIBogAhsMAgsgBkEBcwwBCyAKLwESIQZBACACIA1HDQAaIAZBgARxRSAXQQBHcgshBSAGQQRxBEAgBy0AngFBAXMgBXEhBQsgDEGAIHFFIAZBAnFFIBlycSECAn8CQCAKLwECIgxFDQBBACIDIAcoAnwiEEUNARoDQCAHQYABaiADQQF0ai8BACAMRg0BIANBAWoiAyAQRw0AC0EADAELIAULIQMgAiAHLQCfAXEhBQJAAkACQAJAAkACQAJAAkAgCi8BBCICBEAgAiAHLwGaAUcNASAHLQCdASAFcSEFCyAKLwEQIgJFDQEMAgtBACEDIAovARAiAg0BIAVFDQRBACEMDAYLIANBAXENAQwCCyAAKAIAKAJ4IAJBAXRqIQIDQCACLwEAIgwEQCAHQUBrIAcpArABNwMAIAcgBykCqAE3AzggByAHKQKgATcDMCAHQeAAaiAHQTBqIAwQNSACQQJqIQIgBygCcEUNAQwDCwsgA0EBcUUNAQtBACEMAkAgBUEBcUUNAAJAIAZBwABxDQAgACgCACgCPCAIaiICLwEgIgNB//8DRg0BIAMgAi8BDE0NASACLQAnQQFxRQ0AIAIvAQANAQsjAEEQayIEJAAgACgCGCECIAQgBygCeCIFKQIINwMIIAQgBSkCADcDACAFIAJrIghBBHUhCyAEQf//AzYCBAJ/IAUoAgRB//8DRwRAQQAgACAEIAsQkwEiAkUNARogAigCACEDIAUvAQQiBSAAKAI0TwR/IABBPGoFIAAoAjAgBUEMbGoLIgUoAgAhEAJAIAUoAgQiDCACKAIEIgVqIhMgAigCCE0NACATQRxsIQYCfyADBEAgAyAGIwQoAgARAQAMAQsgBiMFKAIAEQAACyEDIAIgEzYCCCACIAM2AgAgAigCBCITIAVNDQAgEyAFa0EcbCITRQ0AIAMgBmogAyAFQRxsaiAT/AoAAAsCQCAMRQ0AIAxBHGwhBiADIAVBHGxqIQMgEARAIAZFDQEgAyAQIAb8CgAADAELIAZFDQAgA0EAIAb8CwALIAIgAigCBCAMajYCBCAAKAIYIQILIAAoAhwiBUEBaiIDIAAoAiBLBEAgA0EEdCEFAn8gAgRAIAIgBSMEKAIAEQEADAELIAUjBSgCABEAAAshAiAAIAM2AiAgACACNgIYIAAoAhwhBQsCQCALQQFqIgMgBU8EQCADQQR0IQYMAQsgA0EEdCEGIAUgA2tBBHQiBUUNACACIAhqQSBqIAIgBmogBfwKAAALIAIgBmoiAiAEKQMANwAAIAIgBCkDCDcACCAAIAAoAhxBAWo2AhwgByAAKAIYIAhqNgJ4IAAoAhggA0EEdGoLIQIgBEEQaiQAIAJBAEchDCAHKAJ4IgQvAQ4hCwsCQCALwUEATg0AAkAgACgCDCICQQJOBEAgACgCCCEFAkAgAkECayICRQRAQQAhBgwBCwNAAkAgBSACQRxsaiIDQRxrKAIAKAIALwFCIgYEQCAVKAIAKAIIIggoAlQgCC8BJCAGbEEBdGogAygCFEEBdGovAQAiBg0BC0EAIQYCfyADKAIAKAAAIghBAXEEQCAIQQF2QQFxDAELIAgvASxBAXELDQAgAkEBayICDQEMAgsLIAMhBQsgBSkABCEgIAUoAAwhAyAFKAIAIQIgByAVKAIANgJcIAcgAjYCWCAHIAY2AlQgByADNgJQIAcgIDcCSCACDQELIAQgC0GAgAFyOwEODAELIAQgC0H//wFxOwEOIAohAwNAIAMiAkEUayEDIAJBAmstAABBGHENACACQQhrLwEADQALIAJBDmsvAQBB//8DRg0AIAcgBykCWDcDKCAHIAcpAlA3AyAgByAHKQJINwMYIAAgBCADIAdBGGoQdQsgCi8BBkH//wNHBEAgByAHKQKwATcDECAHIAcpAqgBNwMIIAcgBykCoAE3AwAgACAEIAogBxB1CyAELwEOIgJBgIABcQ0CIAQgBC8BCkEBaiIDOwEKIAAoAgAoAjwgA0H//wNxQRRsaiEDIAQCfwJAIAovAQANACAKLwESQQFxDQAgAy0AEkECcUUNACACQYAgcgwBCyACQf/fAnELOwEOIAEEQCADLQASQQd2IA5yIQ4LIAlBf0YEQEF/IQkMBAsgCUEBaiELIAkhAgNAAkACQCAAKAIAKAI8IAAoAhgiAyACQQR0IhZqIggvAQoiBEEUbGoiEC8BDiIFQf//A0YEQCACIQUMAQsgEC8BEiIGQRBxBEAgCCAFOwEKDAILIAIhBSAGQQhxBEAgCCAEQQFqOwEKIAJBAWshBQtB//8DIQQgCCkCCCEgIAgoAgAhGyAIKAIEQf//A0cEQCAAKAI0IgpB//8DcSEEAkACQAJAAkAgACgCTCITRQ0AIARFDQAgACgCMCEGQQAhAwNAIAYgA0EMbGoiDygCBEF/Rg0CIANBAWoiAyAERw0ACwsgACgCSCAKSwRAIAAoAjAhBiAAKAI4IgMgCk0EQEEIIANBAXQiAyAKQQFqIgogAyAKSxsiAyADQQhNGyIKQQxsIQMCfyAGBEAgBiADIwQoAgARAQAMAQsgAyMFKAIAEQAACyEGIAAgCjYCOCAAIAY2AjAgACgCNCEKCyAAIApBAWo2AjQgBiAKQQxsaiIDQQA2AgggA0IANwIAIARB//8DRw0CCyAAQQE6AKMBQQAhA0H//wMhBCAAIAdByABqIAdBzAFqIAdByAFqQQAQdkUNAiAHKAJIIgYgAkYNAiAAKAIYIAZBBHRqIgMoAgQhBCADQf//AzYCBCADIAMvAQ5BgIABcjsBDiAAKAIwIARB//8DcUEMbGoiA0EANgIEDAILIA9BADYCBCAAIBNBAWs2AkwgA0H//wNxIQQLIAYgBEEMbGohAwsgA0UNASAcIQYgCC8BBCIKIAAoAjRJBEAgACgCMCAKQQxsaiEGCyADKAIAIQggBigCACEPAkAgBigCBCITIAMoAgQiBmoiEiADKAIITQ0AIBJBHGwhCgJ/IAgEQCAIIAojBCgCABEBAAwBCyAKIwUoAgARAAALIQggAyASNgIIIAMgCDYCACADKAIEIhIgBk0NACASIAZrQRxsIhJFDQAgCCAKaiAIIAZBHGxqIBL8CgAACwJAIBNFDQAgE0EcbCEKIAggBkEcbGohBiAPBEAgCkUNASAGIA8gCvwKAAAMAQsgCkUNACAGQQAgCvwLAAsgAyADKAIEIBNqNgIEIAAoAhghAwsgACgCHCIIQQFqIgYgACgCIEsEQCAGQQR0IQoCfyADBEAgAyAKIwQoAgARAQAMAQsgCiMFKAIAEQAACyEDIAAgBjYCICAAIAM2AhggACgCHCEICwJAIAJBAWoiAiAITwRAIAJBBHQhBgwBCyACQQR0IQYgCCACa0EEdCIKRQ0AIAMgFmpBIGogAyAGaiAK/AoAAAsgAyAGaiIDICA3AAggAyAENgAEIAMgGzYAACAAIAAoAhxBAWo2AhwgACgCGCIERQ0AIAQgAkEEdGoiAiAQLwEOOwEKIAxBAWohDCALQQFqIQsgEC0AEkEgcUUNACACIAIvAQ5BgCByOwEOCyAFQQFqIQILIAIgC0kNAAsMAwsgBUEBcUUNAEEAIQwMAgtBACEMIAQvAQQiAiAAKAI0Tw0AIAAoAjAgAkEMbGpBfzYCBCAAIAAoAkxBAWo2AkwLIAAoAhwgCUF/c2pBBHQiAgRAIAAoAhggD2oiBCAEQRBqIAL8CgAACyAAIAAoAhxBAWs2AhwgCUEBayEJCyAMQQFqBUEBCyAJaiIJIAAoAhwiCkkNAAtBACEFIApFDQADQAJAIAVBBHQiFyAAKAIYaiIGLQAPQcAAcUUEQAJAAkAgBSIUQQFqIg0gCk8NAANAIAAoAhgiGCANQQR0aiIILwEIIAYvAQhHDQEgCC8BDCAGLwEMRw0BIBwhCSAAKAI0IgIgBi8BBCIESwRAIAAoAjAgBEEMbGohCQsgHCEEIAIgCC8BBCIQTSIZRQRAIAAoAjAgEEEMbGohBAtBASEMIAdBAToAzAEgB0EBOgBIIAQoAgQhE0EAIQMCQAJAAkACQCAJKAIEIhoEQEEBIQtBACECA0ACQAJAIAMgE0kEQAJAAkAgCSgCACACQRxsaiIPKAIQIhYgBCgCACADQRxsaiISKAIQIhtGBEAgDygCGCASKAIYRw0BIANBAWohAyACQQFqIQIMBQsgDygAACIPIBIoAAAiEkkNAyAPIBJNBEACfyAWKQIAIiCnIhZBAXEEQCAgQjiIpwwBCyAWKAIQCyAPaiEPIA8CfyAbKQIAIiCnIhZBAXEEQCAgQjiIpwwBCyAWKAIQCyASaiISSw0EIA8gEk8NAQsMAQsgAkEBaiECQQAhCwsgA0EBaiEDQQAhDAwCCyAHIAs6AMwBIAcgDDoASCAHQcwBaiECDAQLIAJBAWohAkEAIQsLIAIgGkkNAAsgByALOgDMASAHIAw6AEgLIAdByABqIQIgAyATSQ0AIAxBAXENAQwCCyACQQA6AAAgBy0ASEEBcUUNAQsgBi8BCiAILwEKRgRAIBlFBEAgACgCMCAQQQxsakF/NgIEIAAgACgCTEEBajYCTAsgCiAUa0EEdEEgayICBEAgCCAYIBRBBHRqQSBqIAL8CgAACyAAIAAoAhxBAWs2AhwMAgsgCCAILwEOQYDAAHI7AQ4LIActAMwBQQFGBEAgBi8BCiAILwEKRgRAIAYvAQQiAiAAKAI0SQRAIAAoAjAgAkEMbGpBfzYCBCAAIAAoAkxBAWo2AkwLIAAoAhwgBUF/c2pBBHQiAgRAIAAoAhggF2oiBCAEQRBqIAL8CgAACyAAIAAoAhxBAWsiCjYCHCAFQQFrIQUMBQsgBiAGLwEOQYDAAHI7AQ4LIA0hFAsgFEEBaiINIAAoAhwiCkkNAAsLIAAoAgAoAjwgBi8BCkEUbGovAQxB//8DRw0AIAYtAA9BIHENACAAKAIkIQIgACAAKAIoIghBAWoiBCAAKAIsIgNLBH9BCCADQQF0IgMgBCADIARLGyIEIARBCE0bIgNBBHQhBAJ/IAIEQCACIAQjBCgCABEBAAwBCyAEIwUoAgARAAALIQIgACADNgIsIAAgAjYCJCAAKAIoIghBAWoFIAQLNgIoIAIgCEEEdGoiAiAGKQIANwIAIAIgBikCCDcCCCAAKAIcIAYgACgCGGtBf3NBBHZqQQR0IgIEQCAGIAZBEGogAvwKAAALIAAgACgCHEEBayIKNgIcIAVBAWshBUEBIQ4LIAVBAWohBQwBCyAKIAVBf3NqQQR0IgIEQCAGIAZBEGogAvwKAAALIAAgACgCHEEBayIKNgIcCyAFIApJDQALCwJAAkACQAJAIBEEQCAAKAJQIAAoAlRJDQELIAAoAhwiBARAIAAoAhghAyAAKAIAKAI8IQVBACECA0AgBSADIAJBBHRqIgYvAQpBFGxqLwEMIglB//8DRwRAIAAoAlAgBi8BCCAJakkNAwsgAkEBaiICIARHDQALCyAAKAJQIAAoAlRPDQEgAC0AoAENASAAKAIIIAAoAgxBHGxqQRxrKAIAKAIAIgJBAXENACACLwEsIgRBAnENACAEQQFxDQAgAigCJEUNAAJAAkACQCAAKAIAIgQoApQBIgMOAgQAAQsgAi8BKCEJIAQoApABIQRBACECDAELIAIvASghCSAEKAKQASEEQQAhAgNAIAIgA0EBdiIFIAJqIgIgBCACQQF0ai8BACAJQf//A3FLGyECIAMgBWsiA0EBSw0ACwsgBCACQQF0ai8BACAJQf//A3FHDQELQQAhAiAVEHdBAWsOAgIBAAsgAEEBOgChAQwFC0EBIQIgACAAKAJQQQFqNgJQCyAAIAI6AKABDAMLIAAoAhwgCGsLNgIcCwJAAkACQCAVIwJBC2oQeUEBaw4CAQACCyAALQCgAUUEQCAAQQE6AKABIAAgACgCUEEBajYCUAsgAEEAOgChAQwCCyAALQCgAUEBRgRAIABBADoAoAEgACAAKAJQQQFrNgJQCyAAQQA6AKEBDAELIAAoAgwiBEEBayICBEACQCAEQQJrIgMEQCAAKAIIIQYDQCACIQQCQAJ/IAYgAyICQRxsaiIFKAIAKAAAIgNBAXEEQCADQQJxDQUgA0EDdkEBcQwBCyADLwEsIgNBAXENBCADQQJ2QQFxCw0AIAVBHGsoAgAoAgAvAUIiA0UNACAVKAIAKAIIIgkoAlQgCS8BJCADbEEBdGogBSgCFEEBdGovAQANAwsgAkEBayIDDQALC0EBIQQLIAAgBDYCDCAAIAAoAlBBAWs2AlAFIABBAToAogELDAALAAvzAgEJfyAAKAJQIAAoAgAoAjwgAS8BACIJQRRsai8BDCIGayEHAkACQAJAIAAoAhwiAkUEQCAAKAIYIQQMAQsgACgCGCEEIAIhAwNAIAcgBCADQQR0aiIFQQhrLwEAIghLDQIgByAIRgRAIAVBBGsvAQAiCCABLwECIgpGBEAgBUEGay8BACAJRg0FCyAIIApNDQMLIANBAWsiAw0ACwtBACEDCyABLwECIQUgAkEBaiIBIAAoAiBLBEAgAUEEdCECAn8gBARAIAQgAiMEKAIAEQEADAELIAIjBSgCABEAAAshBCAAIAE2AiAgACAENgIYIAAoAhwhAgtBgKB+QYAgIAZBAUYbIQYgA0EEdCEBAkAgAiADTQ0AIAIgA2tBBHQiA0UNACABIARqIgJBEGogAiAD/AoAAAsgASAEaiIBIAY7AA4gASAFOwAMIAEgCTsACiABIAc7AAggAUL///////8/NwAAIAAgACgCHEEBajYCHAsL/gQCBH8CfgJAAkAgAS0AD0HAAHENACAAIAFBfxCTASIARQ0BIAIvAQYiBkH//wNGDQAgACgCACEBIAAgACgCBCIFQQFqIgQgACgCCCIHSwR/QQggB0EBdCIFIAQgBCAFSRsiBCAEQQhNGyIFQRxsIQQCfyABBEAgASAEIwQoAgARAQAMAQsgBCMFKAIAEQAACyEBIAAgBTYCCCAAIAE2AgAgACgCBCIFQQFqBSAECzYCBCADKQIIIQggAykCECEJIAEgBUEcbGoiASADKQIANwIAIAEgBjYCGCABIAk3AhAgASAINwIIIAIvAQgiBkH//wNGDQAgACgCACEBIAAgACgCBCIFQQFqIgQgACgCCCIHSwR/QQggB0EBdCIFIAQgBCAFSRsiBCAEQQhNGyIFQRxsIQQCfyABBEAgASAEIwQoAgARAQAMAQsgBCMFKAIAEQAACyEBIAAgBTYCCCAAIAE2AgAgACgCBCIFQQFqBSAECzYCBCADKQIIIQggAykCECEJIAEgBUEcbGoiASADKQIANwIAIAEgBjYCGCABIAk3AhAgASAINwIIIAIvAQoiBUH//wNGDQAgACgCACEBIAAgACgCBCIEQQFqIgIgACgCCCIGSwR/QQggBkEBdCIEIAIgAiAESRsiAiACQQhNGyIEQRxsIQICfyABBEAgASACIwQoAgARAQAMAQsgAiMFKAIAEQAACyEBIAAgBDYCCCAAIAE2AgAgACgCBCIEQQFqBSACCzYCBCADKQIIIQggAykCECEJIAEgBEEcbGoiACADKQIANwIAIAAgBTYCGCAAIAk3AhAgACAINwIICw8LIAEgAS8BDkGAgAFyOwEOC9ADAgp/AX4gAUF/NgIAIAJBfzYCACADQX82AgACQCAAKAIcRQRADAELIABBPGohDANAAkAgACgCGCAIQQR0aiIJLwEOIgdBgIABcQ0AIAwhBiAJLwEEIgUgACgCNEkEQCAAKAIwIAVBDGxqIQYLIAdB/x9xIgUgBigCBE8NACAGKAIAIAVBHGxqIgUoAgghDSAFKAIEIQsgBSgCACEGAkACQCALAn4gBSgCECkCACIPpyIFQQFxBEAgACgCWCAGIA9COIinak8NAiAPQhiIQoCAgIDwH4MMAQsgACgCWCAFKAIQIAZqTw0BIAUpAhQLIg+nIgVqIgsgACgCYCIOSQ0AIAsgDkcNASAAKAJkIA9CIIinQQAgDSAFG2pJDQELIAkgB0EBakH/H3EgB0GA4AJxcjsBDiAIQQFrIQgMAQsCQAJAIApFDQAgBiACKAIAIgdJDQAgBiAHRw0BIAMoAgAgCS8BDE0NAQsgACgCACgCPCAJLwEKQRRsai8BEiEHAkAgBARAIAQgB0GCAXFBgAFGOgAADAELIAdBgAFxDQILIAEgCDYCACACIAY2AgAgAyAJLwEMNgIAC0EBIQoLIAhBAWoiCCAAKAIcSQ0ACwsgCgvzBQILfwF+IwBB0ABrIgIkAAJAAkAgACgCBCIFIAAoAggiA0EcbGoiCEEcaygCACIJKAAAIgZBAXFFBEAgBigCJA0BCyACQgA3AwggACgCACEBIAJCADcCHCACQgA3AiQgAkEANgIsIAJCADcCFCACIAE2AhAMAQsgACgCACIKKAIIIQQgBi8BQiIBBH8gBCgCVCAELwEkIAFsQQF0agVBAAshCyAIQQRrKAIAIQECQAJAIANBAWsiB0UNACAGLwEsIgZBAXENACAGQQRxDQEgBSAHQRxsaiIGQRxrKAIAKAIALwFCIgdFDQEgASAEKAJUIAQvASQgB2xBAXRqIAYoAhRBAXRqLwEAQQBHaiEBDAELIAFBAWohAQsgCSkCACEMIAIgCjYCECACIAw3AwggAiAIQRhrIgQoAgg2AhwgAiAEKQIANwIUIAIgCzYCLCACIAE2AiggAkIANwMgC0EAIQQCQCACQQhqIAJBMGogAkHPAGoQeEUNAAJAA0AgAi0AT0EBRgRAIAAgA0EBaiIBIAAoAgwiBEsEf0EIIARBAXQiAyABIAEgA0kbIgEgAUEITRsiA0EcbCEBAn8gBQRAIAUgASMEKAIAEQEADAELIAEjBSgCABEAAAshBSAAIAM2AgwgACAFNgIEIAAoAggiA0EBagUgAQs2AghBAiEEDAILAkACQCACKAIwKAAAIgFBAXENACABKAIkRQ0AIAEoAjANAQsgAkEIaiACQTBqIAJBzwBqEHgNAQwDCwtBASEEIAAgA0EBaiIBIAAoAgwiBksEf0EIIAZBAXQiAyABIAEgA0kbIgEgAUEITRsiA0EcbCEBAn8gBQRAIAUgASMEKAIAEQEADAELIAEjBSgCABEAAAshBSAAIAM2AgwgACAFNgIEIAAoAggiA0EBagUgAQs2AggLIAUgA0EcbGoiASACKQIwNwIAIAEgAigCSDYCGCABIAJBQGspAgA3AhAgASACKQI4NwIICyACQdAAaiQAIAQL8QQCBn8BfiMAQRBrIQQCQCAAKAIAIgNFDQAgACgCGCIGIAMoAiQiB0YNACAEIAAoAhQ2AgggBCAAKQIMNwMAIAApAhwhCSABIAZBA3RBACADIAdBA3RrIANBAXEbaiIFNgIAIAEgBCkDADcCBCABIAQoAgg2AgwgASAJNwIUIAEgBjYCECACAn8gBSgAACIBQQFxBEAgAUEBdkEBcQwBCyABLwEsQQFxCyIEOgAAAn8gBSgAACIBQQFxBEAgAUEDdkEBcQwBCyABLwEsQQJ2QQFxC0UEQCAAKAIcIQEgACgCJCIDBEAgAiADIAFBAXRqLwEAIARyQQBHIgQ6AAALIAAgAUEBajYCHCAFKAAAIQELQQAhAwJAIAFBAXENACABKAIkRQ0AIAEoAjghAwsgACAAKAIgIANqIARqNgIgIAACfyAFKAAAIgFBAXEEQCAAQRRqIQYgAEEQaiEHIAAoABQhCCAAKAAQIQMgBS0AByICIAAoAAxqDAELQQAgACgAFCABKAIUIgIbIQggAEEUaiEGIABBEGohByAAKAAQIAJqIQMgASgCGCECIAAoAAwgASgCEGoLIgQ2AgxBASEFIAAgACgCGEEBaiIBNgIYIAAgA60gAiAIaq1CIIaENwIQIAEgACgCACICKAIkIghPDQAgBigAACEGIAACfyACIAhBA3RrIAFBA3RqKQIAIgmnIgFBAXEEQCAJQiCIp0H/AXEhAiAJQiiIp0EPcSEAIAlCMIinQf8BcQwBCyABKAIMIQIgASgCCCEAIAEoAgQLIARqNgIMIAcgACADaq1BACAGIAAbIAJqrUIghoQ3AgALIAULqgYCB38BfiMAQdAAayIDJAACQAJAIAAoAggiBEECSQ0AIANBNGohBSADQRRqIQYgBCECA0AgACACQQFrIgI2AgggAyAAKAIEIAJBHGxqIgIoAhg2AkggA0FAayACKQIQNwMAIAMgAikCCDcDOCADIAIpAgA3AzACQAJAIAJBHGsoAgAiBygAACICQQFxRQRAIAIoAiQNAQsgA0IANwMIIAAoAgAhAiADQQA2AiwgAyACNgIQDAELIAAoAgAhCCAHKQIAIQkgAyACLwFCIgIEfyAIKAIIIgcoAlQgBy8BJCACbEEBdGoFQQALNgIsIAMgCDYCECADIAk3AwgLIAMgAykDQDcDICAGIAUoAgg2AgggBiAFKQIANwIAIAMgAygCSDYCKCADQQA6AAcgA0EIaiADQTBqIANBB2ogAREEABogAy0AB0EBRgRAIAAoAghBAWogBEkNAgsCQCADQQhqIANBMGogA0EHaiABEQQARQ0AAn8DQCADLQAHQQFGBEAgACgCBCECIAAgACgCCCIEQQFqIgEgACgCDCIFSwR/QQggBUEBdCIEIAEgASAESRsiASABQQhNGyIEQRxsIQECfyACBEAgAiABIwQoAgARAQAMAQsgASMFKAIAEQAACyECIAAgBDYCDCAAIAI2AgQgACgCCCIEQQFqBSABCzYCCEECIQEgAiAEQRxsagwCCwJAAkAgAygCMCgAACICQQFxDQAgAigCJEUNACACKAIwDQELIANBCGogA0EwaiADQQdqIAERBABFDQMMAQsLQQEhASAAKAIEIQIgACAAKAIIIgVBAWoiBCAAKAIM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AgQgAkH//wM2AgQgAiACLwEOQYCAAXI7AQ4gACgCMCABLwEEQQxsaiIDQQA2AgQMAgsgCkEANgIEIAAgCEEBazYCTCABIANB//8DcSIGNgIECyAEIAZBDGxqIQMLIAdBEGokACADCxQBAX8jCSIAQo+AgIDQATcDACAAC/kIAgd/AX4jCSEGIwBBEGsiBSQAQQFB6AojBygCABEBACIAIwIiATYCHCAAIAFBAWo2AhggACABQQJqNgIUIAAgAUEDajYCECAAIAFBBGo2AgwgACABQQVqNgIIIABCADcCACAAQSBqQQBB5Aj8CwAgAEEAQRgjBCgCABEBACIBNgJEIAEjAUH8C2oiAikCEDcCECABIAIpAgg3AgggASACKQIANwIAIABBATYCZAJAAkAgACgCRCIEKAIUIgMgACgAICIBTQ0AIAMgBCgCECICTQ0AIAEgAk0EQCAAIAQpAgA3AiQgACACNgIgIAIhAQtBACECIABBADYCaCAAKAJIRQ0BIAAoAmwiBCABTQRAIAEgACgCcCAEakkNAgsgAEEANgJIIABCADcCbAwBC0EBIQIgAEEBNgJoIAQpAgghByAAQQA2AkggACAHNwIkIAAgAzYCICAAQgA3AmwLIABBADYCsAkgAEEANgIAIAAgAjYCdCAAQgA3A6gJQcAAIwUiASgCABEAACECIABBBDYCsAkgACACNgKoCUGAAiABKAIAEQAAIQEgAEIANwKUCSAAQoCAgICABDcCjAkgACABNgKICSAAQZwJakEANgIAIABBiAlqIgQhAkEBQTgjBygCABEBACIBQgA3AgAgAUIANwIoIAFCADcCICABQgA3AhggAUIANwIQIAFCADcCCEGAASMFKAIAEQAAIQMgAUEENgIIIAEgAzYCACABKAIUQQNNBEACfyABKAIMIgMEQCADQcAAIwQoAgARAQAMAQtBwAAjBSgCABEAAAshAyABQQQ2AhQgASADNgIMCyABKAIgQQNNBEACfyABKAIYIgMEQCADQeAAIwQoAgARAQAMAQtB4AAjBSgCABEAAAshAyABQQQ2AiAgASADNgIYCyABKAIsQTFNBEACfyABKAIkIgMEQCADQcgBIwQoAgARAQAMAQtByAEjBSgCABEAAAshAyABQTI2AiwgASADNgIkCyABIAI2AjQCfyABKAIoIgIEQCABIAJB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BSAFKQIgNwI4IAUgBSgCKDYCQCAFKABAIQcgBSgAOCEAIAUoADwLIQMCfyALKALgASIBQQFxBEAgCy0A5QFBBHYhESALLQDmASALLQDnAWoMAQsgASgCHCERIAEoAhAgASgCBGoLIRUgBSgChAkiASgCACECIAEgASgCBCIEQQFqIgggASgCCCIQSwR/QQggEEEBdCIEIAggBCAISxsiBCAEQQhNGyIIQQV0IQQCfyACBEAgAiAEIwQoAgARAQAMAQsgBCMFKAIAEQAACyECIAEgCDYCCCABIAI2AgAgASgCBCIEQQFqBSAICzYCBCACIARBBXRqIgQgAiAjaiICKQIANwIAIAQgAikCGDcCGCAEIAIpAhA3AhAgBCACKQIINwIIIAEoAgAgASgCBCIQQQV0aiICQSBrKAIAIgQEQCAEIAQoApQBQQFqNgKUAQsgByAfayIEQQAgBCAHTRshBCADIBlLIQggAyADIBlrIhxJIQMgACAKayIeIABLISACQCACQRRrKAIAIgBFDQAgAEEBcQ0AIAAgACgCAEEBajYCACAAKAIAGiABKAIEIRALIAcgBCAIGyEAQQAgHCADGyEEQQAgHiAgGyEHIBEgFWohCCACQRxrQQA2AgBBASECQQEhAQJ+AkACQAJAIA9B/v8DayIVDgIBAgALIAUoAqAJKAJIIA9BA2xqIgItAAEhASACLQAAIQIgD0H/AUsNASAHQf4BSw0BIARBD0sNASAAQf4BSw0BIAhBD0sNASABQQJ0IAJBAXRqQQFyQf8BcSAPQQh0ciEDIAhBDHQgBEEIdHIgB0EQdHIgAHKtQiCGDAILQQAhAkEAIQELIAStIACtQiCGhCE4An8gBSgCjAkiAARAIAUgAEEBayIANgKMCSAFKAKICSAAQQN0aigCAAwBC0HMACMFKAIAEQAACyEDIAtCADcDyAEgC0IANwPQASALQQA2AtgBIAsgBzYCkAIgCyA4NwOYAiALQQA2AogCIAtBADYChAIgC0EANgKAAiALIAg2AvwBIAtBADYC+AEgC0EANgL0ASALIA87AfABIAtBADsB7gEgC0EAOwHqASALQgA3A8ABIAtBATYClAIgCyABQQF0IAJqQf8BcTsB7AEgAyALKAKUAjYCACADIAsoApACNgIEIAMgCykDmAI3AgggAyALKAKIAjYCECADIAsoAoQCNgIUIAMgCygCgAI2AhggAyALKAL8ATYCHCADIAsoAvgBNgIgIAMgCygC9AE2AiQgAyALLwHwATsBKCADIAsvAe4BOwEqIAMgCy8B7AE7ASwgAyALLwHqATsBLiADIAsoAtgBNgJIIANBQGsgCykD0AE3AgAgAyALKQPIATcCOCADIAspA8ABNwIwQgALITggEEEBayEEAkAgA0EBcQRAIANBIHIhAwwBCyADIAMvASxBgARyOwEsCyAEQQV0IhAgBSgChAkiASgCAGoiESgCACEAAn8gASgCKCICBEAgASACQQFrIgI2AiggASgCJCACQQJ0aigCAAwBC0GkASMFKAIAEQAACyICIB07AQAgAkECakEAQZIB/AsAIAJCADcCmAEgAkEBNgKUASACQQA2AqABAkACfwJAIAAEQCACIDggA62ENwIUIAIgADYCECACQQE7AZABIAIgACkCBDcCBCACIAAoAgw2AgwgAiAAKAKYASIBNgKYASACIAAoAqABIhw2AqABIAIgACgCnAEiBzYCnAEgA0EBcSIdDQEgAiADLQAtQQJxBH9B4gQFIAMoAiALIAFqNgKYAUEAIAMoAgwgAygCFCIBGyEAIAMoAhAgAygCBGohCCABIAMoAghqIQEgAygCGAwCCyACQgA3AgQgAkEANgIMDAILIAIgASADQRp0QR91QeIEcWo2ApgBIDhCMIinIDhCOIinaiEIIDhCIIinQf8BcSEAIDhCKIinQQ9xIQFBAAshHiACIAIoAAQgCGo2AgQgAiACKAAIIAFqrSAAIB5qQQAgAigADCABG2qtQiCGhDcCCAJAIB1FBEBBACEBIAIgAygCJCIABH8gAygCOAVBAAsgB2ogAy8BLEEBcWogAy8BKEH+/wNGajYCnAEgAEUNASADKAI8IQEMAQsgAiAHIANBAXZBAXFqNgKcAUEAIQELIAIgASAcajYCoAELIBEgAjYCACAFIAQCfyALLQDgAUEBcQRAQQEhASALLQDhASIRDAELIAsoAuABIgFBCHYhESABKAIkRQRAIAEvASgMAQsgAS8BRAtB//8DcRBJDQIgBSgCoAkhBwsgASEECyAPQQFqIg8gBy8BDEkNAQwCCwsCQAJAIAUoAmANACAFKAKMCg0AQQEhFgwBCyMBQasKaiEDAkACQAJAIBUOAgACAQsjAUGqCmoh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LQAHIh8gFC0ABmoMAQtBACAAKAIMIAAoAhQiCBshHiAIIAAoAghqIREgACgCGCEfIAAoAhAgACgCBGoLIgggAWohDSAhQiCIpyEVICGnIQcCQCALIAYEfyAEQfABcUEEdgUgACgCHAsgDWpLBEAgAyEADAELAkACQCABIA5NBEAgAkUNAiABIA5HDQIgCEUNAiAaIAcgHUtyDQEMAgsgGiAHIB1LckUNAQsgBgRAIAMhAAwECyAALQAtQQFxRQRAIAMhAAwECyASIBZGBEAgAyEADAQLIAcgEE0NACADIQAMAwtCACEiQQAhBEEAIQhCACEhIAEgC0kEQCALIAFrIQggHCAHayIAQQAgACAcTRutIBsgGyAVayIAQQAgACAbTRsgByAcSRutQiCGhCEhCyABIA5JBEAgECAHayIAQQAgACAQTRutIBIgEiAVayIAQQAgACASTRsgByAQSRutQiCGhCEiIA4gAWshBAsCfyABIApPBEBCACElQQAMAQsgI0IgiKciACAAIBVrIgZBACAAIAZPGyAjpyIAIAdLG61CIIYgACAHayIGQQAgACAGTxuthCElIAogAWsLIQYCfyALIA1JBEAgJiEkIAsMAQsgJiEkIAsgCyANRiALIA5GcQ0AGiAjISQgCCIEIQYgISIiISUgCgshCgJAIANBAWoiACAZTQ0AQQggGUEBdCIBIAAgACABSRsiASABQQhNGyIZQShsIQEgCQRAIAkgASMEKAIAEQEAIQkMAQsgASMFKAIAEQAAIQkLIAkgA0EobGoiAyAlNwIgIAMgBjYCHCADICI3AhQgAyAENgIQIAMgITcCCCADIAg2AgQgAyAUNgIAIAAhAyAkISMLIAcgEWqtIB4gH2pBACAVIBEbaq1CIIaEISEgDSEBIAJBAWoiAiAgRw0ACwsgAA0ACyAJBEAgCSMGKAIAEQIACyAMIAwpAgg3AhAgD0EwaiQAIBcgDCkDEDcCACAMKAIYIgEEQAJAIAwoAhwiBEUNAEEAIQJBACEDIARBBE8EQCAEQXxxIQhBACEAA0AgASADQQN0aiIGKAIAIwYiCigCABECACAGKAIIIAooAgARAgAgBigCECAKKAIAEQIAIAYoAhggCigCABECACADQQRqIQMgAEEEaiIAIAhHDQALCyAEQQNxIgBFDQADQCABIANBA3RqKAIAIwYo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ICACIAQpAwg3AiggAiAEKQMQNwIMIAIgBCkDGDcCFCACIAE2AgggAiACKAIINgIcIAIvARghACACQQA2AiQgAiAAOwEsIAIoAiAhACACKAIMIQUCQAJAIAIoAhAiASACKAIoSwRAIAFBHGwhAwJ/IAAEQCAAIAMjBCgCABEBAAwBCyADIwUoAgARAAALIQAgAiABNgIoIAIgADYCICACKAIkIgNFDQEgA0EcbCIDRQ0BIAAgAUEcbGogACAD/AoAAAwBCyABRQ0BCyABQRxsIQMgBQRAIANFDQEgACAFIAP8CgAADAELIANFDQAgAEEAIAP8CwALIAIgAigCJCABajYCJCAEIAIpAiA3AwAgBCACKQIoNwMIIAJBMGokAAtRAQJ/IwBBIGsiASQAIAEgADYCDCABIwkiACkDADcCECABIAApAwg3AhggAUEMahCDASECIAAgASkCEDcDACAAIAEpAhg3AwggAUEgaiQAIAILZAEDfyMAQSBrIgEkACABIAA2AgwgASMJIgApAwA3AhAgASAAKQMINwIYIAFBDGohAgNAIAIQhAEiA0EBRg0ACyADQQJGIQIgACABKQIQNwMAIAAgASkCGDcDCCABQSBqJAAgAgtrAgJ/AX4jAEEgayIBJAAgASAANgIMIAEjCSIAKAIANgIQIAEgACkCBDcCFCABIAAoAgwiAjYCHCABQQxqIAJBAXRBAEEAEIUBIQMgACABKQIQNwMAIAAgASkCGDcDCCABQSBqJAAgA0IAUguMAQICfwF+IwBBMGsiASQAIAEgADYCHCABIwkiACgCADYCICABIAApAgQ3AiQgASAAKAIMIgI2AiwgASAAKAIQQQF0NgIYIAEgAjYCFCABIAEpAhQ3AwggAUEcakEAIAEoAgggASgCDBCFASEDIAAgASkCIDcDACAAIAEpAig3AwggAUEwaiQAIANCAFILUQECfyMAQSBrIgEkACABIAA2AgwgASMJIgApAwA3AhAgASAAKQMINwIYIAFBDGoQhgEhAiAAIAEpAhA3AwAgACABKQIYNwMIIAFBIGokACACC/gEAg1/AX4jAEEgayIGJAAgBiAANgIMIAYjCSIJKQMANwIQIAYgCSkDCDcCGEEBIQsCQCAGQQxqIgojAkEMahB5Ig1FDQAgCigCBCAKKAIIQRxsaiIAQRhrIgIoAgANACAA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IAFBDGoQiAEhAiAAIAEpAhA3AwAgACABKQIYNwMIIAFBIGokACACC2kBAX8jAEHQAGsiASQAIAEgADYCPCABIwkiACkDADcCQCABIAApAwg3AkggAUEkaiABQTxqEIkBIAEgASkCNDcDGCABIAEpAiw3AxAgASABKQIkNwMIIAFBCGoQLyEAIAFB0ABqJAAgAAtpAQF/IwBB0ABrIgEkACABIAA2AjwgASMJIgApAwA3AkAgASAAKQMINwJIIAFBJGogAUE8ahCJASABIAEpAjQ3AxggASABKQIsNwMQIAEgASkCJDcDCCABQQhqEDIhACABQdAAaiQAIAALaQEBfyMAQdAAayIBJAAgASAANgI8IAEjCSIAKQMANwJAIAEgACkDCDcCSCABQSRqIAFBPGoQiQEgASABKQI0NwMYIAEgASkCLDcDECABIAEpAiQ3AwggAUEIahAxIQAgAUHQAGokACAAC4oBAQF/IwBB0ABrIgEkACABIAA2AjwgASMJIgApAwA3AkAgASAAKQMINwJIIAFBJGogAUE8ahCJASABIAEpAjQ3AxggASABKQIsNwMQIAEgASkCJDcDCAJ/IAEoAhgoAgAiAEEBcQRAIABBBXZBAXEMAQsgAC8BLEEJdkEBcQshACABQdAAaiQAIAALRwEBfyMAQTBrIgEkACABIAA2AhwgASMJIgApAwA3AiAgASAAKQMINwIoIAFBBGogAUEcahCJASABKAIUIQAgAUEwaiQAIAALiQEBAX8jAEHQAGsiASQAIAEgADYCPCABIwkiACkDADcCQCABIAApAwg3AkggAUEkaiABQTxqEIkBIAEgASkCNDcDECABIAEpAiw3AwggASABKQIkNwMAIAEgASgCBDYCHCABIAEoAgg2AiAgACABKAIcNgIAIAAgASgCIEEBdjYCBCABQdAAaiQAC34BAX8jAEHQAGsiASQAIAEgADYCPCABIwkiACkDADcCQCABIAApAwg3AkggAUEkaiABQTxqEIkBIAEgASkCNDcDECABIAEpAiw3AwggASABKQIkNwMAIAFBHGogARAuIAAgASgCHDYCACAAIAEoAiBBAXY2AgQgAUHQAGokAAtqAQF/IwBB0ABrIgEkACABIAA2AjwgASMJIgApAwA3AkAgASAAKQMINwJIIAFBJGogAUE8ahCJASABIAEpAjQ3AxggASABKQIsNwMQIAEgASkCJDcDCCABKAIIIQAgAUHQAGokACAAQQF2C2wBAX8jAEHQAGsiASQAIAEgADYCPCABIwkiACkDADcCQCABIAApAwg3AkggAUEkaiABQTxqEIkBIAEgASkCNDcDGCABIAEpAiw3AxAgASABKQIkNwMIIAFBCGoQLSEAIAFB0ABqJAAgAEEBdgs9AQF/IwBBIGsiASQAIAEgADYCDCABIwkiACkDADcCECABIAApAwg3AhggAUEMahCKASEAIAFBIGokACAAC/MBAQd/IwBBIGsiASQAIAEgADYCDCABIwkiACkDADcCECABIAApAwg3AhhBACEAIAEoAhQiBUECTwRAIAEoAhAhBkEBIQMDQAJAAn8CQAJAIAYgA0EcbGoiBCgCACgAACICQQFxBEAgAkECcQ0BIAJBA3ZBAXEMAwsgAi8BLCICQQFxRQ0BCyAAQQFqIQAMAgsgAkECdkEBcQsNACAEQRxrKAIAKAIALwFCIgJFDQAgACABKAIMKAIIIgcoAlQgBy8BJCACbEEBdGogBCgCFEEBdGovAQBBAEdqIQALIANBAWoiAyAFRw0ACwsgAUEgaiQAIAALSQEBfyMAQSBrIgEkACABIAA2AgwgASMJIgApAwA3AhAgASAAKQMINwIYIAEoAhAgASgCFEEcbGpBBGsoAgAhACABQSBqJAAgAAt2AQF/IwBBMGsiASQAIAEgADYCHCABIwkiACkDADcCICABIAApAwg3AiggAUEEaiABQRxqEIkBIAAgASgCEDYCECAAIAEoAgg2AgggACABKAIUNgIAIAAgASgCDEEBdjYCDCAAIAEoAgRBAXY2AgQgAUEwaiQAC3sBAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDACABEC8hACABQTBqJAAgAAurBwENfyMAQTBrIgMkACADIwkiBCgCADYCKCADIAQoAgxBAXQ2AiAgAyAANgIsIAMgAykCKDcDECADIAQoAhA2AiQgAyADKQIgNwMIIAMgBCgCCDYCHCADIAQoAgRBAXQ2AhggAyADKQIYNwMAAn8CQCADKAIQIgAoAgAi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ADYCSCABQUBrIgMgAigCDEEBdDYCACABIAA2AkwgASABKQJINwMYIAEgAigCEDYCRCABIAMpAgA3AxAgASACKAIINgI8IAEgAigCBEEBdDYCOCABIAEpAjg3AwggAigCFEEBdCEDIwBBIGsiACQAIAAgASkCGDcDGCAAIAEpAhA3AxAgACABKQIINwMIIAFBIGogAEEIaiADQQAQOSAAQSBqJAAgAiABKAIsNgIQIAIgASgCJDYCCCACIAEoAjA2AgAgAiABKAIoQQF2NgIMIAIgASgCIEEBdjYCBCABQdAAaiQAC6ABAQJ/IwBBMGsiASQAIAEjCSICKAIANgIoIAEgAigCDEEBdDYCICABIAA2AiwgASABKQIoNwMQIAEgAigCEDYCJCABIAEpAiA3AwggASACKAIINgIcIAEgAigCBEEBdDYCGCABIAEpAhg3AwACfyABKAIQKAIAIgBBAXEEQCAAQYD+A3FBCHYMAQsgAC8BKAtB//8DcSEAIAFBMGokACAAC5oBAQJ/IwBBMGsiASQAIAEjCSICKAIANgIoIAEgAigCDEEBdDYCICABIAA2AiwgASABKQIoNwMQIAEgAigCEDYCJCABIAEpAiA3AwggASACKAIINgIcIAEgAigCBEEBdDYCGCABIAEpAhg3AwBBACEAAkAgASgCECgCACICQQFxDQAgAigCJEUNACACKAIwIQALIAFBMGokACAAC5oBAQJ/IwBBMGsiASQAIAEjCSICKAIANgIoIAEgAigCDEEBdDYCICABIAA2AiwgASABKQIoNwMQIAEgAigCEDYCJCABIAEpAiA3AwggASACKAIINgIcIAEgAigCBEEBdDYCGCABIAEpAhg3AwBBACEAAkAgASgCECgCACICQQFxDQAgAigCJEUNACACKAI0IQALIAFBMGokACAAC/ABAQN/IwBB0ABrIgIkACACIwkiAygCADYCSCACQUBrIgQgAygCDEEBdDYCACACIAA2AkwgAiACKQJINwMYIAIgAygCEDYCRCACIAQpAgA3AxAgAiADKAIINgI8IAIgAygCBEEBdDYCOCACIAIpAjg3AwgjAEEgayIAJAAgACACKQIYNwMYIAAgAikCEDcDECAAIAIpAgg3AwggAkEgaiAAQQhqIAFBARA0IABBIGokACADIAIoAiw2AhAgAyACKAIkNgIIIAMgAigCMDYCACADIAIoAihBAXY2AgwgAyACKAIgQQF2NgIEIAJB0ABqJAAL8AEBA38jAEHQAGsiAiQAIAIjCSIDKAIANgJIIAJBQGsiBCADKAIMQQF0NgIAIAIgADYCTCACIAIpAkg3AxggAiADKAIQNgJEIAIgBCkCADcDECACIAMoAgg2AjwgAiADKAIEQQF0NgI4IAIgAikCODcDCCMAQSBrIgAkACAAIAIpAhg3AxggACACKQIQNwMQIAAgAikCCDcDCCACQSBqIABBCGogAUEAEDQgAEEgaiQAIAMgAigCLDYCECADIAIoAiQ2AgggAyACKAIwNgIAIAMgAigCKEEBdjYCDCADIAIoAiBBAXY2AgQgAkHQAGokAAvFAQEDfyMAQdAAayICJAAgAiMJIgMoAgA2AkggAkFAayIEIAMoAgxBAXQ2AgAgAiAANgJMIAIgAikCSDcDGCACIAMoAhA2AkQgAiAEKQIANwMQIAIgAygCCDYCPCACIAMoAgRBAXQ2AjggAiACKQI4NwMIIAJBIGogAkEIaiABQf//A3EQNSADIAIoAiw2AhAgAyACKAIkNgIIIAMgAigCMDYCACADIAIoAihBAXY2AgwgAyACKAIgQQF2NgIEIAJB0ABqJAAL7gEBA38jAEHQAGsiASQAIAEjCSICKAIANgJIIAFBQGsiAyACKAIMQQF0NgIAIAEgADYCTCABIAEpAkg3AxggASACKAIQNgJEIAEgAykCADcDECABIAIoAgg2AjwgASACKAIEQQF0NgI4IAEgASkCODcDCCMAQSBrIgAkACAAIAEpAhg3AxggACABKQIQNwMQIAAgASkCCDcDCCABQSBqIABBCGpBARA2IABBIGokACACIAEoAiw2AhAgAiABKAIkNgIIIAIgASgCMDYCACACIAEoAihBAXY2AgwgAiABKAIgQQF2NgIEIAFB0ABqJAAL7gEBA38jAEHQAGsiASQAIAEjCSICKAIANgJIIAFBQGsiAyACKAIMQQF0NgIAIAEgADYCTCABIAEpAkg3AxggASACKAIQNgJEIAEgAykCADcDECABIAIoAgg2AjwgASACKAIEQQF0NgI4IAEgASkCODcDCCMAQSBrIgAkACAAIAEpAhg3AxggACABKQIQNwMQIAAgASkCCDcDCCABQSBqIABBCGpBARA3IABBIGokACACIAEoAiw2AhAgAiABKAIkNgIIIAIgASgCMDYCACACIAEoAihBAXY2AgwgAiABKAIgQQF2NgIEIAFB0ABqJAAL7gEBA38jAEHQAGsiASQAIAEjCSICKAIANgJIIAFBQGsiAyACKAIMQQF0NgIAIAEgADYCTCABIAEpAkg3AxggASACKAIQNgJEIAEgAykCADcDECABIAIoAgg2AjwgASACKAIEQQF0NgI4IAEgASkCODcDCCMAQSBrIgAkACAAIAEpAhg3AxggACABKQIQNwMQIAAgASkCCDcDCCABQSBqIABBCGpBABA2IABBIGokACACIAEoAiw2AhAgAiABKAIkNgIIIAIgASgCMDYCACACIAEoAihBAXY2AgwgAiABKAIgQQF2NgIEIAFB0ABqJAAL7gEBA38jAEHQAGsiASQAIAEjCSICKAIANgJIIAFBQGsiAyACKAIMQQF0NgIAIAEgADYCTCABIAEpAkg3AxggASACKAIQNgJEIAEgAykCADcDECABIAIoAgg2AjwgASACKAIEQQF0NgI4IAEgASkCODcDCCMAQSBrIgAkACAAIAEpAhg3AxggACABKQIQNwMQIAAgASkCCDcDCCABQSBqIABBCGpBABA3IABBIGokACACIAEoAiw2AhAgAiABKAIkNgIIIAIgASgCMDYCACACIAEoAihBAXY2AgwgAiABKAIgQQF2NgIEIAFB0ABqJAALnQEBAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDAEEBIQACQCABKAIQKAIAIgJBAXENACACKAIkRQ0AIAIoAjhBAWohAAsgAUEwaiQAIAAL4AQCBn8CfiMAQdAAayIBJAAgASMJIgMoAgA2AkggAUFAayICIAMoAgxBAXQ2AgAgASAANgJMIAEgASkCSDcDGCABIAMoAhA2AkQgASACKQIANwMQIAEgAygCCDYCPCABIAMoAgRBAXQ2AjggASABKQI4NwMIIwBBkAFrIgAkAAJ/IAEoAhwiAigAACIEQQFxBEAgAi0ABUEPcSEFIAItAAQhBiACLQAGDAELIAQoAgwhBiAEKAIIIQUgBCgCBAshBCAAIAI2AowBIAAgAjYCiAEgAEEANgKEASAAIAY2AoABIAAgBTYCfCAAIAQ2AngCQCACIAEoAhgiBEcEQCAAIAApAoABNwNQIAAgACkCiAE3A1ggACAAKQJ4NwNIIAAgASkCEDcDOCAAQUBrIAEpAhg3AwAgACABKQIINwMwIABB4ABqIABByABqIABBMGoQMwJAIAAoAnAiAiAERg0AIAJFDQADQCAAIAApAnAiBzcDiAEgACAAKQJoIgg3A4ABIAAgCDcDICAAIAc3AyggACAAKQJgIgc3A3ggACAHNwMYIAAgASkCEDcDCCAAIAEpAhg3AxAgACABKQIINwMAIABB4ABqIABBGGogABAzIAAoAnAiAiAERg0BIAINAAsLIAEgACkDeDcCICABIAApA4gBNwIwIAEgACkDgAE3AigMAQsgAUIANwIgIAFCADcCMCABQgA3AigLIABBkAFqJAAgAyABKAIsNgIQIAMgASgCJDYCCCADIAEoAjA2AgAgAyABKAIoQQF2NgIMIAMgASgCIEEBdjYCBCABQdAAaiQAC58CAQN/IwBBgAFrIgEkACABIwkiAigCADYCeCABIAIoAgxBAXQ2AnAgASAANgJ8IAEgAigCCDYCbCABIAIoAhA2AnQgASACKAIEQQF0NgJoIAEgAigCFDYCYCABIAIoAhhBAXQ2AlAgASACKAIcNgJUIAEgAigCIEEBdDYCWCACKAIkIQMgASABKQJ4NwMwIAEgASkCcDcDKCABIAA2AmQgASABKQJoNwMgIAEgAzYCXCABIAEpAmA3AxggASABKQJYNwMQIAEgASkCUDcDCCABQThqIAFBIGogAUEIahAzIAIgASgCRDYCECACIAEoAjw2AgggAiABKAJINgIAIAIgASgCQEEBdjYCDCACIAEoAjhBAXY2AgQgAUGAAWokAAuGAgEEfyMAQdAAayIBJAAgASMJIgIoAgA2AkggAUFAayIDIAIoAgxBAXQ2AgAgASAANgJMIAEgASkCSDcDGCABIAIoAhA2AkQgASADKQIANwMQIAEgAigCCDYCPCABIAIoAgRBAXQ2AjggASABKQI4NwMIIAIoAhRBAXQhAyACKAIYQQF0IQQjAEEgayIAJAAgACABKQIYNwMYIAAgASkCEDcDECAAIAEpAgg3AwggAUEgaiAAQQhqIAMgBEEBEDogAEEgaiQAIAIgASgCLDYCECACIAEoAiQ2AgggAiABKAIwNgIAIAIgASgCKEEBdjYCDCACIAEoAiBBAXY2AgQgAUHQAGokAAuGAgEEfyMAQdAAayIBJAAgASMJIgIoAgA2AkggAUFAayIDIAIoAgxBAXQ2AgAgASAANgJMIAEgASkCSDcDGCABIAIoAhA2AkQgASADKQIANwMQIAEgAigCCDYCPCABIAIoAgRBAXQ2AjggASABKQI4NwMIIAIoAhRBAXQhAyACKAIYQQF0IQQjAEEgayIAJAAgACABKQIYNwMYIAAgASkCEDcDECAAIAEpAgg3AwggAUEgaiAAQQhqIAMgBEEAEDogAEEgaiQAIAIgASgCLDYCECACIAEoAiQ2AgggAiABKAIwNgIAIAIgASgCKEEBdjYCDCACIAEoAiBBAXY2AgQgAUHQAGokAAvXAgEGfyMAQfAAayIBJAAgASMJIgIoAgA2AmggASACKAIMQQF0NgJgIAEgADYCbCABIAIoAgg2AlwgASACKAIQNgJkIAEgAigCBEEBdDYCWCABIAIoAhhBAXQ2AlQgASACKAIUNgJQIAIoAiAhACACKAIcIQMgASABKQJoNwMoIAEgASkCYDcDICABIAM2AkggASABKQJYNwMYIAEgAEEBdDYCTCABIAEpAlA3AxAgASABKQJINwMIIwBBIGsiACQAIAEoAgwhAyABKAIIIQQgASgCFCEFIAEoAhAhBiAAIAEpAig3AxggACABKQIgNwMQIAAgASkCGDcDCCABQTBqIABBCGogBiAFIAQgA0EBEDsgAEEgaiQAIAIgASgCPDYCECACIAEoAjQ2AgggAiABKAJANgIAIAIgASgCOEEBdjYCDCACIAEoAjBBAXY2AgQgAUHwAGokAAvXAgEGfyMAQfAAayIBJAAgASMJIgIoAgA2AmggASACKAIMQQF0NgJgIAEgADYCbCABIAIoAgg2AlwgASACKAIQNgJkIAEgAigCBEEBdDYCWCABIAIoAhhBAXQ2AlQgASACKAIUNgJQIAIoAiAhACACKAIcIQMgASABKQJoNwMoIAEgASkCYDcDICABIAM2AkggASABKQJYNwMYIAEgAEEBdDYCTCABIAEpAlA3AxAgASABKQJINwMIIwBBIGsiACQAIAEoAgwhAyABKAIIIQQgASgCFCEFIAEoAhAhBiAAIAEpAig3AxggACABKQIgNwMQIAAgASkCGDcDCCABQTBqIABBCGogBiAFIAQgA0EAEDsgAEEgaiQAIAIgASgCPDYCECACIAEoAjQ2AgggAiABKAJANgIAIAIgASgCOEEBdjYCDCACIAEoAjBBAXY2AgQgAUHwAGokAAueAQECfyMAQUBqIgEkACABIwkiAigCADYCOCABIAIoAgxBAXQ2AjAgASAANgI8IAEgASkCODcDGCABIAIoAhA2AjQgASABKQIwNwMQIAEgAigCCDYCLCABIAIoAgRBAXQ2AiggASABKQIoNwMIIAEgASgCDDYCICABIAEoAhA2AiQgAiABKAIgNgIAIAIgASgCJEEBdjYCBCABQUBrJAALlgEBAn8jAEFAaiIBJAAgASMJIgIoAgA2AjggASACKAIMQQF0NgIwIAEgADYCPCABIAEpAjg3AxggASACKAIQNgI0IAEgASkCMDcDECABIAIoAgg2AiwgASACKAIEQQF0NgIoIAEgASkCKDcDCCABQSBqIAFBCGoQLiACIAEoAiA2AgAgAiABKAIkQQF2NgIEIAFBQGskAAt/AQJ/IwBBMGsiASQAIAEjCSICKAIANgIoIAEgAigCDEEBdDYCICABIAA2AiwgASABKQIoNwMQIAEgAigCEDYCJCABIAEpAiA3AwggASACKAIINgIcIAEgAigCBEEBdDYCGCABIAEpAhg3AwAgASgCACEAIAFBMGokACAAQQF2C34BAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDACABEC0hACABQTBqJAAgAEEBdgusAgIHfwF+IwBBMGsiASQAIAEjCSICKAIANgIoIAEgAigCDEEBdDYCICABIAA2AiwgASABKQIoNwMQIAEgAigCEDYCJCABIAEpAiA3AwggASACKAIINgIcIAEgAigCBEEBdDYCGCABIAEpAhg3AwAjAEEgayIAJAAgASgCFCgCCCECIAEoAhApAgAhCEEBIQMCQAJAAkAgAS8BDCIEQf7/A2sOAgACAQtBACEDDAELIAIoAkggBEEDbGotAAAhAwsgACAINwMQIAAgCDcDCCAAQQhqIABBH2pBASACQQAgBCADQQFxIgUjAUGhCmoiBhAwQQFqIgcjBSgCABEAACEDIAAgACkDEDcDACAAIAMgByACQQAgBCAFIAYQMBogAEEgaiQAIAFBMGokACADC9IDAQh/IwBBgAFrIgEkACABIwkiAigCADYCeCABIAIoAgxBAXQ2AnAgASAANgJ8IAEgASkCeDcDMCABIAIoAhA2AnQgASABKQJwNwMoIAEgAigCCDYCbCABIAIoAgRBAXQ2AmggASABKQJoNwMgQQAhAAJAIAEoAjAoAgAiAkEBcQ0AIAIoAiRFDQAgAigCMCEACwJAIAAiBEUEQEEAIQAMAQtBBCAEQQVsEI0CIQAgASABKQJ4NwMYIAEgASkCcDcDECABIAEpAmg3AwgjAUGw1QBqIgIgAUEIahBwIAIQgwEaIAFB0ABqIAIQiQEgASgCUCECIAEoAlghBSABKAJgIQMgASgCVCEGIAAgASgCXDYCECAAIAY2AgggACADNgIAIAAgBUEBdjYCDCAAIAJBAXY2AgQgBEEBRg0AQQEhBSAAIQIDQCMBQbDVAGoiAxCGARogAUE4aiADEIkBIAEoAjghAyABKAJAIQYgASgCSCEHIAEoAjwhCCACIAEoAkQ2AiQgAiAINgIcIAIgBzYCFCACIAZBAXY2AiAgAiADQQF2NgIYIAJBFGohAiAFQQFqIgUgBEcNAAsLIwkiAiAANgIEIAIgBDYCACABQYABaiQAC6QDAQh/IwBBgAFrIgEkACABIwkiAigCADYCeCABIAIoAgxBAXQ2AnAgASAANgJ8IAEgASkCeDcDSCABIAIoAhA2AnQgAUFAayABKQJwNwMAIAEgAigCCDYCbCABIAIoAgRBAXQ2AmggASABKQJoNwM4QQAhAAJAIAEoAkgoAgAiAkEBcQ0AIAIoAiRFDQAgAigCNCEACwJAIAAiA0UEQEEAIQIMAQtBBCADQQVsEI0CIQIgASABKQJ4NwMwIAEgASkCcDcDKCABIAEpAmg3AyAjAUGw1QBqIgAgAUEgahBwIAAQgwEaIAIhAANAIAFB0ABqIwFBsNUAahCJASABIAEpAmA3AxggASABKQJYNwMQIAEgASkCUDcDCCABQQhqEDEEQCABKAJQIQQgASgCWCEFIAEoAmAhBiABKAJUIQcgACABKAJcNgIQIAAgBzYCCCAAIAY2AgAgACAFQQF2NgIMIAAgBEEBdjYCBCAIQQFqIgggA0YNAiAAQRRqIQALIwFBsNUAahCGAQ0ACwsjCSIAIAI2AgQgACADNgIAIAFBgAFqJAAL/QYBCH8jAEGgAWsiByQAIAcjCSIIKAIANgKYASAHIAgoAgxBAXQ2ApABIAcgADYCnAEgByAHKQKYATcDWCAHIAgoAhA2ApQBIAcgBykCkAE3A1AgByAIKAIINgKMASAHIAgoAgRBAXQ2AogBIAcgBykCiAE3A0gjAUGw1QBqIgAgB0HIAGoQcCAHQfAAaiAAEIkBIAZBAXQiAEF/IAAgBXIiABshCyAFQX8gABshCSAEQQF0IQxBACEIQQAhBANAIAdBQGsgBykCgAE3AwAgByAHKQJ4NwM4IAcgBykCcDcDMCAHQegAaiAHQTBqEC4CQAJAIAMgBygCaCIATQRAIAAgA0cNASAHKAJsIAxLDQELQQAhBiMBQbDVAGoQhgEEQEEAIQUMAgsjAUGw1QBqEIgBIgZBAXMhBQwBCyAHIAcpAoABNwMoIAcgBykCeDcDICAHIAcpAnA3AxggByAHKAIcNgJgIAcgBygCIDYCZEEBIQVBACEGIAkgBygCYCIASQ0AIAAgCUYEQCALIAcoAmRNDQELIAcgBykCgAE3AxAgByAHKQJ4NwMIIAcgBykCcDcDACAHEC8hAAJAIAJFBEAgBCEADAELAkADQCABIAZBAnRqKAIAIgUgAEYNASAAIAVJBEAgBCEADAMLIAZBAWoiBiACRw0ACyAEIQAMAQsCQCAEQQVqIgAgCk0NAEEIIApBAXQiBSAAIAAgBUkbIgUgBUEITRsiCkECdCEFIAgEQCAIIAUjBCgCABEBACEIDAELIAUjBSgCABEAACEICyAIIARBAnRqIgRCADcCACAEQQA2AhAgBEIANwIIIAcoAnAhBSAHKAJ4IQYgBygCgAEhDSAHKAJ0IQ4gCCAAQQJ0aiIEQQRrIAcoAnw2AgAgBEEMayAONgIAIARBFGsgDTYCACAEQQhrIAZBAXY2AgAgBEEQayAFQQF2NgIAC0EAIQYCQCMBQbDVAGoiBBCDAQ0AIAQQhgENACAEEIgBIgZBAXMhBSAAIQQMAQsgACEEQQAhBQsCQCAFDQAgB0HwAGojAUGw1QBqIgAQiQEgBkUNASAAEIYBIgZFBEAgABCIAUUNAQsDQCAHQfAAaiMBQbDVAGoiABCJASAGQQFxDQIgABCGASIGDQAgABCIAQ0ACwsLIwkiACAINgIEIAAgBEEFbjYCACAHQaABaiQAC3sBAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDACABEDEhACABQTBqJAAgAAufAQECfyMAQTBrIgEkACABIwkiAigCADYCKCABIAIoAgxBAXQ2AiAgASAANgIsIAEgASkCKDcDECABIAIoAhA2AiQgASABKQIgNwMIIAEgAigCCDYCHCABIAIoAgRBAXQ2AhggASABKQIYNwMAAn8gASgCECgCACIAQQFxBEAgAEEEdkEBcQwBCyAALwEsQQV2QQFxCyEAIAFBMGokACAAC64BAQJ/IwBBMGsiASQAIAEjCSICKAIANgIoIAEgAigCDEEBdDYCICABIAA2AiwgASABKQIoNwMQIAEgAigCEDYCJCABIAEpAiA3AwggASACKAIINgIcIAEgAigCBEEBdDYCGCABIAEpAhg3AwACfyABKAIQKAIAIgBBAXEEQCAAQRp0QR91QeIEcQwBC0HiBCAALQAtQQJxDQAaIAAoAiALQQBHIQAgAUEwaiQAIAAL4gEBAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDAAJ/AkAgASgCDCIAQf//A3FFBEAgASgCECgCACIAQQFxBEAgAEGA/gNxQQh2IQAMAgsgAC8BKCEACyAAQf//A3FB//8DRw0AQQEMAQsgASgCFCgCCCgCTCAAQf//A3FBAXRqLwEAQf//A0YLIQAgAUEwaiQAIAALnwEBAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDAAJ/IAEoAhAoAgAiAEEBcQRAIABBBXZBAXEMAQsgAC8BLEEJdkEBcQshACABQTBqJAAgAAufAQECfyMAQTBrIgEkACABIwkiAigCADYCKCABIAIoAgxBAXQ2AiAgASAANgIsIAEgASkCKDcDECABIAIoAhA2AiQgASABKQIgNwMIIAEgAigCCDYCHCABIAIoAgRBAXQ2AhggASABKQIYNwMAAn8gASgCECgCACIAQQFxBEAgAEEDdkEBcQwBCyAALwEsQQJ2QQFxCyEAIAFBMGokACAAC3sBAn8jAEEwayIBJAAgASMJIgIoAgA2AiggASACKAIMQQF0NgIgIAEgADYCLCABIAEpAig3AxAgASACKAIQNgIkIAEgASkCIDcDCCABIAIoAgg2AhwgASACKAIEQQF0NgIYIAEgASkCGDcDACABEDIhACABQTBqJAAgAAvdAQEDfyMAQTBrIgEkACABIwkiAigCADYCKCABIAIoAgxBAXQ2AiAgASAANgIsIAEgASkCKDcDECABIAIoAhA2AiQgASABKQIgNwMIIAEgAigCCDYCHCABIAIoAgRBAXQ2AhggASABKQIYNwMAIAEoAhQoAgghAwJ/An8gASgCECgCACIAQQFxBEBB//8DIABBEHYiAkH//wNGDQIaIABBgP4DcUEIdgwBC0H//wMgAC8BKiICQf//A0YNARogAC8BKAshACADIAIgAEH//wNxEBkLIQAgAUEwaiQAIAALwAYBA38jAEHwAGsiCyQAIwFBxNUAaiINKAIAIgxFBEAgDRBuIgw2AgALIAwgCEF/IAgbNgJIIAsjCSIMKAIANgJoIAsgDCgCDEEBdDYCYCALIAwoAgg2AlwgCyABNgJsIAsgDCgCEDYCZCALIAwoAgRBAXQ2AlggCyADQQF0NgJUIAsgAjYCUCALIAVBAXQ2AkwgCyAENgJIIwEiAkHE1QBqIgMoAgAhASALIAspAlA3AyggCyALKQJINwMgIAEgC0EoaiALQSBqEHEgAygCACEBIAdBfyAHGyIEIAZPBEAgASAENgJcIAEgBjYCWAsgAygCACAINgJIIAMoAgAgCTYCVCADKAIAIAqtNwOIASALIAspAmA3AxAgCyALKQJoNwMYIAsgAkHY0wBqKQMANwNAIAsgCykCWDcDCCADKAIAIQIjAEEgayIBJAAgASALKQIYNwMYIAEgCykCEDcDECABIAspAgg3AwggAiAAIAFBCGoQbyALQUBrIgAEQCACIAA2ApABIAAoAgAhACACQQA2ApgBIAIgADYClAELIAFBIGokAEEAIQJBACEBIAMoAgAgC0E0ahByBEBBACEKQQAhAEEAIQwDQAJAIAxBAmoiBiALLwE6QQZsaiIDIABNDQBBCCAAQQF0IgAgAyAAIANLGyIAIABBCE0bIgBBAnQhAyACBEAgAiADIwQoAgARAQAhAgwBCyADIwUoAgARAAAhAgtBACEJIAsvATpBGGxBCGoiAwRAIAIgDEECdGpBACAD/AsACyALLwE4IQMgAiAKQQJ0aiIEIAsvAToiBTYCBCAEIAM2AgAgCkECaiEKIAUEQANAIAIgCkECdGoiAyALKAI8IAlBHGxqIgQoAhg2AgAgBCgAACEHIAQoAAghCCAEKAAQIQwgBCgABCENIAMgBCgADDYCFCADIA02AgwgAyAMNgIEIAMgCEEBdjYCECADIAdBAXY2AgggCkEGaiEKIAlBAWoiCSAFRw0ACwsgAUEBaiEBIAVBBmwgBmohDCMBQcTVAGooAgAgC0E0ahByDQALCyMJIgAjAUHE1QBqKAIALQCjATYCCCAAIAI2AgQgACABNgIAIAtB8ABqJAALCQAgACgCBBADC+AFAQN/IwBB4ABrIgskACMBQcTVAGoiDSgCACIMRQRAIA0QbiIMNgIACyAMIAg2AkggCyMJIgwoAgA2AlggCyAMKAIMQQF0NgJQIAsgDCgCCDYCTCALIAE2AlwgCyAMKAIQNgJUIAsgDCgCBEEBdDYCSCALIANBAXQ2AkQgCyACNgJAIAsgBUEBdDYCPCALIAQ2AjgjAUHE1QBqIgMoAgAhASALIAspAkA3AyAgCyALKQI4NwMYIAEgC0EgaiALQRhqEHEgAygCACEBIAdBfyAHGyICIAZPBEAgASACNgJcIAEgBjYCWAsgAygCACAINgJIIAMoAgAgCTYCVCADKAIAIAqtNwOIASALIAspAlA3AwggCyALKQJYNwMQIAsgCykCSDcDACADKAIAIAAgCxBvQQAhAkEAIQEgAygCACALQSxqIAtBKGoQegRAQQAhCkEAIQBBACEMA0ACQCAMQQNqIgYgCy8BMkEGbGoiAyAATQ0AQQggAEEBdCIAIAMgACADSxsiACAAQQhNGyIAQQJ0IQMgAgRAIAIgAyMEKAIAEQEAIQIMAQsgAyMFKAIAEQAAIQILQQAhCSALLwEyQRhsQQxqIgMEQCACIAxBAnRqQQAgA/wLAAsgCy8BMCEEIAIgCkECdGoiAyALLwEyIgU2AgQgAyAENgIAIAMgCygCKDYCCCAKQQNqIQogBQRAA0AgAiAKQQJ0aiIDIAsoAjQgCUEcbGoiBCgCGDYCACAEKAAAIQcgBCgACCEIIAQoABAhDCAEKAAEIQ0gAyAEKAAMNgIUIAMgDTYCDCADIAw2AgQgAyAIQQF2NgIQIAMgB0EBdjYCCCAKQQZqIQogCUEBaiIJIAVHDQALCyABQQFqIQEgBUEGbCAGaiEMIwFBxNUAaigCACALQSxqIAtBKGoQeg0ACwsjCSIAIwFBxNUAaigCAC0AowE2AgggACACNgIEIAAgATYCACALQeAAaiQACx8AIAAoAjwQBCIABH8jAUHI1QBqIAA2AgBBfwVBAAsLUgEBfyAAKAI8IQMjAEEQayIAJAAgAyABIAJB/wFxIABBCGoQCCICBH8jAUHI1QBqIAI2AgBBfwVBAAshAiAAKQMIIQEgAEEQaiQAQn8gASACGwv+AgEHfyMAQSBrIgMkACADIAAoAhwiBDYCECAAKAIUIQUgAyACNgIcIAMgATYCGCADIAUgBGsiATYCFCABIAJqIQVBAiEHAn8CQAJAAkAgACgCPCADQRBqIgFBAiADQQxqEAUiBAR/IwFByNUAaiAENgIAQX8FQQALBEAgASEEDAELA0AgBSADKAIMIgZGDQIgBkEASARAIAEhBAwECyABQQhBACAGIAEoAgQiCEsiCRtqIgQgBiAIQQAgCRtrIgggBCgCAGo2AgAgAUEMQQQgCRtqIgEgASgCACAIazYCACAFIAZrIQUgACgCPCAEIgEgByAJayIHIANBDGoQBSIGBH8jAUHI1QBqIAY2AgBBfwVBAAtFDQALCyAFQX9HDQELIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhAgAgwBCyAAQQA2AhwgAEIANwMQIAAgACgCAEEgcjYCAEEAIAdBAkYNABogAiAEKAIEawshACADQSBqJAAgAAsFABAGAAuDAQICfwJ+IwBBIGsiASQAQQFCASABQRhqEAciAgR/IwFByNUAaiACNgIAQX8FQQALBH9BfwUgASkDGCEDIAFBADYCFCABIANCgJTr3AOAIgQ3AwggASADIARCgJTr3AN+fT4CECAAIAEpAxA3AwggACABKQMINwMAQQALGiABQSBqJAAL8gICAn8BfgJAIAJFDQAgACABOgAAIAAgAmoiA0EBayABOgAAIAJBA0kNACAAIAE6AAIgACABOgABIANBA2sgAToAACADQQJrIAE6AAAgAkEHSQ0AIAAgAToAAyADQQRrIAE6AAAgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBBGsgATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQQhrIAE2AgAgAkEMayABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkEQayABNgIAIAJBFGsgATYCACACQRhrIAE2AgAgAkEcayABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQSBrIgJBH0sNAAsLIAALWQEBfyAAIAAoAkgiAUEBayABcjYCSCAAKAIAIgFBCHEEQCAAIAFBIHI2AgBBfw8LIABCADcCBCAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQQQALgQEBAn8jAEEQayICJAAgAiABOgAPAkACQCAAKAIQIgMEfyADBSAAEO8BDQIgACgCEAsgACgCFCIDRg0AIAAoAlAgAUH/AXFGDQAgACADQQFqNgIUIAMgAToAAAwBCyAAIAJBD2pBASAAKAIkEQQAQQFHDQAgAi0ADxoLIAJBEGokAAvSAQEDfwJAIAEoAkwiAkEATgRAIAJFDQEjAUGE1gBqKAIYIAJB/////wNxRw0BCwJAIABB/wFxIgMgASgCUEYNACABKAIUIgIgASgCEEYNACABIAJBAWo2AhQgAiAAOgAADwsgASADEPABDwsgAUHMAGoiAiACKAIAIgNB/////wMgAxs2AgACQAJAIABB/wFxIgQgASgCUEYNACABKAIUIgMgASgCEEYNACABIANBAWo2AhQgAyAAOgAADAELIAEgBBDwAQsgAigCABogAkEANgIAC4kEAQN/IAJBgARPBEAgAgRAIAAgASAC/AoAAAsgAA8LIAAgAmohAwJA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Y2VzcyB2ZXJzaW9uOiV1LCB2ZXJzaW9uX2NvdW50OiV1LCBzdGF0ZTolZCwgcm93OiV1LCBjb2w6JXUAcmVjb3Zlcl90b19wcmV2aW91cyBzdGF0ZToldSwgZGVwdGg6JXUALCBzaXplOiV1AHNoaWZ0IHN0YXRlOiV1AHJlY292ZXJfd2l0aF9taXNzaW5nIHN5bWJvbDolcywgc3RhdGU6JXUAZGlmZmVyZW50X2luY2x1ZGVkX3JhbmdlICV1IC0gJXUAYWNjZXB0AHBhcnNlX2FmdGVyX2VkaXQAXHQAYWJvcnRpbmcgcmVkdWNlIHdpdGggdG9vIG1hbnkgdmVyc2lvbnMAaGFzX2NoYW5nZXMAc3dpdGNoIGZyb21fa2V5d29yZDolcywgdG9fd29yZF90b2tlbjolcwBzdGF0ZV9taXNtYXRjaCBzeW06JXMAc2VsZWN0X3NtYWxsZXJfZXJyb3Igc3ltYm9sOiVzLCBvdmVyX3N5bWJvbDolcwBzZWxlY3RfZWFybGllciBzeW1ib2w6JXMsIG92ZXJfc3ltYm9sOiVzAHNlbGVjdF9leGlzdGluZyBzeW1ib2w6JXMsIG92ZXJfc3ltYm9sOiVzAGNhbnRfcmV1c2Vfbm9kZSBzeW1ib2w6JXMsIGZpcnN0X2xlYWZfc3ltYm9sOiVzAHNraXBfdG9rZW4gc3ltYm9sOiVzAGlnbm9yZV9lbXB0eV9leHRlcm5hbF90b2tlbiBzeW1ib2w6JXMAcmV1c2FibGVfbm9kZV9oYXNfZGlmZmVyZW50X2V4dGVybmFsX3NjYW5uZXJfc3RhdGUgc3ltYm9sOiVzAHJldXNlX25vZGUgc3ltYm9sOiVzAHBhc3RfcmV1c2FibGVfbm9kZSBzeW1ib2w6JXMAYmVmb3JlX3JldXNhYmxlX25vZGUgc3ltYm9sOiVzAGNhbnRfcmV1c2Vfbm9kZV8lcyB0cmVlOiVzAGJyZWFrZG93bl90b3Bfb2Zfc3RhY2sgdHJlZTolcwBkZXRlY3RfZXJyb3IgbG9va2FoZWFkOiVzACglcwBpc19lcnJvcgBza2lwX3VucmVjb2duaXplZF9jaGFyYWN0ZXIAbmFuAFxuAGlzX21pc3NpbmcAcmVzdW1lX3BhcnNpbmcAcmVjb3Zlcl9lb2YAaW5mAG5ld19wYXJzZQBjb25kZW5zZQBkb25lAGlzX2ZyYWdpbGUAY29udGFpbnNfZGlmZmVyZW50X2luY2x1ZGVkX3JhbmdlAHNraXAgY2hhcmFjdGVyOiVkAGNvbnN1bWUgY2hhcmFjdGVyOiVkAHNlbGVjdF9oaWdoZXJfcHJlY2VkZW5jZSBzeW1ib2w6JXMsIHByZWM6JWQsIG92ZXJfc3ltYm9sOiVzLCBvdGhlcl9wcmVjOiVkAHNoaWZ0X2V4dHJhAG5vX2xvb2thaGVhZF9hZnRlcl9ub25fdGVybWluYWxfZXh0cmEAX19ST09UX18AX0VSUk9SAE5BTgBNSVNTSU5HAElORgBJTlZBTElEAGxleGVkX2xvb2thaGVhZCBzeW06ACAwMDAwMDAwMDAwMDAQMDAALgAoJXMpAChudWxsKQAoTlVMTCkAKCIlcyIpACdcdCcAJ1xyJwAnXG4nAHNraXAgY2hhcmFjdGVyOiclYycAY29uc3VtZSBjaGFyYWN0ZXI6JyVjJwAnXDAnACIlcyIAKE1JU1NJTkcgAChVTkVYUEVDVEVEIAAlczogAAoKAAAAAAAAAAAAAAABAAAAAAAAAAAAAAD//////////wAAAAD/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHg8PDwAAAAAAAAAAAQAAAAEAAAACAAAAAQAAAAIAAAAAAAAAAAAAABIRExQVFhcYGRobHB0eHyAhESIjJBElJicoKSorLBEtLi8QEDAQEBAQEBAQMTIzEDQ1EBARERERERERERERERERERERERERERERERERNhERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERETcREREROBE5Ojs8PT4RERERERERERERERERERERERERERERERERERERERERERERERERERERERERPxAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBFAQRFCQ0RFRkdISUoRS0xNTk9QURBSU1RVVldYWVpbXF0QXl9gEBEREWFiYxAQEBAQEBAQEBARERERZBAQEBAQEBAQEBAQEBAQEBERZRAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBERZmcQEGhpERERERERERERERERERERERERERERERFqERFrEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBFsbRAQEBAQEBAQEG4QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEG9wcXIQEBAQEBAQEHN0dRAQEBAQdncQEBAQeBAQeRAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////wAAAAAAAAAA/v//B/7//wcAAAAAAAQgBP//f////3//////////////////////////////////w/8DAB9QAAAAAAAAAAAAACAAAAAAAN+8QNf///v///////////+///////////////////////8D/P///////////////////////////v///38C//////8BAAAAAP+/tgD///+HBwAAAP8H//////////7/w////////////////+8f/uH/nwAA////////AOD///////////////8DAP//////BzAE/////P8fAAD///8B/wcAAAAAAAD//98/AADw//gD////////////7//f4f/P//7/75/5///9xeOfWYCwz/8DEO6H+f///W3DhxkCXsD/PwDuv/v///3t478bAQDP/wAe7p/5///97eOfGcCwz/8CAOzHPdYYx//Dxx2BAMD/AADv3/3///3/498dYAfP/wAA79/9///97+PfHWBAz/8GAO/f/f/////n313wgM//APzs/3/8///7L3+AX//A/wwA/v////9//wc/IP8DAAAAANb3//+v//87XyD/8wAAAAABAAAA/wMAAP/+////H/7/A////v///x8AAAAAAAAAAP///////3/5/wP///////////8//////78g///////3////////////PX89//////89/////z1/Pf9//////////z3//////////wcAAAAA//8AAP////////////8/P/7//////////////////////////////////////////////////////////5////7//wf////////////H/wH/3w8A//8PAP//DwD/3w0A////////z///AYAQ/wMAAAAA/wP//////////////wH//////wf//////////z8A////f/8P/wHA/////z8fAP//////D////wP/AwAAAAD///8P/////////3/+/x8A/wP/A4AAAAAAAAAAAAAAAP///////+//7w//AwAAAAD///////P///////+//wMA////////fwD/4///////P/8B///////nAAAAAADebwT///////////////////////////////8AAAAAgP8fAP//Pz//////Pz//qv///z/////////fX9wfzw//H9wfAAAAAAAAAAAAAAAAAAACgAAA/x8AAAAAAAAAAAAAAACE/C8+UL3/8+BDAAD//////wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA////////AwAA//////9///////9//////////////////////x94DAD/////vyD/////////gAAA//9/AH9/f39/f39//////wAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAP4DPh/+////////////f+D+//////////////fg///////+/////////////38AAP///wcAAAAAAAD///////////////////////////////8/AAAAAAAAAAAA////////////////////////////////////////AAD//////////////////////x8AAAAAAAAAAP//////P/8f////DwAA//////9/8I///////////////////wAAAACA//z////////////////5////////fAAAAAAAgP+//////wAAAP///////w8A//////////8vAP8DAAD86P//////B/////8HAP///x/////////3/wCA/wP///9/////////fwD/P/8D//9//P////////9/BQAAOP//PAB+fn4Af3////////f/AP///////////////////wf/A///////////////////////////DwD//3/4//////8P/////////////////z//////////////////AwAAAAB/APjg//1/X9v/////////////////AwAAAPj///////////////8/AAD///////////z///////8AAAAAAP8PAAAAAAAAAAAAAAAAAADf/////////////////////x8AAP8D/v//B/7//wfA/////////////3/8/PwcAAAAAP/v//9///+3/z//PwAAAAD///////////////////8HAAAAAAAAAAD///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////H////////wEAAAAAAP////8A4P///wf//////wf///8//////w//PgAAAAAA/////////////////////////z//A/////8P/////w///////wD///////8PAAAAAAAAAAAAAAAAAAAAAAAAAP///////38A//8/AP8AAAAAAAAAAAAAAAAAAAAAAAAAP/3/////v5H//z8A//9/AP///38AAAAAAAAAAP//NwD//z8A////AwAAAAAAAAAA/////////8AAAAAAAAAAAG/w7/7//z8AAAAAAP///x////8fAAAAAP/+//8fAAAA////////PwD//z8A//8HAP//AwAAAAAAAAAAAAAAAAD///////////8BAAAAAAAA////////BwD///////8HAP//////AP8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////H4AA//8/AAAAAAAAAAAAAAAAAAAAAAAAAP//fwD//////////z8AAADA/wAA/P///////wEAAP///wH/A////////8f/cAD/////RwD//////////x4A/xcAAAAA///7////n0AAAAAAAAAAAH+9/7//Af////////8B/wPvn/n///3t458ZgeAPAAAAAAAAAAAAAAAAAAAAAAAAAP//////////uwf/gwAAAAD//////////7MA/wMAAAAAAAAAAAAAAAAAAAAAAAAAAP///////z9/AAAAPwAAAAD/////////fxEA/wMAAAAA////////PwH/AwAAAAAAAP///+f/B/8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wEAAAAAAAAAAAAAAAD///////////8DAIAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8///////8GgAAAP///////+d/AAD///////////8gAAAAAP////////8B//3/////f38BAP8DAAD8/////P///n8AAAAAAAAAAAB/+/////9/tMsA/wO//f///397Af8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//38A/////////////////////////wMAAAAAAAAAAAAAAAD/////////////////fwAA////////////////////////////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8B////f/8DAAAAAAAAAAAAAAAA////PwAA////////AAAPAP8D+P//4P//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAP///////////4f/////////gP//AAAAAAAAAAALAAAA/////////////////////////////////////////wD///////////////////////////////////////8HAP///38AAAAAAAAHAPAA/////////////////////////////////////////////////////////////////w//////////////////B/8f/wH/QwAAAAAAAAAAAAAAAP/////////////f///////////fZN7/6+//////////v+ff3////3tf/P3//////////////////////////////////////////////////////z/////9///3////9///3////9///3////9//////f////3///fP////////f///+dsHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////x+AP/9DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////D/8D////////////////////////////////HwAAAAAAAAD//////////48I/wMAAAAAAAAAAAAAAAAAAAAAAAAAAO////+W/vcKhOqWqpb3917/+/8P7vv/DwAAAAAAAAAAAAAAAAAA////A////wP///8DAAAAAAAAAAAAAAAAAAAgAAAACQAAAAoAAAANAAAACwAAAAwAAACFAAAAACAAAAEgAAACIAAAAyAAAAQgAAAFIAAA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awMjdHJlZV9zaXR0ZXJfcXVlcnlfcHJvZ3Jlc3NfY2FsbGJhY2sED19fd2FzaV9mZF9jbG9zZQUPX193YXNpX2ZkX3dyaXRlBglfYWJvcnRfanMHFV9fd2FzaV9jbG9ja190aW1lX2dldAgOX193YXNpX2ZkX3NlZWsJFmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAKEV9fd2FzbV9jYWxsX2N0b3JzCxhfX3dhc21fYXBwbHlfZGF0YV9yZWxvY3MMDF9fd2FzbV9zdGFydA0RdHNfbWFsbG9jX2RlZmF1bHQOEXRzX2NhbGxvY19kZWZhdWx0DxJ0c19yZWFsbG9jX2RlZmF1bHQQIXRzX3JhbmdlX2FycmF5X2dldF9jaGFuZ2VkX3JhbmdlcxEQaXRlcmF0b3JfZGVzY2VuZBIQaXRlcmF0b3JfYWR2YW5jZRMYdHNfbGFuZ3VhZ2Vfc3ltYm9sX2NvdW50FBd0c19sYW5ndWFnZV9zdGF0ZV9jb3VudBUTdHNfbGFuZ3VhZ2VfdmVyc2lvbhYUdHNfbGFuZ3VhZ2VfbWV0YWRhdGEXEHRzX2xhbmd1YWdlX25hbWUYF3RzX2xhbmd1YWdlX2ZpZWxkX2NvdW50GRZ0c19sYW5ndWFnZV9uZXh0X3N0YXRlGhd0c19sYW5ndWFnZV9zeW1ib2xfbmFtZRsbdHNfbGFuZ3VhZ2Vfc3ltYm9sX2Zvcl9uYW1lHBd0c19sYW5ndWFnZV9zeW1ib2xfdHlwZR0ddHNfbGFuZ3VhZ2VfZmllbGRfbmFtZV9mb3JfaWQeHXRzX2xhbmd1YWdlX2ZpZWxkX2lkX2Zvcl9uYW1lHxl0c19sb29rYWhlYWRfaXRlcmF0b3JfbmV3IBx0c19sb29rYWhlYWRfaXRlcmF0b3JfZGVsZXRlISF0c19sb29rYWhlYWRfaXRlcmF0b3JfcmVzZXRfc3RhdGUiG3RzX2xvb2thaGVhZF9pdGVyYXRvcl9yZXNldCMadHNfbG9va2FoZWFkX2l0ZXJhdG9yX25leHQkJHRzX2xvb2thaGVhZF9pdGVyYXRvcl9jdXJyZW50X3N5bWJvbCUNdHNfbGV4ZXJfX2xvZyYNdHNfbGV4ZXJfX2VvZickdHNfbGV4ZXJfX2lzX2F0X2luY2x1ZGVkX3JhbmdlX3N0YXJ0KBR0c19sZXhlcl9fZ2V0X2NvbHVtbikSdHNfbGV4ZXJfX21hcmtfZW5kKhF0c19sZXhlcl9fYWR2YW5jZSsUdHNfbGV4ZXJfX2RvX2FkdmFuY2UsDnRzX2xleGVyX3N0YXJ0LRB0c19ub2RlX2VuZF9ieXRlLhF0c19ub2RlX2VuZF9wb2ludC8OdHNfbm9kZV9zeW1ib2wwG3RzX3N1YnRyZWVfX3dyaXRlX3RvX3N0cmluZzEQdHNfbm9kZV9pc19uYW1lZDITdHNfbm9kZV9wYXJzZV9zdGF0ZTMddHNfbm9kZV9jaGlsZF93aXRoX2Rlc2NlbmRhbnQ0DnRzX25vZGVfX2NoaWxkNRl0c19ub2RlX2NoaWxkX2J5X2ZpZWxkX2lkNhV0c19ub2RlX19uZXh0X3NpYmxpbmc3FXRzX25vZGVfX3ByZXZfc2libGluZzgodHNfc3VidHJlZV9oYXNfdHJhaWxpbmdfZW1wdHlfZGVzY2VuZGFudDkddHNfbm9kZV9fZmlyc3RfY2hpbGRfZm9yX2J5dGU6InRzX25vZGVfX2Rlc2NlbmRhbnRfZm9yX2J5dGVfcmFuZ2U7I3RzX25vZGVfX2Rlc2NlbmRhbnRfZm9yX3BvaW50X3JhbmdlPBJ0c19zdWJ0cmVlX3JlbGVhc2U9DnRzX3N0YWNrX2NsZWFyPhB0c19wYXJzZXJfZGVsZXRlPw90c19wYXJzZXJfcmVzZXRAFnRzX3BhcnNlcl9zZXRfbGFuZ3VhZ2VBEnN0YWNrX25vZGVfcmVsZWFzZUIYdHNfcGFyc2VyX3RpbWVvdXRfbWljcm9zQxx0c19wYXJzZXJfc2V0X3RpbWVvdXRfbWljcm9zRB10c19wYXJzZXJfc2V0X2luY2x1ZGVkX3Jhbmdlc0UbdHNfc3VidHJlZV9fcHJpbnRfZG90X2dyYXBoRhh0c19zdGFja19wcmludF9kb3RfZ3JhcGhHF3RzX3N0YWNrX3JlbW92ZV92ZXJzaW9uSBNzdGFja19ub2RlX2FkZF9saW5rSSZ0c19wYXJzZXJfX2RvX2FsbF9wb3RlbnRpYWxfcmVkdWN0aW9uc0oYc3VtbWFyaXplX3N0YWNrX2NhbGxiYWNrSwtzdGFja19faXRlckwedHNfcGFyc2VyX19icmVha2Rvd25fbG9va2FoZWFkTRJ0c19wYXJzZXJfX3JlY292ZXJOH3RzX3BhcnNlcl9fY2FuX3JldXNlX2ZpcnN0X2xlYWZPFXJldXNhYmxlX25vZGVfYWR2YW5jZVAhdHNfcGFyc2VyX19icmVha2Rvd25fdG9wX29mX3N0YWNrURF0c19wYXJzZXJfX2FjY2VwdFIRdHNfcGFyc2VyX19yZWR1Y2VTGXRzX3N0YWNrX3JlbnVtYmVyX3ZlcnNpb25UDXRzX3N0YWNrX3B1c2hVDHRzX3F1ZXJ5X25ld1YOc3RyZWFtX2FkdmFuY2VXFnN0cmVhbV9za2lwX3doaXRlc3BhY2VYF3RzX3F1ZXJ5X19wYXJzZV9wYXR0ZXJuWRp0c19xdWVyeV9fcGVyZm9ybV9hbmFseXNpc1oPdHNfcXVlcnlfZGVsZXRlWwxfYXJyYXlfX2dyb3dcFnN0cmVhbV9zY2FuX2lkZW50aWZpZXJdG2NhcHR1cmVfcXVhbnRpZmllcnNfYWRkX2FsbF4edHNfcXVlcnlfX3BhcnNlX3N0cmluZ19saXRlcmFsXxhzeW1ib2xfdGFibGVfaW5zZXJ0X25hbWVgFnRzX3F1ZXJ5X3BhdHRlcm5fY291bnRhFnRzX3F1ZXJ5X2NhcHR1cmVfY291bnRiFXRzX3F1ZXJ5X3N0cmluZ19jb3VudGMcdHNfcXVlcnlfY2FwdHVyZV9uYW1lX2Zvcl9pZGQidHNfcXVlcnlfY2FwdHVyZV9xdWFudGlmaWVyX2Zvcl9pZGUcdHNfcXVlcnlfc3RyaW5nX3ZhbHVlX2Zvcl9pZGYfdHNfcXVlcnlfcHJlZGljYXRlc19mb3JfcGF0dGVybmcfdHNfcXVlcnlfc3RhcnRfYnl0ZV9mb3JfcGF0dGVybmgddHNfcXVlcnlfZW5kX2J5dGVfZm9yX3BhdHRlcm5pGnRzX3F1ZXJ5X2lzX3BhdHRlcm5fcm9vdGVkah10c19xdWVyeV9pc19wYXR0ZXJuX25vbl9sb2NhbGsmdHNfcXVlcnlfaXNfcGF0dGVybl9ndWFyYW50ZWVkX2F0X3N0ZXBsGHRzX3F1ZXJ5X2Rpc2FibGVfY2FwdHVyZW0YdHNfcXVlcnlfZGlzYWJsZV9wYXR0ZXJubhN0c19xdWVyeV9jdXJzb3JfbmV3bxR0c19xdWVyeV9jdXJzb3JfZXhlY3AUdHNfdHJlZV9jdXJzb3JfcmVzZXRxH3RzX3F1ZXJ5X2N1cnNvcl9zZXRfcG9pbnRfcmFuZ2VyGnRzX3F1ZXJ5X2N1cnNvcl9uZXh0X21hdGNocxh0c19xdWVyeV9jdXJzb3JfX2FkdmFuY2V0GnRzX3F1ZXJ5X2N1cnNvcl9fYWRkX3N0YXRldRh0c19xdWVyeV9jdXJzb3JfX2NhcHR1cmV2KnRzX3F1ZXJ5X2N1cnNvcl9fZmlyc3RfaW5fcHJvZ3Jlc3NfY2FwdHVyZXcodHNfdHJlZV9jdXJzb3JfZ290b19maXJzdF9jaGlsZF9pbnRlcm5hbHgidHNfdHJlZV9jdXJzb3JfY2hpbGRfaXRlcmF0b3JfbmV4dHkkdHNfdHJlZV9jdXJzb3JfZ290b19zaWJsaW5nX2ludGVybmFsehx0c19xdWVyeV9jdXJzb3JfbmV4dF9jYXB0dXJlexJwb3BfY291bnRfY2FsbGJhY2t8FHBvcF9wZW5kaW5nX2NhbGxiYWNrfRJwb3BfZXJyb3JfY2FsbGJhY2t+EHBvcF9hbGxfY2FsbGJhY2t/J3RzX3N1YnRyZWVfYXJyYXlfcmVtb3ZlX3RyYWlsaW5nX2V4dHJhc4ABHXRzX3N1YnRyZWVfc3VtbWFyaXplX2NoaWxkcmVugQETdHNfc3VidHJlZV9uZXdfbm9kZYIBEnRzX3RyZWVfY3Vyc29yX25ld4MBH3RzX3RyZWVfY3Vyc29yX2dvdG9fZmlyc3RfY2hpbGSEASd0c190cmVlX2N1cnNvcl9nb3RvX2xhc3RfY2hpbGRfaW50ZXJuYWyFATJ0c190cmVlX2N1cnNvcl9nb3RvX2ZpcnN0X2NoaWxkX2Zvcl9ieXRlX2FuZF9wb2ludIYBIHRzX3RyZWVfY3Vyc29yX2dvdG9fbmV4dF9zaWJsaW5nhwEmdHNfdHJlZV9jdXJzb3JfY2hpbGRfaXRlcmF0b3JfcHJldmlvdXOIARp0c190cmVlX2N1cnNvcl9nb3RvX3BhcmVudIkBG3RzX3RyZWVfY3Vyc29yX2N1cnJlbnRfbm9kZYoBH3RzX3RyZWVfY3Vyc29yX2N1cnJlbnRfZmllbGRfaWSLAQx0c190cmVlX2NvcHmMAQ50c190cmVlX2RlbGV0ZY0BDnRzX2RlY29kZV91dGY4jgESdHNfZGVjb2RlX3V0ZjE2X2xljwESdHNfZGVjb2RlX3V0ZjE2X2JlkAEWdHNfcGFyc2VyX19zZWxlY3RfdHJlZZEBIHRzX3BhcnNlcl9fYmV0dGVyX3ZlcnNpb25fZXhpc3RzkgEhYW5hbHlzaXNfc3RhdGVfc2V0X19pbnNlcnRfc29ydGVkkwEjdHNfcXVlcnlfY3Vyc29yX19wcmVwYXJlX3RvX2NhcHR1cmWUAQd0c19pbml0lQESdHNfcGFyc2VyX25ld193YXNtlgEcdHNfcGFyc2VyX2VuYWJsZV9sb2dnZXJfd2FzbZcBEWNhbGxfbG9nX2NhbGxiYWNrmAEUdHNfcGFyc2VyX3BhcnNlX3dhc22ZARNjYWxsX3BhcnNlX2NhbGxiYWNrmgERcHJvZ3Jlc3NfY2FsbGJhY2ubAR50c19wYXJzZXJfaW5jbHVkZWRfcmFuZ2VzX3dhc22cAR50c19sYW5ndWFnZV90eXBlX2lzX25hbWVkX3dhc22dASB0c19sYW5ndWFnZV90eXBlX2lzX3Zpc2libGVfd2FzbZ4BG3RzX2xhbmd1YWdlX3N1cGVydHlwZXNfd2FzbZ8BGXRzX2xhbmd1YWdlX3N1YnR5cGVzX3dhc22gARZ0c190cmVlX3Jvb3Rfbm9kZV93YXNtoQEidHNfdHJlZV9yb290X25vZGVfd2l0aF9vZmZzZXRfd2FzbaIBEXRzX3RyZWVfZWRpdF93YXNtowEcdHNfdHJlZV9pbmNsdWRlZF9yYW5nZXNfd2FzbaQBH3RzX3RyZWVfZ2V0X2NoYW5nZWRfcmFuZ2VzX3dhc22lARd0c190cmVlX2N1cnNvcl9uZXdfd2FzbaYBGHRzX3RyZWVfY3Vyc29yX2NvcHlfd2FzbacBGnRzX3RyZWVfY3Vyc29yX2RlbGV0ZV93YXNtqAEZdHNfdHJlZV9jdXJzb3JfcmVzZXRfd2FzbakBHHRzX3RyZWVfY3Vyc29yX3Jlc2V0X3RvX3dhc22qASR0c190cmVlX2N1cnNvcl9nb3RvX2ZpcnN0X2NoaWxkX3dhc22rASN0c190cmVlX2N1cnNvcl9nb3RvX2xhc3RfY2hpbGRfd2FzbawBLnRzX3RyZWVfY3Vyc29yX2dvdG9fZmlyc3RfY2hpbGRfZm9yX2luZGV4X3dhc22tATF0c190cmVlX2N1cnNvcl9nb3RvX2ZpcnN0X2NoaWxkX2Zvcl9wb3NpdGlvbl93YXNtrgEldHNfdHJlZV9jdXJzb3JfZ290b19uZXh0X3NpYmxpbmdfd2Fzba8BKXRzX3RyZWVfY3Vyc29yX2dvdG9fcHJldmlvdXNfc2libGluZ193YXNtsAEjdHNfdHJlZV9jdXJzb3JfZ290b19kZXNjZW5kYW50X3dhc22xAR90c190cmVlX2N1cnNvcl9nb3RvX3BhcmVudF93YXNtsgEodHNfdHJlZV9jdXJzb3JfY3VycmVudF9ub2RlX3R5cGVfaWRfd2FzbbMBKXRzX3RyZWVfY3Vyc29yX2N1cnJlbnRfbm9kZV9zdGF0ZV9pZF93YXNttAEpdHNfdHJlZV9jdXJzb3JfY3VycmVudF9ub2RlX2lzX25hbWVkX3dhc221ASt0c190cmVlX2N1cnNvcl9jdXJyZW50X25vZGVfaXNfbWlzc2luZ193YXNttgEjdHNfdHJlZV9jdXJzb3JfY3VycmVudF9ub2RlX2lkX3dhc223ASJ0c190cmVlX2N1cnNvcl9zdGFydF9wb3NpdGlvbl93YXNtuAEgdHNfdHJlZV9jdXJzb3JfZW5kX3Bvc2l0aW9uX3dhc225AR90c190cmVlX2N1cnNvcl9zdGFydF9pbmRleF93YXNtugEddHNfdHJlZV9jdXJzb3JfZW5kX2luZGV4X3dhc227ASR0c190cmVlX2N1cnNvcl9jdXJyZW50X2ZpZWxkX2lkX3dhc228ASF0c190cmVlX2N1cnNvcl9jdXJyZW50X2RlcHRoX3dhc229ASx0c190cmVlX2N1cnNvcl9jdXJyZW50X2Rlc2NlbmRhbnRfaW5kZXhfd2Fzbb4BIHRzX3RyZWVfY3Vyc29yX2N1cnJlbnRfbm9kZV93YXNtvwETdHNfbm9kZV9zeW1ib2xfd2FzbcABIXRzX25vZGVfZmllbGRfbmFtZV9mb3JfY2hpbGRfd2FzbcEBJ3RzX25vZGVfZmllbGRfbmFtZV9mb3JfbmFtZWRfY2hpbGRfd2FzbcIBIXRzX25vZGVfY2hpbGRyZW5fYnlfZmllbGRfaWRfd2FzbcMBIXRzX25vZGVfZmlyc3RfY2hpbGRfZm9yX2J5dGVfd2FzbcQBJ3RzX25vZGVfZmlyc3RfbmFtZWRfY2hpbGRfZm9yX2J5dGVfd2FzbcUBG3RzX25vZGVfZ3JhbW1hcl9zeW1ib2xfd2FzbcYBGHRzX25vZGVfY2hpbGRfY291bnRfd2FzbccBHnRzX25vZGVfbmFtZWRfY2hpbGRfY291bnRfd2FzbcgBEnRzX25vZGVfY2hpbGRfd2FzbckBGHRzX25vZGVfbmFtZWRfY2hpbGRfd2FzbcoBHnRzX25vZGVfY2hpbGRfYnlfZmllbGRfaWRfd2FzbcsBGXRzX25vZGVfbmV4dF9zaWJsaW5nX3dhc23MARl0c19ub2RlX3ByZXZfc2libGluZ193YXNtzQEfdHNfbm9kZV9uZXh0X25hbWVkX3NpYmxpbmdfd2Fzbc4BH3RzX25vZGVfcHJldl9uYW1lZF9zaWJsaW5nX3dhc23PAR10c19ub2RlX2Rlc2NlbmRhbnRfY291bnRfd2FzbdABE3RzX25vZGVfcGFyZW50X3dhc23RASJ0c19ub2RlX2NoaWxkX3dpdGhfZGVzY2VuZGFudF93YXNt0gEhdHNfbm9kZV9kZXNjZW5kYW50X2Zvcl9pbmRleF93YXNt0wEndHNfbm9kZV9uYW1lZF9kZXNjZW5kYW50X2Zvcl9pbmRleF93YXNt1AEkdHNfbm9kZV9kZXNjZW5kYW50X2Zvcl9wb3NpdGlvbl93YXNt1QEqdHNfbm9kZV9uYW1lZF9kZXNjZW5kYW50X2Zvcl9wb3NpdGlvbl93YXNt1gEYdHNfbm9kZV9zdGFydF9wb2ludF93YXNt1wEWdHNfbm9kZV9lbmRfcG9pbnRfd2FzbdgBGHRzX25vZGVfc3RhcnRfaW5kZXhfd2FzbdkBFnRzX25vZGVfZW5kX2luZGV4X3dhc23aARZ0c19ub2RlX3RvX3N0cmluZ193YXNt2wEVdHNfbm9kZV9jaGlsZHJlbl93YXNt3AEbdHNfbm9kZV9uYW1lZF9jaGlsZHJlbl93YXNt3QEgdHNfbm9kZV9kZXNjZW5kYW50c19vZl90eXBlX3dhc23eARV0c19ub2RlX2lzX25hbWVkX3dhc23fARh0c19ub2RlX2hhc19jaGFuZ2VzX3dhc23gARZ0c19ub2RlX2hhc19lcnJvcl93YXNt4QEVdHNfbm9kZV9pc19lcnJvcl93YXNt4gEXdHNfbm9kZV9pc19taXNzaW5nX3dhc23jARV0c19ub2RlX2lzX2V4dHJhX3dhc23kARh0c19ub2RlX3BhcnNlX3N0YXRlX3dhc23lAR10c19ub2RlX25leHRfcGFyc2Vfc3RhdGVfd2FzbeYBFXRzX3F1ZXJ5X21hdGNoZXNfd2FzbecBF3F1ZXJ5X3Byb2dyZXNzX2NhbGxiYWNr6AEWdHNfcXVlcnlfY2FwdHVyZXNfd2FzbekBDV9fc3RkaW9fY2xvc2XqAQxfX3N0ZGlvX3NlZWvrAQ1fX3N0ZGlvX3dyaXRl7AEFYWJvcnTtAQ9fX2Nsb2NrX2dldHRpbWXuAQhfX21lbXNldO8BCV9fdG93cml0ZfABCl9fb3ZlcmZsb3fxAQdkb19wdXRj8gEIX19tZW1jcHnzAQlfX2Z3cml0ZXj0AQZmd3JpdGX1AQhpc3dhbG51bfYBCGlzd2FscGhh9wEIaXN3c3BhY2X4AQZtZW1jbXD5AQhzbnByaW50ZvoBBnN0cmxlbvsBB3N0cm5jbXD8AQZtZW1jaHL9AQVmcmV4cP4BC3ByaW50Zl9jb3Jl/wEDb3V0gAIGZ2V0aW50gQIHcG9wX2FyZ4ICBWZtdF91gwIDcGFkhAIGZm10X2ZwhQITcG9wX2FyZ19sb25nX2RvdWJsZYYCCXZzbnByaW50ZocCCHNuX3dyaXRliAIGd2N0b21iiQIIZGxtYWxsb2OKAgZkbGZyZWWLAglkbHJlYWxsb2OMAg1kaXNwb3NlX2NodW5rjQIIZGxjYWxsb2OOAgRzYnJrjwIIc2V0VGhyZXeQAgh0b3dsb3dlcpECB2Nhc2VtYXCSAgh0b3d1cHBlcpMCCGlzd2RpZ2l0lAIZX2Vtc2NyaXB0ZW5fc3RhY2tfcmVzdG9yZZUCF19lbXNjcmlwdGVuX3N0YWNrX2FsbG9jlgIcZW1zY3JpcHRlbl9zdGFja19nZXRfY3VycmVudJcCCGlzd2xvd2VymAIIaXN3YmxhbmuZAgdzdHJuY2F0mgIIaXN3dXBwZXKbAgdtZW1tb3ZlnAIHc3RybmNweZ0CCWlzd3hkaWdpdJ4CBnN0cmNtcAfJAgwAD19fc3RhY2tfcG9pbnRlcgENX19tZW1vcnlfYmFzZQIMX190YWJsZV9iYXNlAwtfX2hlYXBfYmFzZQQkR09ULmRhdGEuaW50ZXJuYWwudHNfY3VycmVudF9yZWFsbG9jBSNHT1QuZGF0YS5pbnRlcm5hbC50c19jdXJyZW50X21hbGxvYwYhR09ULmRhdGEuaW50ZXJuYWwudHNfY3VycmVudF9mcmVlByNHT1QuZGF0YS5pbnRlcm5hbC50c19jdXJyZW50X2NhbGxvYwgYR09ULmRhdGEuaW50ZXJuYWwuc3RkZXJyCSFHT1QuZGF0YS5pbnRlcm5hbC5UUkFOU0ZFUl9CVUZGRVIKG0dPVC5kYXRhLmludGVybmFsLl9fVEhSRVdfXwseR09ULmRhdGEuaW50ZXJuYWwuX190aHJld1ZhbHVlCQgBAAUuZGF0YQAnEHNvdXJjZU1hcHBpbmdVUkwVLnRyZWUtc2l0dGVyLndhc20ubWFw", typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("mgs-lib.umd.js", document.baseURI).href).href;
      }
      __name(findWasmBinary, "findWasmBinary");
      function getBinarySync(file) {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(file);
        }
        throw "both async and sync fetching of the wasm failed";
      }
      __name(getBinarySync, "getBinarySync");
      async function getWasmBinary(binaryFile) {
        if (!wasmBinary) {
          try {
            var response = await readAsync(binaryFile);
            return new Uint8Array(response);
          } catch {
          }
        }
        return getBinarySync(binaryFile);
      }
      __name(getWasmBinary, "getWasmBinary");
      async function instantiateArrayBuffer(binaryFile, imports) {
        try {
          var binary2 = await getWasmBinary(binaryFile);
          var instance2 = await WebAssembly.instantiate(binary2, imports);
          return instance2;
        } catch (reason) {
          err(`failed to asynchronously prepare wasm: ${reason}`);
          abort(reason);
        }
      }
      __name(instantiateArrayBuffer, "instantiateArrayBuffer");
      async function instantiateAsync(binary2, binaryFile, imports) {
        if (!binary2 && typeof WebAssembly.instantiateStreaming == "function" && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
          try {
            var response = fetch(binaryFile, {
              credentials: "same-origin"
            });
            var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
            return instantiationResult;
          } catch (reason) {
            err(`wasm streaming compile failed: ${reason}`);
            err("falling back to ArrayBuffer instantiation");
          }
        }
        return instantiateArrayBuffer(binaryFile, imports);
      }
      __name(instantiateAsync, "instantiateAsync");
      function getWasmImports() {
        return {
          "env": wasmImports,
          "wasi_snapshot_preview1": wasmImports,
          "GOT.mem": new Proxy(wasmImports, GOTHandler),
          "GOT.func": new Proxy(wasmImports, GOTHandler)
        };
      }
      __name(getWasmImports, "getWasmImports");
      async function createWasm() {
        function receiveInstance(instance2, module2) {
          wasmExports = instance2.exports;
          wasmExports = relocateExports(wasmExports, 1024);
          var metadata2 = getDylinkMetadata(module2);
          if (metadata2.neededDynlibs) {
            dynamicLibraries = metadata2.neededDynlibs.concat(dynamicLibraries);
          }
          mergeLibSymbols(wasmExports, "main");
          LDSO.init();
          loadDylibs();
          __RELOC_FUNCS__.push(wasmExports["__wasm_apply_data_relocs"]);
          removeRunDependency();
          return wasmExports;
        }
        __name(receiveInstance, "receiveInstance");
        addRunDependency();
        function receiveInstantiationResult(result2) {
          return receiveInstance(result2["instance"], result2["module"]);
        }
        __name(receiveInstantiationResult, "receiveInstantiationResult");
        var info2 = getWasmImports();
        if (Module["instantiateWasm"]) {
          return new Promise((resolve, reject) => {
            Module["instantiateWasm"](info2, (mod, inst) => {
              receiveInstance(mod, inst);
              resolve(mod.exports);
            });
          });
        }
        wasmBinaryFile ?? (wasmBinaryFile = findWasmBinary());
        try {
          var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info2);
          var exports2 = receiveInstantiationResult(result);
          return exports2;
        } catch (e) {
          readyPromiseReject(e);
          return Promise.reject(e);
        }
      }
      __name(createWasm, "createWasm");
      const _ExitStatus = class _ExitStatus {
        constructor(status) {
          __publicField(this, "name", "ExitStatus");
          this.message = `Program terminated with exit(${status})`;
          this.status = status;
        }
      };
      __name(_ExitStatus, "ExitStatus");
      let ExitStatus = _ExitStatus;
      var GOT = {};
      var currentModuleWeakSymbols = /* @__PURE__ */ new Set([]);
      var GOTHandler = {
        get(obj, symName) {
          var rtn = GOT[symName];
          if (!rtn) {
            rtn = GOT[symName] = new WebAssembly.Global({
              "value": "i32",
              "mutable": true
            });
          }
          if (!currentModuleWeakSymbols.has(symName)) {
            rtn.required = true;
          }
          return rtn;
        }
      };
      var LE_HEAP_LOAD_F32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getFloat32(byteOffset, true), "LE_HEAP_LOAD_F32");
      var LE_HEAP_LOAD_F64 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getFloat64(byteOffset, true), "LE_HEAP_LOAD_F64");
      var LE_HEAP_LOAD_I16 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getInt16(byteOffset, true), "LE_HEAP_LOAD_I16");
      var LE_HEAP_LOAD_I32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getInt32(byteOffset, true), "LE_HEAP_LOAD_I32");
      var LE_HEAP_LOAD_U32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getUint32(byteOffset, true), "LE_HEAP_LOAD_U32");
      var LE_HEAP_STORE_F32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setFloat32(byteOffset, value, true), "LE_HEAP_STORE_F32");
      var LE_HEAP_STORE_F64 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setFloat64(byteOffset, value, true), "LE_HEAP_STORE_F64");
      var LE_HEAP_STORE_I16 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setInt16(byteOffset, value, true), "LE_HEAP_STORE_I16");
      var LE_HEAP_STORE_I32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setInt32(byteOffset, value, true), "LE_HEAP_STORE_I32");
      var LE_HEAP_STORE_U32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setUint32(byteOffset, value, true), "LE_HEAP_STORE_U32");
      var callRuntimeCallbacks = /* @__PURE__ */ __name((callbacks) => {
        while (callbacks.length > 0) {
          callbacks.shift()(Module);
        }
      }, "callRuntimeCallbacks");
      var onPostRuns = [];
      var addOnPostRun = /* @__PURE__ */ __name((cb) => onPostRuns.unshift(cb), "addOnPostRun");
      var onPreRuns = [];
      var addOnPreRun = /* @__PURE__ */ __name((cb) => onPreRuns.unshift(cb), "addOnPreRun");
      var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
      var UTF8ArrayToString = /* @__PURE__ */ __name((heapOrArray, idx = 0, maxBytesToRead = NaN) => {
        var endIdx = idx + maxBytesToRead;
        var endPtr = idx;
        while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
        if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
          return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
        }
        var str = "";
        while (idx < endPtr) {
          var u0 = heapOrArray[idx++];
          if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
          }
          var u1 = heapOrArray[idx++] & 63;
          if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
          }
          var u2 = heapOrArray[idx++] & 63;
          if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2;
          } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
          }
          if (u0 < 65536) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
          }
        }
        return str;
      }, "UTF8ArrayToString");
      var getDylinkMetadata = /* @__PURE__ */ __name((binary2) => {
        var offset = 0;
        var end = 0;
        function getU8() {
          return binary2[offset++];
        }
        __name(getU8, "getU8");
        function getLEB() {
          var ret = 0;
          var mul = 1;
          while (1) {
            var byte = binary2[offset++];
            ret += (byte & 127) * mul;
            mul *= 128;
            if (!(byte & 128)) break;
          }
          return ret;
        }
        __name(getLEB, "getLEB");
        function getString() {
          var len = getLEB();
          offset += len;
          return UTF8ArrayToString(binary2, offset - len, len);
        }
        __name(getString, "getString");
        function failIf(condition, message) {
          if (condition) throw new Error(message);
        }
        __name(failIf, "failIf");
        var name2 = "dylink.0";
        if (binary2 instanceof WebAssembly.Module) {
          var dylinkSection = WebAssembly.Module.customSections(binary2, name2);
          if (dylinkSection.length === 0) {
            name2 = "dylink";
            dylinkSection = WebAssembly.Module.customSections(binary2, name2);
          }
          failIf(dylinkSection.length === 0, "need dylink section");
          binary2 = new Uint8Array(dylinkSection[0]);
          end = binary2.length;
        } else {
          var int32View = new Uint32Array(new Uint8Array(binary2.subarray(0, 24)).buffer);
          var magicNumberFound = int32View[0] == 1836278016 || int32View[0] == 6386541;
          failIf(!magicNumberFound, "need to see wasm magic number");
          failIf(binary2[8] !== 0, "need the dylink section to be first");
          offset = 9;
          var section_size = getLEB();
          end = offset + section_size;
          name2 = getString();
        }
        var customSection = {
          neededDynlibs: [],
          tlsExports: /* @__PURE__ */ new Set(),
          weakImports: /* @__PURE__ */ new Set()
        };
        if (name2 == "dylink") {
          customSection.memorySize = getLEB();
          customSection.memoryAlign = getLEB();
          customSection.tableSize = getLEB();
          customSection.tableAlign = getLEB();
          var neededDynlibsCount = getLEB();
          for (var i2 = 0; i2 < neededDynlibsCount; ++i2) {
            var libname = getString();
            customSection.neededDynlibs.push(libname);
          }
        } else {
          failIf(name2 !== "dylink.0");
          var WASM_DYLINK_MEM_INFO = 1;
          var WASM_DYLINK_NEEDED = 2;
          var WASM_DYLINK_EXPORT_INFO = 3;
          var WASM_DYLINK_IMPORT_INFO = 4;
          var WASM_SYMBOL_TLS = 256;
          var WASM_SYMBOL_BINDING_MASK = 3;
          var WASM_SYMBOL_BINDING_WEAK = 1;
          while (offset < end) {
            var subsectionType = getU8();
            var subsectionSize = getLEB();
            if (subsectionType === WASM_DYLINK_MEM_INFO) {
              customSection.memorySize = getLEB();
              customSection.memoryAlign = getLEB();
              customSection.tableSize = getLEB();
              customSection.tableAlign = getLEB();
            } else if (subsectionType === WASM_DYLINK_NEEDED) {
              var neededDynlibsCount = getLEB();
              for (var i2 = 0; i2 < neededDynlibsCount; ++i2) {
                libname = getString();
                customSection.neededDynlibs.push(libname);
              }
            } else if (subsectionType === WASM_DYLINK_EXPORT_INFO) {
              var count = getLEB();
              while (count--) {
                var symname = getString();
                var flags2 = getLEB();
                if (flags2 & WASM_SYMBOL_TLS) {
                  customSection.tlsExports.add(symname);
                }
              }
            } else if (subsectionType === WASM_DYLINK_IMPORT_INFO) {
              var count = getLEB();
              while (count--) {
                getString();
                var symname = getString();
                var flags2 = getLEB();
                if ((flags2 & WASM_SYMBOL_BINDING_MASK) == WASM_SYMBOL_BINDING_WEAK) {
                  customSection.weakImports.add(symname);
                }
              }
            } else {
              offset += subsectionSize;
            }
          }
        }
        return customSection;
      }, "getDylinkMetadata");
      function getValue(ptr, type = "i8") {
        if (type.endsWith("*")) type = "*";
        switch (type) {
          case "i1":
            return HEAP8[ptr];
          case "i8":
            return HEAP8[ptr];
          case "i16":
            return LE_HEAP_LOAD_I16((ptr >> 1) * 2);
          case "i32":
            return LE_HEAP_LOAD_I32((ptr >> 2) * 4);
          case "i64":
            return HEAP64[ptr >> 3];
          case "float":
            return LE_HEAP_LOAD_F32((ptr >> 2) * 4);
          case "double":
            return LE_HEAP_LOAD_F64((ptr >> 3) * 8);
          case "*":
            return LE_HEAP_LOAD_U32((ptr >> 2) * 4);
          default:
            abort(`invalid type for getValue: ${type}`);
        }
      }
      __name(getValue, "getValue");
      var newDSO = /* @__PURE__ */ __name((name2, handle2, syms) => {
        var dso = {
          refcount: Infinity,
          name: name2,
          exports: syms,
          global: true
        };
        LDSO.loadedLibsByName[name2] = dso;
        if (handle2 != void 0) {
          LDSO.loadedLibsByHandle[handle2] = dso;
        }
        return dso;
      }, "newDSO");
      var LDSO = {
        loadedLibsByName: {},
        loadedLibsByHandle: {},
        init() {
          newDSO("__main__", 0, wasmImports);
        }
      };
      var ___heap_base = 78224;
      var alignMemory = /* @__PURE__ */ __name((size, alignment) => Math.ceil(size / alignment) * alignment, "alignMemory");
      var getMemory = /* @__PURE__ */ __name((size) => {
        if (runtimeInitialized) {
          return _calloc(size, 1);
        }
        var ret = ___heap_base;
        var end = ret + alignMemory(size, 16);
        ___heap_base = end;
        GOT["__heap_base"].value = end;
        return ret;
      }, "getMemory");
      var isInternalSym = /* @__PURE__ */ __name((symName) => ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm", "__start_em_js", "__stop_em_js"].includes(symName) || symName.startsWith("__em_js__"), "isInternalSym");
      var uleb128Encode = /* @__PURE__ */ __name((n, target) => {
        if (n < 128) {
          target.push(n);
        } else {
          target.push(n % 128 | 128, n >> 7);
        }
      }, "uleb128Encode");
      var sigToWasmTypes = /* @__PURE__ */ __name((sig) => {
        var typeNames = {
          "i": "i32",
          "j": "i64",
          "f": "f32",
          "d": "f64",
          "e": "externref",
          "p": "i32"
        };
        var type = {
          parameters: [],
          results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
        };
        for (var i2 = 1; i2 < sig.length; ++i2) {
          type.parameters.push(typeNames[sig[i2]]);
        }
        return type;
      }, "sigToWasmTypes");
      var generateFuncType = /* @__PURE__ */ __name((sig, target) => {
        var sigRet = sig.slice(0, 1);
        var sigParam = sig.slice(1);
        var typeCodes = {
          "i": 127,
          // i32
          "p": 127,
          // i32
          "j": 126,
          // i64
          "f": 125,
          // f32
          "d": 124,
          // f64
          "e": 111
        };
        target.push(96);
        uleb128Encode(sigParam.length, target);
        for (var i2 = 0; i2 < sigParam.length; ++i2) {
          target.push(typeCodes[sigParam[i2]]);
        }
        if (sigRet == "v") {
          target.push(0);
        } else {
          target.push(1, typeCodes[sigRet]);
        }
      }, "generateFuncType");
      var convertJsFunctionToWasm = /* @__PURE__ */ __name((func2, sig) => {
        if (typeof WebAssembly.Function == "function") {
          return new WebAssembly.Function(sigToWasmTypes(sig), func2);
        }
        var typeSectionBody = [1];
        generateFuncType(sig, typeSectionBody);
        var bytes = [
          0,
          97,
          115,
          109,
          // magic ("\0asm")
          1,
          0,
          0,
          0,
          // version: 1
          1
        ];
        uleb128Encode(typeSectionBody.length, bytes);
        bytes.push(...typeSectionBody);
        bytes.push(
          2,
          7,
          // import section
          // (import "e" "f" (func 0 (type 0)))
          1,
          1,
          101,
          1,
          102,
          0,
          0,
          7,
          5,
          // export section
          // (export "f" (func 0 (type 0)))
          1,
          1,
          102,
          0,
          0
        );
        var module2 = new WebAssembly.Module(new Uint8Array(bytes));
        var instance2 = new WebAssembly.Instance(module2, {
          "e": {
            "f": func2
          }
        });
        var wrappedFunc = instance2.exports["f"];
        return wrappedFunc;
      }, "convertJsFunctionToWasm");
      var wasmTableMirror = [];
      var wasmTable = new WebAssembly.Table({
        "initial": 31,
        "element": "anyfunc"
      });
      var getWasmTableEntry = /* @__PURE__ */ __name((funcPtr) => {
        var func2 = wasmTableMirror[funcPtr];
        if (!func2) {
          if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
          wasmTableMirror[funcPtr] = func2 = wasmTable.get(funcPtr);
        }
        return func2;
      }, "getWasmTableEntry");
      var updateTableMap = /* @__PURE__ */ __name((offset, count) => {
        if (functionsInTableMap) {
          for (var i2 = offset; i2 < offset + count; i2++) {
            var item = getWasmTableEntry(i2);
            if (item) {
              functionsInTableMap.set(item, i2);
            }
          }
        }
      }, "updateTableMap");
      var functionsInTableMap;
      var getFunctionAddress = /* @__PURE__ */ __name((func2) => {
        if (!functionsInTableMap) {
          functionsInTableMap = /* @__PURE__ */ new WeakMap();
          updateTableMap(0, wasmTable.length);
        }
        return functionsInTableMap.get(func2) || 0;
      }, "getFunctionAddress");
      var freeTableIndexes = [];
      var getEmptyTableSlot = /* @__PURE__ */ __name(() => {
        if (freeTableIndexes.length) {
          return freeTableIndexes.pop();
        }
        try {
          wasmTable.grow(1);
        } catch (err2) {
          if (!(err2 instanceof RangeError)) {
            throw err2;
          }
          throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
        }
        return wasmTable.length - 1;
      }, "getEmptyTableSlot");
      var setWasmTableEntry = /* @__PURE__ */ __name((idx, func2) => {
        wasmTable.set(idx, func2);
        wasmTableMirror[idx] = wasmTable.get(idx);
      }, "setWasmTableEntry");
      var addFunction = /* @__PURE__ */ __name((func2, sig) => {
        var rtn = getFunctionAddress(func2);
        if (rtn) {
          return rtn;
        }
        var ret = getEmptyTableSlot();
        try {
          setWasmTableEntry(ret, func2);
        } catch (err2) {
          if (!(err2 instanceof TypeError)) {
            throw err2;
          }
          var wrapped = convertJsFunctionToWasm(func2, sig);
          setWasmTableEntry(ret, wrapped);
        }
        functionsInTableMap.set(func2, ret);
        return ret;
      }, "addFunction");
      var updateGOT = /* @__PURE__ */ __name((exports2, replace) => {
        for (var symName in exports2) {
          if (isInternalSym(symName)) {
            continue;
          }
          var value = exports2[symName];
          GOT[symName] || (GOT[symName] = new WebAssembly.Global({
            "value": "i32",
            "mutable": true
          }));
          if (replace || GOT[symName].value == 0) {
            if (typeof value == "function") {
              GOT[symName].value = addFunction(value);
            } else if (typeof value == "number") {
              GOT[symName].value = value;
            } else {
              err(`unhandled export type for '${symName}': ${typeof value}`);
            }
          }
        }
      }, "updateGOT");
      var relocateExports = /* @__PURE__ */ __name((exports2, memoryBase2, replace) => {
        var relocated = {};
        for (var e in exports2) {
          var value = exports2[e];
          if (typeof value == "object") {
            value = value.value;
          }
          if (typeof value == "number") {
            value += memoryBase2;
          }
          relocated[e] = value;
        }
        updateGOT(relocated, replace);
        return relocated;
      }, "relocateExports");
      var isSymbolDefined = /* @__PURE__ */ __name((symName) => {
        var existing = wasmImports[symName];
        if (!existing || existing.stub) {
          return false;
        }
        return true;
      }, "isSymbolDefined");
      var dynCall = /* @__PURE__ */ __name((sig, ptr, args2 = []) => {
        var rtn = getWasmTableEntry(ptr)(...args2);
        return rtn;
      }, "dynCall");
      var stackSave = /* @__PURE__ */ __name(() => _emscripten_stack_get_current(), "stackSave");
      var stackRestore = /* @__PURE__ */ __name((val) => __emscripten_stack_restore(val), "stackRestore");
      var createInvokeFunction = /* @__PURE__ */ __name((sig) => (ptr, ...args2) => {
        var sp = stackSave();
        try {
          return dynCall(sig, ptr, args2);
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0);
          if (sig[0] == "j") return 0n;
        }
      }, "createInvokeFunction");
      var resolveGlobalSymbol = /* @__PURE__ */ __name((symName, direct = false) => {
        var sym;
        if (isSymbolDefined(symName)) {
          sym = wasmImports[symName];
        } else if (symName.startsWith("invoke_")) {
          sym = wasmImports[symName] = createInvokeFunction(symName.split("_")[1]);
        }
        return {
          sym,
          name: symName
        };
      }, "resolveGlobalSymbol");
      var onPostCtors = [];
      var addOnPostCtor = /* @__PURE__ */ __name((cb) => onPostCtors.unshift(cb), "addOnPostCtor");
      var UTF8ToString = /* @__PURE__ */ __name((ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "", "UTF8ToString");
      var loadWebAssemblyModule = /* @__PURE__ */ __name((binary, flags, libName, localScope, handle) => {
        var metadata = getDylinkMetadata(binary);
        currentModuleWeakSymbols = metadata.weakImports;
        function loadModule() {
          var memAlign = Math.pow(2, metadata.memoryAlign);
          var memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0;
          var tableBase = metadata.tableSize ? wasmTable.length : 0;
          if (handle) {
            HEAP8[handle + 8] = 1;
            LE_HEAP_STORE_U32((handle + 12 >> 2) * 4, memoryBase);
            LE_HEAP_STORE_I32((handle + 16 >> 2) * 4, metadata.memorySize);
            LE_HEAP_STORE_U32((handle + 20 >> 2) * 4, tableBase);
            LE_HEAP_STORE_I32((handle + 24 >> 2) * 4, metadata.tableSize);
          }
          if (metadata.tableSize) {
            wasmTable.grow(metadata.tableSize);
          }
          var moduleExports;
          function resolveSymbol(sym) {
            var resolved = resolveGlobalSymbol(sym).sym;
            if (!resolved && localScope) {
              resolved = localScope[sym];
            }
            if (!resolved) {
              resolved = moduleExports[sym];
            }
            return resolved;
          }
          __name(resolveSymbol, "resolveSymbol");
          var proxyHandler = {
            get(stubs, prop) {
              switch (prop) {
                case "__memory_base":
                  return memoryBase;
                case "__table_base":
                  return tableBase;
              }
              if (prop in wasmImports && !wasmImports[prop].stub) {
                var res = wasmImports[prop];
                return res;
              }
              if (!(prop in stubs)) {
                var resolved;
                stubs[prop] = (...args2) => {
                  resolved || (resolved = resolveSymbol(prop));
                  return resolved(...args2);
                };
              }
              return stubs[prop];
            }
          };
          var proxy = new Proxy({}, proxyHandler);
          var info = {
            "GOT.mem": new Proxy({}, GOTHandler),
            "GOT.func": new Proxy({}, GOTHandler),
            "env": proxy,
            "wasi_snapshot_preview1": proxy
          };
          function postInstantiation(module, instance) {
            updateTableMap(tableBase, metadata.tableSize);
            moduleExports = relocateExports(instance.exports, memoryBase);
            if (!flags.allowUndefined) {
              reportUndefinedSymbols();
            }
            function addEmAsm(addr, body) {
              var args = [];
              var arity = 0;
              for (; arity < 16; arity++) {
                if (body.indexOf("$" + arity) != -1) {
                  args.push("$" + arity);
                } else {
                  break;
                }
              }
              args = args.join(",");
              var func = `(${args}) => { ${body} };`;
              eval(func);
            }
            __name(addEmAsm, "addEmAsm");
            if ("__start_em_asm" in moduleExports) {
              var start = moduleExports["__start_em_asm"];
              var stop = moduleExports["__stop_em_asm"];
              while (start < stop) {
                var jsString = UTF8ToString(start);
                addEmAsm(start, jsString);
                start = HEAPU8.indexOf(0, start) + 1;
              }
            }
            function addEmJs(name, cSig, body) {
              var jsArgs = [];
              cSig = cSig.slice(1, -1);
              if (cSig != "void") {
                cSig = cSig.split(",");
                for (var i in cSig) {
                  var jsArg = cSig[i].split(" ").pop();
                  jsArgs.push(jsArg.replace("*", ""));
                }
              }
              var func = `(${jsArgs}) => ${body};`;
              moduleExports[name] = eval(func);
            }
            __name(addEmJs, "addEmJs");
            for (var name in moduleExports) {
              if (name.startsWith("__em_js__")) {
                var start = moduleExports[name];
                var jsString = UTF8ToString(start);
                var parts = jsString.split("<::>");
                addEmJs(name.replace("__em_js__", ""), parts[0], parts[1]);
                delete moduleExports[name];
              }
            }
            var applyRelocs = moduleExports["__wasm_apply_data_relocs"];
            if (applyRelocs) {
              if (runtimeInitialized) {
                applyRelocs();
              } else {
                __RELOC_FUNCS__.push(applyRelocs);
              }
            }
            var init = moduleExports["__wasm_call_ctors"];
            if (init) {
              if (runtimeInitialized) {
                init();
              } else {
                addOnPostCtor(init);
              }
            }
            return moduleExports;
          }
          __name(postInstantiation, "postInstantiation");
          if (flags.loadAsync) {
            if (binary instanceof WebAssembly.Module) {
              var instance = new WebAssembly.Instance(binary, info);
              return Promise.resolve(postInstantiation(binary, instance));
            }
            return WebAssembly.instantiate(binary, info).then((result) => postInstantiation(result.module, result.instance));
          }
          var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary);
          var instance = new WebAssembly.Instance(module, info);
          return postInstantiation(module, instance);
        }
        __name(loadModule, "loadModule");
        if (flags.loadAsync) {
          return metadata.neededDynlibs.reduce((chain, dynNeeded) => chain.then(() => loadDynamicLibrary(dynNeeded, flags, localScope)), Promise.resolve()).then(loadModule);
        }
        metadata.neededDynlibs.forEach((needed) => loadDynamicLibrary(needed, flags, localScope));
        return loadModule();
      }, "loadWebAssemblyModule");
      var mergeLibSymbols = /* @__PURE__ */ __name((exports2, libName2) => {
        for (var [sym, exp] of Object.entries(exports2)) {
          const setImport = /* @__PURE__ */ __name((target) => {
            if (!isSymbolDefined(target)) {
              wasmImports[target] = exp;
            }
          }, "setImport");
          setImport(sym);
          const main_alias = "__main_argc_argv";
          if (sym == "main") {
            setImport(main_alias);
          }
          if (sym == main_alias) {
            setImport("main");
          }
        }
      }, "mergeLibSymbols");
      var asyncLoad = /* @__PURE__ */ __name(async (url) => {
        var arrayBuffer = await readAsync(url);
        return new Uint8Array(arrayBuffer);
      }, "asyncLoad");
      function loadDynamicLibrary(libName2, flags2 = {
        global: true,
        nodelete: true
      }, localScope2, handle2) {
        var dso = LDSO.loadedLibsByName[libName2];
        if (dso) {
          if (!flags2.global) {
            if (localScope2) {
              Object.assign(localScope2, dso.exports);
            }
          } else if (!dso.global) {
            dso.global = true;
            mergeLibSymbols(dso.exports, libName2);
          }
          if (flags2.nodelete && dso.refcount !== Infinity) {
            dso.refcount = Infinity;
          }
          dso.refcount++;
          if (handle2) {
            LDSO.loadedLibsByHandle[handle2] = dso;
          }
          return flags2.loadAsync ? Promise.resolve(true) : true;
        }
        dso = newDSO(libName2, handle2, "loading");
        dso.refcount = flags2.nodelete ? Infinity : 1;
        dso.global = flags2.global;
        function loadLibData() {
          if (handle2) {
            var data = LE_HEAP_LOAD_U32((handle2 + 28 >> 2) * 4);
            var dataSize = LE_HEAP_LOAD_U32((handle2 + 32 >> 2) * 4);
            if (data && dataSize) {
              var libData = HEAP8.slice(data, data + dataSize);
              return flags2.loadAsync ? Promise.resolve(libData) : libData;
            }
          }
          var libFile = locateFile(libName2);
          if (flags2.loadAsync) {
            return asyncLoad(libFile);
          }
          if (!readBinary) {
            throw new Error(`${libFile}: file not found, and synchronous loading of external files is not available`);
          }
          return readBinary(libFile);
        }
        __name(loadLibData, "loadLibData");
        function getExports() {
          if (flags2.loadAsync) {
            return loadLibData().then((libData) => loadWebAssemblyModule(libData, flags2, libName2, localScope2, handle2));
          }
          return loadWebAssemblyModule(loadLibData(), flags2, libName2, localScope2, handle2);
        }
        __name(getExports, "getExports");
        function moduleLoaded(exports2) {
          if (dso.global) {
            mergeLibSymbols(exports2, libName2);
          } else if (localScope2) {
            Object.assign(localScope2, exports2);
          }
          dso.exports = exports2;
        }
        __name(moduleLoaded, "moduleLoaded");
        if (flags2.loadAsync) {
          return getExports().then((exports2) => {
            moduleLoaded(exports2);
            return true;
          });
        }
        moduleLoaded(getExports());
        return true;
      }
      __name(loadDynamicLibrary, "loadDynamicLibrary");
      var reportUndefinedSymbols = /* @__PURE__ */ __name(() => {
        for (var [symName, entry] of Object.entries(GOT)) {
          if (entry.value == 0) {
            var value = resolveGlobalSymbol(symName, true).sym;
            if (!value && !entry.required) {
              continue;
            }
            if (typeof value == "function") {
              entry.value = addFunction(value, value.sig);
            } else if (typeof value == "number") {
              entry.value = value;
            } else {
              throw new Error(`bad export type for '${symName}': ${typeof value}`);
            }
          }
        }
      }, "reportUndefinedSymbols");
      var loadDylibs = /* @__PURE__ */ __name(() => {
        if (!dynamicLibraries.length) {
          reportUndefinedSymbols();
          return;
        }
        addRunDependency();
        dynamicLibraries.reduce((chain, lib) => chain.then(() => loadDynamicLibrary(lib, {
          loadAsync: true,
          global: true,
          nodelete: true,
          allowUndefined: true
        })), Promise.resolve()).then(() => {
          reportUndefinedSymbols();
          removeRunDependency();
        });
      }, "loadDylibs");
      var noExitRuntime = Module["noExitRuntime"] || true;
      function setValue(ptr, value, type = "i8") {
        if (type.endsWith("*")) type = "*";
        switch (type) {
          case "i1":
            HEAP8[ptr] = value;
            break;
          case "i8":
            HEAP8[ptr] = value;
            break;
          case "i16":
            LE_HEAP_STORE_I16((ptr >> 1) * 2, value);
            break;
          case "i32":
            LE_HEAP_STORE_I32((ptr >> 2) * 4, value);
            break;
          case "i64":
            HEAP64[ptr >> 3] = BigInt(value);
            break;
          case "float":
            LE_HEAP_STORE_F32((ptr >> 2) * 4, value);
            break;
          case "double":
            LE_HEAP_STORE_F64((ptr >> 3) * 8, value);
            break;
          case "*":
            LE_HEAP_STORE_U32((ptr >> 2) * 4, value);
            break;
          default:
            abort(`invalid type for setValue: ${type}`);
        }
      }
      __name(setValue, "setValue");
      var ___memory_base = new WebAssembly.Global({
        "value": "i32",
        "mutable": false
      }, 1024);
      var ___stack_pointer = new WebAssembly.Global({
        "value": "i32",
        "mutable": true
      }, 78224);
      var ___table_base = new WebAssembly.Global({
        "value": "i32",
        "mutable": false
      }, 1);
      var __abort_js = /* @__PURE__ */ __name(() => abort(""), "__abort_js");
      __abort_js.sig = "v";
      var _emscripten_get_now = /* @__PURE__ */ __name(() => performance.now(), "_emscripten_get_now");
      _emscripten_get_now.sig = "d";
      var _emscripten_date_now = /* @__PURE__ */ __name(() => Date.now(), "_emscripten_date_now");
      _emscripten_date_now.sig = "d";
      var checkWasiClock = /* @__PURE__ */ __name((clock_id) => clock_id >= 0 && clock_id <= 3, "checkWasiClock");
      var INT53_MAX = 9007199254740992;
      var INT53_MIN = -9007199254740992;
      var bigintToI53Checked = /* @__PURE__ */ __name((num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num), "bigintToI53Checked");
      function _clock_time_get(clk_id, ignored_precision, ptime) {
        ignored_precision = bigintToI53Checked(ignored_precision);
        if (!checkWasiClock(clk_id)) {
          return 28;
        }
        var now;
        if (clk_id === 0) {
          now = _emscripten_date_now();
        } else {
          now = _emscripten_get_now();
        }
        var nsec = Math.round(now * 1e3 * 1e3);
        HEAP64[ptime >> 3] = BigInt(nsec);
        return 0;
      }
      __name(_clock_time_get, "_clock_time_get");
      _clock_time_get.sig = "iijp";
      var getHeapMax = /* @__PURE__ */ __name(() => (
        // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
        // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
        // for any code that deals with heap sizes, which would require special
        // casing all heap size related code to treat 0 specially.
        2147483648
      ), "getHeapMax");
      var growMemory = /* @__PURE__ */ __name((size) => {
        var b = wasmMemory.buffer;
        var pages = (size - b.byteLength + 65535) / 65536 | 0;
        try {
          wasmMemory.grow(pages);
          updateMemoryViews();
          return 1;
        } catch (e) {
        }
      }, "growMemory");
      var _emscripten_resize_heap = /* @__PURE__ */ __name((requestedSize) => {
        var oldSize = HEAPU8.length;
        requestedSize >>>= 0;
        var maxHeapSize = getHeapMax();
        if (requestedSize > maxHeapSize) {
          return false;
        }
        for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
          var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
          overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
          var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
          var replacement = growMemory(newSize);
          if (replacement) {
            return true;
          }
        }
        return false;
      }, "_emscripten_resize_heap");
      _emscripten_resize_heap.sig = "ip";
      var _fd_close = /* @__PURE__ */ __name((fd) => 52, "_fd_close");
      _fd_close.sig = "ii";
      function _fd_seek(fd, offset, whence, newOffset) {
        offset = bigintToI53Checked(offset);
        return 70;
      }
      __name(_fd_seek, "_fd_seek");
      _fd_seek.sig = "iijip";
      var printCharBuffers = [null, [], []];
      var printChar = /* @__PURE__ */ __name((stream, curr) => {
        var buffer = printCharBuffers[stream];
        if (curr === 0 || curr === 10) {
          (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
          buffer.length = 0;
        } else {
          buffer.push(curr);
        }
      }, "printChar");
      var _fd_write = /* @__PURE__ */ __name((fd, iov, iovcnt, pnum) => {
        var num = 0;
        for (var i2 = 0; i2 < iovcnt; i2++) {
          var ptr = LE_HEAP_LOAD_U32((iov >> 2) * 4);
          var len = LE_HEAP_LOAD_U32((iov + 4 >> 2) * 4);
          iov += 8;
          for (var j = 0; j < len; j++) {
            printChar(fd, HEAPU8[ptr + j]);
          }
          num += len;
        }
        LE_HEAP_STORE_U32((pnum >> 2) * 4, num);
        return 0;
      }, "_fd_write");
      _fd_write.sig = "iippp";
      function _tree_sitter_log_callback(isLexMessage, messageAddress) {
        if (Module.currentLogCallback) {
          const message = UTF8ToString(messageAddress);
          Module.currentLogCallback(message, isLexMessage !== 0);
        }
      }
      __name(_tree_sitter_log_callback, "_tree_sitter_log_callback");
      function _tree_sitter_parse_callback(inputBufferAddress, index, row, column, lengthAddress) {
        const INPUT_BUFFER_SIZE = 10 * 1024;
        const string = Module.currentParseCallback(index, {
          row,
          column
        });
        if (typeof string === "string") {
          setValue(lengthAddress, string.length, "i32");
          stringToUTF16(string, inputBufferAddress, INPUT_BUFFER_SIZE);
        } else {
          setValue(lengthAddress, 0, "i32");
        }
      }
      __name(_tree_sitter_parse_callback, "_tree_sitter_parse_callback");
      function _tree_sitter_progress_callback(currentOffset, hasError) {
        if (Module.currentProgressCallback) {
          return Module.currentProgressCallback({
            currentOffset,
            hasError
          });
        }
        return false;
      }
      __name(_tree_sitter_progress_callback, "_tree_sitter_progress_callback");
      function _tree_sitter_query_progress_callback(currentOffset) {
        if (Module.currentQueryProgressCallback) {
          return Module.currentQueryProgressCallback({
            currentOffset
          });
        }
        return false;
      }
      __name(_tree_sitter_query_progress_callback, "_tree_sitter_query_progress_callback");
      var keepRuntimeAlive = /* @__PURE__ */ __name(() => noExitRuntime, "keepRuntimeAlive");
      var _proc_exit = /* @__PURE__ */ __name((code) => {
        var _a2;
        EXITSTATUS = code;
        if (!keepRuntimeAlive()) {
          (_a2 = Module["onExit"]) == null ? void 0 : _a2.call(Module, code);
          ABORT = true;
        }
        quit_(code, new ExitStatus(code));
      }, "_proc_exit");
      _proc_exit.sig = "vi";
      var exitJS = /* @__PURE__ */ __name((status, implicit) => {
        EXITSTATUS = status;
        _proc_exit(status);
      }, "exitJS");
      var handleException = /* @__PURE__ */ __name((e) => {
        if (e instanceof ExitStatus || e == "unwind") {
          return EXITSTATUS;
        }
        quit_(1, e);
      }, "handleException");
      var lengthBytesUTF8 = /* @__PURE__ */ __name((str) => {
        var len = 0;
        for (var i2 = 0; i2 < str.length; ++i2) {
          var c = str.charCodeAt(i2);
          if (c <= 127) {
            len++;
          } else if (c <= 2047) {
            len += 2;
          } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i2;
          } else {
            len += 3;
          }
        }
        return len;
      }, "lengthBytesUTF8");
      var stringToUTF8Array = /* @__PURE__ */ __name((str, heap, outIdx, maxBytesToWrite) => {
        if (!(maxBytesToWrite > 0)) return 0;
        var startIdx = outIdx;
        var endIdx = outIdx + maxBytesToWrite - 1;
        for (var i2 = 0; i2 < str.length; ++i2) {
          var u = str.charCodeAt(i2);
          if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i2);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023;
          }
          if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u;
          } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63;
          } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63;
          } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63;
          }
        }
        heap[outIdx] = 0;
        return outIdx - startIdx;
      }, "stringToUTF8Array");
      var stringToUTF8 = /* @__PURE__ */ __name((str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite), "stringToUTF8");
      var stackAlloc = /* @__PURE__ */ __name((sz) => __emscripten_stack_alloc(sz), "stackAlloc");
      var stringToUTF8OnStack = /* @__PURE__ */ __name((str) => {
        var size = lengthBytesUTF8(str) + 1;
        var ret = stackAlloc(size);
        stringToUTF8(str, ret, size);
        return ret;
      }, "stringToUTF8OnStack");
      var AsciiToString = /* @__PURE__ */ __name((ptr) => {
        var str = "";
        while (1) {
          var ch = HEAPU8[ptr++];
          if (!ch) return str;
          str += String.fromCharCode(ch);
        }
      }, "AsciiToString");
      var stringToUTF16 = /* @__PURE__ */ __name((str, outPtr, maxBytesToWrite) => {
        maxBytesToWrite ?? (maxBytesToWrite = 2147483647);
        if (maxBytesToWrite < 2) return 0;
        maxBytesToWrite -= 2;
        var startPtr = outPtr;
        var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
        for (var i2 = 0; i2 < numCharsToWrite; ++i2) {
          var codeUnit = str.charCodeAt(i2);
          LE_HEAP_STORE_I16((outPtr >> 1) * 2, codeUnit);
          outPtr += 2;
        }
        LE_HEAP_STORE_I16((outPtr >> 1) * 2, 0);
        return outPtr - startPtr;
      }, "stringToUTF16");
      var wasmImports = {
        /** @export */
        __heap_base: ___heap_base,
        /** @export */
        __indirect_function_table: wasmTable,
        /** @export */
        __memory_base: ___memory_base,
        /** @export */
        __stack_pointer: ___stack_pointer,
        /** @export */
        __table_base: ___table_base,
        /** @export */
        _abort_js: __abort_js,
        /** @export */
        clock_time_get: _clock_time_get,
        /** @export */
        emscripten_resize_heap: _emscripten_resize_heap,
        /** @export */
        fd_close: _fd_close,
        /** @export */
        fd_seek: _fd_seek,
        /** @export */
        fd_write: _fd_write,
        /** @export */
        memory: wasmMemory,
        /** @export */
        tree_sitter_log_callback: _tree_sitter_log_callback,
        /** @export */
        tree_sitter_parse_callback: _tree_sitter_parse_callback,
        /** @export */
        tree_sitter_progress_callback: _tree_sitter_progress_callback,
        /** @export */
        tree_sitter_query_progress_callback: _tree_sitter_query_progress_callback
      };
      var wasmExports = await createWasm();
      wasmExports["__wasm_call_ctors"];
      Module["_malloc"] = wasmExports["malloc"];
      var _calloc = Module["_calloc"] = wasmExports["calloc"];
      Module["_realloc"] = wasmExports["realloc"];
      Module["_free"] = wasmExports["free"];
      Module["_memcmp"] = wasmExports["memcmp"];
      Module["_ts_language_symbol_count"] = wasmExports["ts_language_symbol_count"];
      Module["_ts_language_state_count"] = wasmExports["ts_language_state_count"];
      Module["_ts_language_version"] = wasmExports["ts_language_version"];
      Module["_ts_language_abi_version"] = wasmExports["ts_language_abi_version"];
      Module["_ts_language_metadata"] = wasmExports["ts_language_metadata"];
      Module["_ts_language_name"] = wasmExports["ts_language_name"];
      Module["_ts_language_field_count"] = wasmExports["ts_language_field_count"];
      Module["_ts_language_next_state"] = wasmExports["ts_language_next_state"];
      Module["_ts_language_symbol_name"] = wasmExports["ts_language_symbol_name"];
      Module["_ts_language_symbol_for_name"] = wasmExports["ts_language_symbol_for_name"];
      Module["_strncmp"] = wasmExports["strncmp"];
      Module["_ts_language_symbol_type"] = wasmExports["ts_language_symbol_type"];
      Module["_ts_language_field_name_for_id"] = wasmExports["ts_language_field_name_for_id"];
      Module["_ts_lookahead_iterator_new"] = wasmExports["ts_lookahead_iterator_new"];
      Module["_ts_lookahead_iterator_delete"] = wasmExports["ts_lookahead_iterator_delete"];
      Module["_ts_lookahead_iterator_reset_state"] = wasmExports["ts_lookahead_iterator_reset_state"];
      Module["_ts_lookahead_iterator_reset"] = wasmExports["ts_lookahead_iterator_reset"];
      Module["_ts_lookahead_iterator_next"] = wasmExports["ts_lookahead_iterator_next"];
      Module["_ts_lookahead_iterator_current_symbol"] = wasmExports["ts_lookahead_iterator_current_symbol"];
      Module["_ts_parser_delete"] = wasmExports["ts_parser_delete"];
      Module["_ts_parser_reset"] = wasmExports["ts_parser_reset"];
      Module["_ts_parser_set_language"] = wasmExports["ts_parser_set_language"];
      Module["_ts_parser_timeout_micros"] = wasmExports["ts_parser_timeout_micros"];
      Module["_ts_parser_set_timeout_micros"] = wasmExports["ts_parser_set_timeout_micros"];
      Module["_ts_parser_set_included_ranges"] = wasmExports["ts_parser_set_included_ranges"];
      Module["_ts_query_new"] = wasmExports["ts_query_new"];
      Module["_ts_query_delete"] = wasmExports["ts_query_delete"];
      Module["_iswspace"] = wasmExports["iswspace"];
      Module["_iswalnum"] = wasmExports["iswalnum"];
      Module["_ts_query_pattern_count"] = wasmExports["ts_query_pattern_count"];
      Module["_ts_query_capture_count"] = wasmExports["ts_query_capture_count"];
      Module["_ts_query_string_count"] = wasmExports["ts_query_string_count"];
      Module["_ts_query_capture_name_for_id"] = wasmExports["ts_query_capture_name_for_id"];
      Module["_ts_query_capture_quantifier_for_id"] = wasmExports["ts_query_capture_quantifier_for_id"];
      Module["_ts_query_string_value_for_id"] = wasmExports["ts_query_string_value_for_id"];
      Module["_ts_query_predicates_for_pattern"] = wasmExports["ts_query_predicates_for_pattern"];
      Module["_ts_query_start_byte_for_pattern"] = wasmExports["ts_query_start_byte_for_pattern"];
      Module["_ts_query_end_byte_for_pattern"] = wasmExports["ts_query_end_byte_for_pattern"];
      Module["_ts_query_is_pattern_rooted"] = wasmExports["ts_query_is_pattern_rooted"];
      Module["_ts_query_is_pattern_non_local"] = wasmExports["ts_query_is_pattern_non_local"];
      Module["_ts_query_is_pattern_guaranteed_at_step"] = wasmExports["ts_query_is_pattern_guaranteed_at_step"];
      Module["_ts_query_disable_capture"] = wasmExports["ts_query_disable_capture"];
      Module["_ts_query_disable_pattern"] = wasmExports["ts_query_disable_pattern"];
      Module["_ts_tree_copy"] = wasmExports["ts_tree_copy"];
      Module["_ts_tree_delete"] = wasmExports["ts_tree_delete"];
      Module["_ts_init"] = wasmExports["ts_init"];
      Module["_ts_parser_new_wasm"] = wasmExports["ts_parser_new_wasm"];
      Module["_ts_parser_enable_logger_wasm"] = wasmExports["ts_parser_enable_logger_wasm"];
      Module["_ts_parser_parse_wasm"] = wasmExports["ts_parser_parse_wasm"];
      Module["_ts_parser_included_ranges_wasm"] = wasmExports["ts_parser_included_ranges_wasm"];
      Module["_ts_language_type_is_named_wasm"] = wasmExports["ts_language_type_is_named_wasm"];
      Module["_ts_language_type_is_visible_wasm"] = wasmExports["ts_language_type_is_visible_wasm"];
      Module["_ts_language_supertypes_wasm"] = wasmExports["ts_language_supertypes_wasm"];
      Module["_ts_language_subtypes_wasm"] = wasmExports["ts_language_subtypes_wasm"];
      Module["_ts_tree_root_node_wasm"] = wasmExports["ts_tree_root_node_wasm"];
      Module["_ts_tree_root_node_with_offset_wasm"] = wasmExports["ts_tree_root_node_with_offset_wasm"];
      Module["_ts_tree_edit_wasm"] = wasmExports["ts_tree_edit_wasm"];
      Module["_ts_tree_included_ranges_wasm"] = wasmExports["ts_tree_included_ranges_wasm"];
      Module["_ts_tree_get_changed_ranges_wasm"] = wasmExports["ts_tree_get_changed_ranges_wasm"];
      Module["_ts_tree_cursor_new_wasm"] = wasmExports["ts_tree_cursor_new_wasm"];
      Module["_ts_tree_cursor_copy_wasm"] = wasmExports["ts_tree_cursor_copy_wasm"];
      Module["_ts_tree_cursor_delete_wasm"] = wasmExports["ts_tree_cursor_delete_wasm"];
      Module["_ts_tree_cursor_reset_wasm"] = wasmExports["ts_tree_cursor_reset_wasm"];
      Module["_ts_tree_cursor_reset_to_wasm"] = wasmExports["ts_tree_cursor_reset_to_wasm"];
      Module["_ts_tree_cursor_goto_first_child_wasm"] = wasmExports["ts_tree_cursor_goto_first_child_wasm"];
      Module["_ts_tree_cursor_goto_last_child_wasm"] = wasmExports["ts_tree_cursor_goto_last_child_wasm"];
      Module["_ts_tree_cursor_goto_first_child_for_index_wasm"] = wasmExports["ts_tree_cursor_goto_first_child_for_index_wasm"];
      Module["_ts_tree_cursor_goto_first_child_for_position_wasm"] = wasmExports["ts_tree_cursor_goto_first_child_for_position_wasm"];
      Module["_ts_tree_cursor_goto_next_sibling_wasm"] = wasmExports["ts_tree_cursor_goto_next_sibling_wasm"];
      Module["_ts_tree_cursor_goto_previous_sibling_wasm"] = wasmExports["ts_tree_cursor_goto_previous_sibling_wasm"];
      Module["_ts_tree_cursor_goto_descendant_wasm"] = wasmExports["ts_tree_cursor_goto_descendant_wasm"];
      Module["_ts_tree_cursor_goto_parent_wasm"] = wasmExports["ts_tree_cursor_goto_parent_wasm"];
      Module["_ts_tree_cursor_current_node_type_id_wasm"] = wasmExports["ts_tree_cursor_current_node_type_id_wasm"];
      Module["_ts_tree_cursor_current_node_state_id_wasm"] = wasmExports["ts_tree_cursor_current_node_state_id_wasm"];
      Module["_ts_tree_cursor_current_node_is_named_wasm"] = wasmExports["ts_tree_cursor_current_node_is_named_wasm"];
      Module["_ts_tree_cursor_current_node_is_missing_wasm"] = wasmExports["ts_tree_cursor_current_node_is_missing_wasm"];
      Module["_ts_tree_cursor_current_node_id_wasm"] = wasmExports["ts_tree_cursor_current_node_id_wasm"];
      Module["_ts_tree_cursor_start_position_wasm"] = wasmExports["ts_tree_cursor_start_position_wasm"];
      Module["_ts_tree_cursor_end_position_wasm"] = wasmExports["ts_tree_cursor_end_position_wasm"];
      Module["_ts_tree_cursor_start_index_wasm"] = wasmExports["ts_tree_cursor_start_index_wasm"];
      Module["_ts_tree_cursor_end_index_wasm"] = wasmExports["ts_tree_cursor_end_index_wasm"];
      Module["_ts_tree_cursor_current_field_id_wasm"] = wasmExports["ts_tree_cursor_current_field_id_wasm"];
      Module["_ts_tree_cursor_current_depth_wasm"] = wasmExports["ts_tree_cursor_current_depth_wasm"];
      Module["_ts_tree_cursor_current_descendant_index_wasm"] = wasmExports["ts_tree_cursor_current_descendant_index_wasm"];
      Module["_ts_tree_cursor_current_node_wasm"] = wasmExports["ts_tree_cursor_current_node_wasm"];
      Module["_ts_node_symbol_wasm"] = wasmExports["ts_node_symbol_wasm"];
      Module["_ts_node_field_name_for_child_wasm"] = wasmExports["ts_node_field_name_for_child_wasm"];
      Module["_ts_node_field_name_for_named_child_wasm"] = wasmExports["ts_node_field_name_for_named_child_wasm"];
      Module["_ts_node_children_by_field_id_wasm"] = wasmExports["ts_node_children_by_field_id_wasm"];
      Module["_ts_node_first_child_for_byte_wasm"] = wasmExports["ts_node_first_child_for_byte_wasm"];
      Module["_ts_node_first_named_child_for_byte_wasm"] = wasmExports["ts_node_first_named_child_for_byte_wasm"];
      Module["_ts_node_grammar_symbol_wasm"] = wasmExports["ts_node_grammar_symbol_wasm"];
      Module["_ts_node_child_count_wasm"] = wasmExports["ts_node_child_count_wasm"];
      Module["_ts_node_named_child_count_wasm"] = wasmExports["ts_node_named_child_count_wasm"];
      Module["_ts_node_child_wasm"] = wasmExports["ts_node_child_wasm"];
      Module["_ts_node_named_child_wasm"] = wasmExports["ts_node_named_child_wasm"];
      Module["_ts_node_child_by_field_id_wasm"] = wasmExports["ts_node_child_by_field_id_wasm"];
      Module["_ts_node_next_sibling_wasm"] = wasmExports["ts_node_next_sibling_wasm"];
      Module["_ts_node_prev_sibling_wasm"] = wasmExports["ts_node_prev_sibling_wasm"];
      Module["_ts_node_next_named_sibling_wasm"] = wasmExports["ts_node_next_named_sibling_wasm"];
      Module["_ts_node_prev_named_sibling_wasm"] = wasmExports["ts_node_prev_named_sibling_wasm"];
      Module["_ts_node_descendant_count_wasm"] = wasmExports["ts_node_descendant_count_wasm"];
      Module["_ts_node_parent_wasm"] = wasmExports["ts_node_parent_wasm"];
      Module["_ts_node_child_with_descendant_wasm"] = wasmExports["ts_node_child_with_descendant_wasm"];
      Module["_ts_node_descendant_for_index_wasm"] = wasmExports["ts_node_descendant_for_index_wasm"];
      Module["_ts_node_named_descendant_for_index_wasm"] = wasmExports["ts_node_named_descendant_for_index_wasm"];
      Module["_ts_node_descendant_for_position_wasm"] = wasmExports["ts_node_descendant_for_position_wasm"];
      Module["_ts_node_named_descendant_for_position_wasm"] = wasmExports["ts_node_named_descendant_for_position_wasm"];
      Module["_ts_node_start_point_wasm"] = wasmExports["ts_node_start_point_wasm"];
      Module["_ts_node_end_point_wasm"] = wasmExports["ts_node_end_point_wasm"];
      Module["_ts_node_start_index_wasm"] = wasmExports["ts_node_start_index_wasm"];
      Module["_ts_node_end_index_wasm"] = wasmExports["ts_node_end_index_wasm"];
      Module["_ts_node_to_string_wasm"] = wasmExports["ts_node_to_string_wasm"];
      Module["_ts_node_children_wasm"] = wasmExports["ts_node_children_wasm"];
      Module["_ts_node_named_children_wasm"] = wasmExports["ts_node_named_children_wasm"];
      Module["_ts_node_descendants_of_type_wasm"] = wasmExports["ts_node_descendants_of_type_wasm"];
      Module["_ts_node_is_named_wasm"] = wasmExports["ts_node_is_named_wasm"];
      Module["_ts_node_has_changes_wasm"] = wasmExports["ts_node_has_changes_wasm"];
      Module["_ts_node_has_error_wasm"] = wasmExports["ts_node_has_error_wasm"];
      Module["_ts_node_is_error_wasm"] = wasmExports["ts_node_is_error_wasm"];
      Module["_ts_node_is_missing_wasm"] = wasmExports["ts_node_is_missing_wasm"];
      Module["_ts_node_is_extra_wasm"] = wasmExports["ts_node_is_extra_wasm"];
      Module["_ts_node_parse_state_wasm"] = wasmExports["ts_node_parse_state_wasm"];
      Module["_ts_node_next_parse_state_wasm"] = wasmExports["ts_node_next_parse_state_wasm"];
      Module["_ts_query_matches_wasm"] = wasmExports["ts_query_matches_wasm"];
      Module["_ts_query_captures_wasm"] = wasmExports["ts_query_captures_wasm"];
      Module["_memset"] = wasmExports["memset"];
      Module["_memcpy"] = wasmExports["memcpy"];
      Module["_memmove"] = wasmExports["memmove"];
      Module["_iswalpha"] = wasmExports["iswalpha"];
      Module["_iswblank"] = wasmExports["iswblank"];
      Module["_iswdigit"] = wasmExports["iswdigit"];
      Module["_iswlower"] = wasmExports["iswlower"];
      Module["_iswupper"] = wasmExports["iswupper"];
      Module["_iswxdigit"] = wasmExports["iswxdigit"];
      Module["_memchr"] = wasmExports["memchr"];
      Module["_strlen"] = wasmExports["strlen"];
      Module["_strcmp"] = wasmExports["strcmp"];
      Module["_strncat"] = wasmExports["strncat"];
      Module["_strncpy"] = wasmExports["strncpy"];
      Module["_towlower"] = wasmExports["towlower"];
      Module["_towupper"] = wasmExports["towupper"];
      var _setThrew = wasmExports["setThrew"];
      var __emscripten_stack_restore = wasmExports["_emscripten_stack_restore"];
      var __emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"];
      var _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"];
      wasmExports["__wasm_apply_data_relocs"];
      Module["setValue"] = setValue;
      Module["getValue"] = getValue;
      Module["UTF8ToString"] = UTF8ToString;
      Module["stringToUTF8"] = stringToUTF8;
      Module["lengthBytesUTF8"] = lengthBytesUTF8;
      Module["AsciiToString"] = AsciiToString;
      Module["stringToUTF16"] = stringToUTF16;
      Module["loadWebAssemblyModule"] = loadWebAssemblyModule;
      function callMain(args2 = []) {
        var entryFunction = resolveGlobalSymbol("main").sym;
        if (!entryFunction) return;
        args2.unshift(thisProgram);
        var argc = args2.length;
        var argv = stackAlloc((argc + 1) * 4);
        var argv_ptr = argv;
        args2.forEach((arg) => {
          LE_HEAP_STORE_U32((argv_ptr >> 2) * 4, stringToUTF8OnStack(arg));
          argv_ptr += 4;
        });
        LE_HEAP_STORE_U32((argv_ptr >> 2) * 4, 0);
        try {
          var ret = entryFunction(argc, argv);
          exitJS(
            ret,
            /* implicit = */
            true
          );
          return ret;
        } catch (e) {
          return handleException(e);
        }
      }
      __name(callMain, "callMain");
      function run(args2 = arguments_) {
        if (runDependencies > 0) {
          dependenciesFulfilled = run;
          return;
        }
        preRun();
        if (runDependencies > 0) {
          dependenciesFulfilled = run;
          return;
        }
        function doRun() {
          var _a2;
          Module["calledRun"] = true;
          if (ABORT) return;
          initRuntime();
          readyPromiseResolve(Module);
          (_a2 = Module["onRuntimeInitialized"]) == null ? void 0 : _a2.call(Module);
          var noInitialRun = Module["noInitialRun"];
          if (!noInitialRun) callMain(args2);
          postRun();
        }
        __name(doRun, "doRun");
        if (Module["setStatus"]) {
          Module["setStatus"]("Running...");
          setTimeout(() => {
            setTimeout(() => Module["setStatus"](""), 1);
            doRun();
          }, 1);
        } else {
          doRun();
        }
      }
      __name(run, "run");
      if (Module["preInit"]) {
        if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
        while (Module["preInit"].length > 0) {
          Module["preInit"].pop()();
        }
      }
      run();
      moduleRtn = readyPromise;
      return moduleRtn;
    };
  })();
  var tree_sitter_default = Module2;
  var Module3 = null;
  async function initializeBinding(moduleOptions) {
    if (!Module3) {
      Module3 = await tree_sitter_default(moduleOptions);
    }
    return Module3;
  }
  __name(initializeBinding, "initializeBinding");
  function checkModule() {
    return !!Module3;
  }
  __name(checkModule, "checkModule");
  var TRANSFER_BUFFER;
  var LANGUAGE_VERSION;
  var MIN_COMPATIBLE_VERSION;
  var Parser = (_h = class {
    /**
     * Create a new parser.
     */
    constructor() {
      /** @internal */
      __publicField(this, 0, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, 1, 0);
      // Internal handle for WASM
      /** @internal */
      __publicField(this, "logCallback", null);
      /** The parser's current language. */
      __publicField(this, "language", null);
      this.initialize();
    }
    /**
     * This must always be called before creating a Parser.
     *
     * You can optionally pass in options to configure the WASM module, the most common
     * one being `locateFile` to help the module find the `.wasm` file.
     */
    static async init(moduleOptions) {
      setModule(await initializeBinding(moduleOptions));
      TRANSFER_BUFFER = C._ts_init();
      LANGUAGE_VERSION = C.getValue(TRANSFER_BUFFER, "i32");
      MIN_COMPATIBLE_VERSION = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    }
    /** @internal */
    initialize() {
      if (!checkModule()) {
        throw new Error("cannot construct a Parser before calling `init()`");
      }
      C._ts_parser_new_wasm();
      this[0] = C.getValue(TRANSFER_BUFFER, "i32");
      this[1] = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    }
    /** Delete the parser, freeing its resources. */
    delete() {
      C._ts_parser_delete(this[0]);
      C._free(this[1]);
      this[0] = 0;
      this[1] = 0;
    }
    /**
     * Set the language that the parser should use for parsing.
     *
     * If the language was not successfully assigned, an error will be thrown.
     * This happens if the language was generated with an incompatible
     * version of the Tree-sitter CLI. Check the language's version using
     * {@link Language#version} and compare it to this library's
     * {@link LANGUAGE_VERSION} and {@link MIN_COMPATIBLE_VERSION} constants.
     */
    setLanguage(language) {
      let address;
      if (!language) {
        address = 0;
        this.language = null;
      } else if (language.constructor === Language) {
        address = language[0];
        const version = C._ts_language_version(address);
        if (version < MIN_COMPATIBLE_VERSION || LANGUAGE_VERSION < version) {
          throw new Error(
            `Incompatible language version ${version}. Compatibility range ${MIN_COMPATIBLE_VERSION} through ${LANGUAGE_VERSION}.`
          );
        }
        this.language = language;
      } else {
        throw new Error("Argument must be a Language");
      }
      C._ts_parser_set_language(this[0], address);
      return this;
    }
    /**
     * Parse a slice of UTF8 text.
     *
     * @param {string | ParseCallback} callback - The UTF8-encoded text to parse or a callback function.
     *
     * @param {Tree | null} [oldTree] - A previous syntax tree parsed from the same document. If the text of the
     *   document has changed since `oldTree` was created, then you must edit `oldTree` to match
     *   the new text using {@link Tree#edit}.
     *
     * @param {ParseOptions} [options] - Options for parsing the text.
     *  This can be used to set the included ranges, or a progress callback.
     *
     * @returns {Tree | null} A {@link Tree} if parsing succeeded, or `null` if:
     *  - The parser has not yet had a language assigned with {@link Parser#setLanguage}.
     *  - The progress callback returned true.
     */
    parse(callback, oldTree, options) {
      if (typeof callback === "string") {
        C.currentParseCallback = (index) => callback.slice(index);
      } else if (typeof callback === "function") {
        C.currentParseCallback = callback;
      } else {
        throw new Error("Argument must be a string or a function");
      }
      if (options == null ? void 0 : options.progressCallback) {
        C.currentProgressCallback = options.progressCallback;
      } else {
        C.currentProgressCallback = null;
      }
      if (this.logCallback) {
        C.currentLogCallback = this.logCallback;
        C._ts_parser_enable_logger_wasm(this[0], 1);
      } else {
        C.currentLogCallback = null;
        C._ts_parser_enable_logger_wasm(this[0], 0);
      }
      let rangeCount = 0;
      let rangeAddress = 0;
      if (options == null ? void 0 : options.includedRanges) {
        rangeCount = options.includedRanges.length;
        rangeAddress = C._calloc(rangeCount, SIZE_OF_RANGE);
        let address = rangeAddress;
        for (let i2 = 0; i2 < rangeCount; i2++) {
          marshalRange(address, options.includedRanges[i2]);
          address += SIZE_OF_RANGE;
        }
      }
      const treeAddress = C._ts_parser_parse_wasm(
        this[0],
        this[1],
        oldTree ? oldTree[0] : 0,
        rangeAddress,
        rangeCount
      );
      if (!treeAddress) {
        C.currentParseCallback = null;
        C.currentLogCallback = null;
        C.currentProgressCallback = null;
        return null;
      }
      if (!this.language) {
        throw new Error("Parser must have a language to parse");
      }
      const result = new Tree(INTERNAL, treeAddress, this.language, C.currentParseCallback);
      C.currentParseCallback = null;
      C.currentLogCallback = null;
      C.currentProgressCallback = null;
      return result;
    }
    /**
     * Instruct the parser to start the next parse from the beginning.
     *
     * If the parser previously failed because of a timeout, cancellation,
     * or callback, then by default, it will resume where it left off on the
     * next call to {@link Parser#parse} or other parsing functions.
     * If you don't want to resume, and instead intend to use this parser to
     * parse some other document, you must call `reset` first.
     */
    reset() {
      C._ts_parser_reset(this[0]);
    }
    /** Get the ranges of text that the parser will include when parsing. */
    getIncludedRanges() {
      C._ts_parser_included_ranges_wasm(this[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const result = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          result[i2] = unmarshalRange(address);
          address += SIZE_OF_RANGE;
        }
        C._free(buffer);
      }
      return result;
    }
    /**
     * @deprecated since version 0.25.0, prefer passing a progress callback to {@link Parser#parse}
     *
     * Get the duration in microseconds that parsing is allowed to take.
     *
     * This is set via {@link Parser#setTimeoutMicros}.
     */
    getTimeoutMicros() {
      return C._ts_parser_timeout_micros(this[0]);
    }
    /**
     * @deprecated since version 0.25.0, prefer passing a progress callback to {@link Parser#parse}
     *
     * Set the maximum duration in microseconds that parsing should be allowed
     * to take before halting.
     *
     * If parsing takes longer than this, it will halt early, returning `null`.
     * See {@link Parser#parse} for more information.
     */
    setTimeoutMicros(timeout) {
      C._ts_parser_set_timeout_micros(this[0], 0, timeout);
    }
    /** Set the logging callback that a parser should use during parsing. */
    setLogger(callback) {
      if (!callback) {
        this.logCallback = null;
      } else if (typeof callback !== "function") {
        throw new Error("Logger callback must be a function");
      } else {
        this.logCallback = callback;
      }
      return this;
    }
    /** Get the parser's current logger. */
    getLogger() {
      return this.logCallback;
    }
  }, __name(_h, "Parser"), _h);
  async function initTreeSitter() {
    let wasmPath = "./tree-sitter-magegamescript.wasm";
    if (typeof window === "object") {
      wasmPath = (await Promise.resolve().then(() => treeSitterMagegamescript$1)).default;
    }
    await Parser.init();
    const parser = new Parser();
    const Lang = await Language.load(wasmPath);
    parser.setLanguage(Lang);
    return parser;
  }
  const DIALOG_WRAP = 42;
  const SERIAL_DIALOG_WRAP = 80;
  const tagsToAnsiEscapes = (str) => {
    let ret = str;
    Object.entries(ansiTags).forEach(([k, v]) => {
      const reg = new RegExp(`<${k}>`, "g");
      ret = ret.replace(reg, v);
    });
    return ret;
  };
  const countCharLength = (str) => {
    let length = 0;
    let remainder = str;
    while (remainder.length) {
      const percents = remainder.match(/^%.*%/);
      if (percents) {
        length += 12;
        remainder = remainder.slice(percents[0].length);
        continue;
      }
      const dollars = remainder.match(/^\$.*\$/);
      if (dollars) {
        length += 5;
        remainder = remainder.slice(dollars[0].length);
        continue;
      }
      const esc = remainder.match(/^\\./);
      if (esc) {
        length += 1;
        remainder = remainder.slice(2);
        continue;
      }
      const ansi2 = remainder.match(/^\u001B\[\d+m/);
      if (ansi2) {
        length += 0;
        remainder = remainder.slice(ansi2[0].length);
        continue;
      }
      const canPrint = remainder.match(/^[-!"#$%&'()*+,./0-9:;<>=?@A-Z\[\]\\^_`a-z{}|~]+/);
      if (canPrint) {
        length += 1;
        remainder = remainder.slice(1);
        continue;
      }
      length += 0;
      remainder = remainder.slice(1);
    }
    return length;
  };
  const wrapText = (origStr, wrap, doAnsiWrapBodge = false) => {
    let str = origStr.replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/—/g, "--").replace(/–/g, "-");
    if (wrap === 0) {
      return str;
    } else {
      str = str.replace(/\t/g, "    ");
    }
    const result = [];
    str.split("\n").forEach((line) => {
      var _a2, _b2;
      const chunkRegExp = new RegExp(/(?<spaces>[ ]*|^)(?<word>[^ ]+|$)/g);
      let insert = "";
      let insertLength = 0;
      let chunk = chunkRegExp.exec(line);
      while ((chunk == null ? void 0 : chunk[0]) !== "") {
        if (!chunk) break;
        const spaces = (_a2 = chunk.groups) == null ? void 0 : _a2.spaces;
        const word = (_b2 = chunk.groups) == null ? void 0 : _b2.word;
        if (spaces === void 0 || word === void 0) {
          throw new Error("empty text wrap segment in: " + line);
        }
        const spacesLength = spaces.length;
        const wordLength = countCharLength(word);
        const potentialLength = insertLength + wordLength + spacesLength;
        if (potentialLength <= wrap || insert === "") {
          insert += spaces + word;
          insertLength += wordLength + spacesLength;
        } else {
          result.push(insert);
          insertLength = wordLength;
          insert = word;
        }
        chunk = chunkRegExp.exec(line);
      }
      result.push(insert);
    });
    const bodged = doAnsiWrapBodge ? ansiWrapBodge(result) : result;
    return bodged.join("\n");
  };
  const ansiWrapBodge = (arr) => {
    let wrappedTags = /* @__PURE__ */ new Set();
    const bodged = arr.map((line) => {
      const prevTags = wrappedTags.size ? [...wrappedTags].join("") : "";
      let pos = 0;
      while (pos < line.length) {
        if (line[pos] !== "\x1B") {
          pos += 1;
          continue;
        }
        if (line.slice(pos + 1).startsWith("[0m")) {
          wrappedTags = /* @__PURE__ */ new Set();
          pos += 4;
          continue;
        }
        const suffix = line.slice(pos + 1).match(/\[\d+m/);
        if (suffix) {
          const tag = line[pos] + suffix;
          wrappedTags.add(tag);
          pos += tag.length;
          continue;
        }
        pos += 1;
      }
      return prevTags + line;
    });
    return bodged;
  };
  const buildSerialDialogFromInfo = (f, node, info2) => {
    const serialDialogSettings = {
      wrap: SERIAL_DIALOG_WRAP,
      ...f.settings.serial || {},
      // global settings
      ...info2.settings
      // local settings
    };
    const serialDialog = {
      messages: []
    };
    serialDialog.messages = info2.messages.map(tagsToAnsiEscapes).map((message) => wrapText(message, serialDialogSettings.wrap, true));
    if (info2.options.length > 0) {
      const firstOptionType = info2.options[0].optionType;
      serialDialog[firstOptionType] = info2.options;
      const warnNodes = [];
      info2.options.forEach((option) => {
        if (option.optionType === "options") {
          option.label = tagsToAnsiEscapes(option.label);
        }
        option.label = wrapText(option.label, serialDialogSettings.wrap || SERIAL_DIALOG_WRAP);
        if (option.optionType !== firstOptionType) {
          const node2 = option.debug.node.firstChild;
          if (!node2) throw new Error("serial dialog had no first option node");
          warnNodes.push({ node: node2, fileName: f.fileName });
        }
      });
      if (warnNodes.length > 0) {
        f.p.newWarning({
          locations: warnNodes,
          message: `serial dialog option types mismatch; first type (${firstOptionType}) will be used`
        });
      }
    }
    return new SerialDialog(new MathlangLocation(f, node), serialDialog);
  };
  const longerAlignments = {
    BL: "BOTTOM_LEFT",
    TL: "TOP_LEFT",
    BR: "BOTTOM_RIGHT",
    TR: "TOP_RIGHT"
  };
  const buildDialogFromInfo = (f, node, info2, messageNodes) => {
    const ident = info2.identifier;
    let found = false;
    let specificSettings = {};
    if (ident.type === "label") {
      const settingsLookup = f.settings.label[ident.value];
      if (settingsLookup) {
        specificSettings = settingsLookup;
      } else {
        specificSettings = {
          ...f.settings.entity[ident.value],
          entity: ident.value
        };
      }
      found = true;
    } else if (ident.type === "name") {
      specificSettings.name = ident.value;
      found = true;
    }
    if (!found || ident.type === "entity") {
      specificSettings = f.settings.entity[ident.value] || {};
      specificSettings.entity = ident.value;
    }
    const dialogSettings = {
      wrap: DIALOG_WRAP,
      alignment: "BOTTOM_LEFT",
      ...f.settings.default,
      // global default settings
      ...specificSettings,
      // global specific settings
      ...info2.settings
      // local specific settings
    };
    const expandedAbbreviation = longerAlignments[dialogSettings.alignment];
    if (expandedAbbreviation) {
      dialogSettings.alignment = expandedAbbreviation;
    }
    const dialog = {
      ...dialogSettings,
      options: []
    };
    let options = [];
    const messages = info2.messages.map((message) => wrapText(message, dialogSettings.wrap));
    if (info2.options.length > 0) {
      options = info2.options;
      options.forEach((option, i2) => {
        if (options == null ? void 0 : options[i2]) {
          options[i2].label = wrapText(option.label, 0);
        }
      });
    }
    const lastIndex = messages.length - 1;
    messages.forEach((message, i2) => {
      const targetSize = lastIndex === i2 && dialog.options.length > 0 ? 1 : 5;
      const splitMessage = message.split("\n");
      if (splitMessage.length > targetSize) {
        let warningMessage = `dialog messages longer than 5 lines will wrap off the bottom`;
        if (lastIndex === i2 && dialog.options) {
          warningMessage = `messages before dialog options will collide if more than 1 line`;
        }
        if (!messageNodes[i2]) throw new Error("no associated node for message at index" + i2);
        f.p.newWarning({
          locations: [{ node: messageNodes[i2], fileName: f.fileName }],
          message: warningMessage,
          footer: `When wrapped:
` + splitMessage.map((v, i22, arr) => {
            let row = i22 + 1;
            if (arr.length > 9) {
              row = row < 10 ? "0" + row : row;
            }
            let ret = `${row}> ${v}`;
            if (i22 >= targetSize) {
              ret = ansiTags.r + `(x) ` + ret + ansiTags.reset;
            } else {
              ret = `    ` + ret;
            }
            return ret;
          }).join("\n")
        });
      }
    });
    return new Dialog(new MathlangLocation(f, node), {
      messages,
      options,
      settings: dialogSettings
    });
  };
  const actionSetBoolMaker = (f, node, _lhsSetAction, _rhsBoolExp) => {
    var _a2;
    const debug = new MathlangLocation(f, node);
    if (typeof _lhsSetAction === "string" && typeof _rhsBoolExp === "string") {
      return SET_SAVE_FLAG.toFlag(f, node, _lhsSetAction, _rhsBoolExp);
    }
    const lhsSetAction = typeof _lhsSetAction === "string" ? SET_SAVE_FLAG.toValue(_lhsSetAction, true) : _lhsSetAction;
    if (_rhsBoolExp instanceof BoolLiteral) {
      lhsSetAction.updateProp(_rhsBoolExp.value);
      return lhsSetAction;
    }
    const rhsBoolExp = typeof _rhsBoolExp === "string" ? CheckSaveFlag.quick(debug, _rhsBoolExp, true) : _rhsBoolExp;
    const cloneIfFalse = lhsSetAction.clone();
    cloneIfFalse.invert();
    if (rhsBoolExp instanceof BoolGetableAction || rhsBoolExp instanceof BoolComparison) {
      return simpleBranchMaker(f, node, rhsBoolExp, [lhsSetAction], [cloneIfFalse]);
    }
    return simpleBranchMaker(
      f,
      ((_a2 = rhsBoolExp.debug) == null ? void 0 : _a2.node) || node,
      rhsBoolExp,
      [lhsSetAction],
      [cloneIfFalse]
    );
  };
  const spreadValues = (f, commonFields, fieldsToSpread) => {
    let spreadSize = -Infinity;
    Object.values(fieldsToSpread).forEach((spreadField) => {
      const len = spreadField.captures.length;
      if (spreadSize === -Infinity) spreadSize = len;
      if (spreadSize !== len) {
        f.quickError(
          spreadField.node,
          `spreads must have the same count of items within a given action`
        );
        spreadSize = Math.max(spreadSize, len);
      }
    });
    if (spreadSize === -Infinity) {
      return [commonFields];
    }
    const ret = [];
    for (let i2 = 0; i2 < spreadSize; i2++) {
      const insert = { ...commonFields };
      Object.keys(fieldsToSpread).forEach((fieldName) => {
        const allValues = fieldsToSpread[fieldName].captures;
        const currValue = allValues[i2 % allValues.length];
        insert[fieldName] = currValue;
      });
      ret.push(insert);
    }
    return ret;
  };
  const handleAction = (f, node) => {
    const data = actionData[node.grammarType];
    if (!data) {
      const customFn = actionFns[node.grammarType];
      if (!customFn)
        throw new Error(
          `no action data nor handler function found for action ${node.grammarType}`
        );
      return customFn(f, node);
    }
    const action = {
      debug: new MathlangLocation(f, node),
      ...data.values
    };
    const captures = data.captures || [];
    const fieldsToSpread = {};
    captures.forEach((fieldName) => {
      const captureNode = node.childForFieldName(fieldName);
      if (captureNode === null) {
        if (!data.optionalCaptures || !data.optionalCaptures.includes(fieldName)) {
          throw new Error(
            `capture found for field not associated with action ${node.grammarType} (${fieldName})`
          );
        }
        return;
      }
      const capture = handleCapture(f, captureNode);
      if (!Array.isArray(capture)) {
        action[fieldName] = capture;
      } else {
        fieldsToSpread[fieldName] = {
          node: captureNode,
          captures: capture
        };
      }
    });
    const spreads = spreadValues(f, action, fieldsToSpread);
    const handleFn = data.handle;
    if (!handleFn) throw new Error("need action handling function?");
    const ret = spreads.map((v, i2) => {
      return handleFn(v, f, node, i2);
    });
    return ret.filter((v) => v !== void 0);
  };
  const actionFns = {
    action_show_dialog: (f, node) => {
      const tryName = optionalStringCaptureForFieldName(f, node, "dialog_name");
      const dialogName = tryName !== null ? tryName : autoIdentifierName(f, node);
      const dialogs = handleChildrenForFieldName(f, node, "dialog");
      const action = SHOW_DIALOG.quick(dialogName);
      if (dialogs.length) {
        if (!dialogs.every((v) => v instanceof Dialog)) {
          throw new Error("parsed dialogs not all of type Dialog");
        }
        const debug = new MathlangLocation(f, node);
        const dialogDefinition = DialogDefinition.quick(debug, dialogName, dialogs);
        return [dialogDefinition, action];
      }
      return [action];
    },
    action_concat_serial_dialog: (f, node) => {
      return actionShowSerialDialog(f, node, true);
    },
    action_show_serial_dialog: (f, node) => {
      return actionShowSerialDialog(f, node, false);
    }
  };
  const actionShowSerialDialog = (f, node, disable_newline = false) => {
    const tryName = optionalStringCaptureForFieldName(f, node, "serial_dialog_name");
    const name2 = tryName !== null ? tryName : autoIdentifierName(f, node);
    const serialDialogs = handleChildrenForFieldName(f, node, "serial_dialog");
    const action = SHOW_SERIAL_DIALOG.quick(name2, disable_newline);
    if (serialDialogs.length) {
      if (!(serialDialogs[0] instanceof SerialDialog)) {
        throw new Error("parsed serial dialogs not all of type SerialDialog");
      }
      const debug = new MathlangLocation(f, node);
      const serialDialoDefinition = SerialDialogDefinition.quick(debug, name2, serialDialogs[0]);
      return [serialDialoDefinition, action];
    }
    return [action];
  };
  const actionData = {
    action_return_statement: {
      // TODO: everything after is unreachable
      // Ditto some other actions, too
      handle: (v, f, node) => new ReturnStatement(new MathlangLocation(f, node))
    },
    action_continue_statement: {
      handle: (v, f, node) => new ContinueStatement(new MathlangLocation(f, node))
    },
    action_break_statement: {
      handle: (v, f, node) => new BreakStatement(new MathlangLocation(f, node))
    },
    action_close_dialog: {
      handle: () => new CLOSE_DIALOG()
    },
    action_close_serial_dialog: {
      handle: () => new CLOSE_SERIAL_DIALOG()
    },
    action_save_slot: {
      handle: () => new SLOT_SAVE()
    },
    action_load_slot: {
      captures: ["slot"],
      handle: (v) => new SLOT_LOAD(v)
    },
    action_erase_slot: {
      captures: ["slot"],
      handle: (v) => new SLOT_ERASE(v)
    },
    action_load_map: {
      captures: ["map"],
      handle: (v) => new LOAD_MAP(v)
    },
    action_goto_label: {
      captures: ["label"],
      handle: (v, f, node) => new GotoLabel(new MathlangLocation(f, node), v)
    },
    action_goto_index: {
      captures: ["action_index"],
      handle: (v) => new GOTO_ACTION_INDEX(v)
    },
    action_run_script: {
      captures: ["script"],
      handle: (v) => new RUN_SCRIPT(v)
    },
    action_non_blocking_delay: {
      captures: ["duration"],
      handle: (v) => new NON_BLOCKING_DELAY(v)
    },
    action_blocking_delay: {
      captures: ["duration"],
      handle: (v) => new BLOCKING_DELAY(v)
    },
    action_delete_command: {
      captures: ["command"],
      handle: (v) => new UNREGISTER_SERIAL_DIALOG_COMMAND(v)
    },
    action_delete_command_arg: {
      captures: ["command", "argument"],
      handle: (v) => new UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(v)
    },
    action_delete_alias: {
      captures: ["alias"],
      handle: (v) => new UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS(v)
    },
    action_hide_command: {
      values: { is_visible: false },
      captures: ["command"],
      handle: (v) => new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(v)
    },
    action_unhide_command: {
      values: { is_visible: true },
      captures: ["command"],
      handle: (v) => new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(v)
    },
    action_camera_shake: {
      captures: ["frequency", "amplitude", "duration"],
      handle: (v) => new SET_SCREEN_SHAKE(v)
    },
    action_camera_fade_in: {
      captures: ["color", "duration"],
      handle: (v) => new SCREEN_FADE_IN(v)
    },
    action_camera_fade_out: {
      captures: ["color", "duration"],
      handle: (v) => new SCREEN_FADE_OUT(v)
    },
    action_pause_script: {
      values: { bool_value: true },
      captures: ["script_slot", "entity"],
      handle: (v) => new SET_SCRIPT_PAUSE(v)
    },
    action_unpause_script: {
      values: { bool_value: false },
      captures: ["script_slot", "entity"],
      handle: (v) => new SET_SCRIPT_PAUSE(v)
    },
    action_play_entity_animation: {
      captures: ["entity", "animation", "play_count"],
      handle: (v) => new PLAY_ENTITY_ANIMATION(v)
    },
    action_set_warp_state: {
      captures: ["string"],
      handle: (v) => new SET_WARP_STATE(v)
    },
    action_set_serial_connect: {
      captures: ["serial_dialog"],
      handle: (v) => new SET_CONNECT_SERIAL_DIALOG(v)
    },
    action_set_alias: {
      captures: ["alias", "command"],
      handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND_ALIAS(v)
    },
    action_set_command: {
      values: { is_fail: false },
      captures: ["command", "script"],
      handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND(v)
    },
    action_set_command_fail: {
      values: { is_fail: true },
      captures: ["command", "script"],
      handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND(v)
    },
    action_set_command_arg: {
      values: { is_fail: true },
      captures: ["command", "argument", "script"],
      handle: (v) => new REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(v)
    },
    action_set_ambiguous: {
      // if the LHS is ambiguous (a variable name)
      values: {},
      captures: ["lhs", "rhs"],
      handle: (v, f, node, i2) => {
        var _a2, _b2, _c2, _d2;
        const lhs = coerceToString(f, node, v.lhs, "action_set_ambiguous lhs");
        if (v.rhs instanceof BoolLiteral) {
          return SET_SAVE_FLAG.toValue(lhs, v.rhs.value);
        }
        if (typeof v.rhs === "number") return MUTATE_VARIABLE.set(lhs, v.rhs);
        if (typeof v.rhs == "string") {
          if (i2 === void 0) throw new Error("undefined index");
          const lhsSquiggliesNode = ((_b2 = (_a2 = node.childForFieldName("lhs")) == null ? void 0 : _a2.namedChildren) == null ? void 0 : _b2[i2]) || node.childForFieldName("lhs");
          const rhsSquiggliesNode = ((_d2 = (_c2 = node.childForFieldName("rhs")) == null ? void 0 : _c2.namedChildren) == null ? void 0 : _d2[i2]) || node.childForFieldName("rhs");
          if (!lhsSquiggliesNode || !rhsSquiggliesNode) {
            throw new Error(`couldn't find nodes to squiggle`);
          }
          const printNodes = [lhsSquiggliesNode, rhsSquiggliesNode];
          const suggestion = v.rhs.includes(" ") ? '"' + v.rhs + '"' : v.rhs;
          f.p.newWarning({
            locations: printNodes.map((v2) => ({ node: v2, fileName: f.fileName })),
            message: "these identifiers could be ints or bools",
            footer: `Both identifiers will be interpreted as ints unless you coerce the right-hand side to a bool expression, like this:
    !!${suggestion}
To silence this warning, turn the RHS into a passthrough int expression (which will produce the same output), e.g.:
    ${suggestion} + 0
    ${suggestion} * 1`
          });
          const debug = new MathlangLocation(f, node);
          return MUTATE_VARIABLES.set(debug, lhs, v.rhs);
        }
        if (v.rhs instanceof EntityIntField) {
          return COPY_VARIABLE.intoVariable(v.rhs.entity, v.rhs.field, lhs);
        }
        if (v.rhs instanceof IntBinaryExpression) {
          const temporary = newTemporary(lhs);
          const steps = v.rhs.flatten([]);
          dropTemporary();
          steps.push(MUTATE_VARIABLES.set(v.rhs.debug, lhs, temporary));
          const debug = new MathlangLocation(f, node);
          return new MathlangSequence(debug, {
            steps,
            type: "parser-actions: action_set_ambiguous"
          });
        }
        if (v.rhs instanceof BoolExpression) {
          return actionSetBoolMaker(f, node, SET_SAVE_FLAG.toValue(lhs, true), v.rhs);
        }
        throw new Error("failed to parse");
      }
    },
    action_set_int: {
      // If we've matched this, we know the LHS is not a variable name.
      // Only option is an entity field.
      values: {},
      captures: ["lhs", "rhs"],
      handle: (v, f, node) => {
        const debug = new MathlangLocation(f, node);
        if (!(v.lhs instanceof EntityIntField)) {
          throw new Error("LHS not EntityIntField");
        }
        const entity = coerceToString(f, node, v.lhs.entity, "action_set_int entity");
        if (typeof v.rhs === "number") {
          if (v.lhs.field === "x") {
            return SET_ENTITY_X.quick(entity, v.rhs);
          }
          if (v.lhs.field === "y") {
            return SET_ENTITY_Y.quick(entity, v.rhs);
          }
          if (v.lhs.field === "primary_id") {
            return SET_ENTITY_PRIMARY_ID.quick(entity, v.rhs);
          }
          if (v.lhs.field === "secondary_id") {
            return SET_ENTITY_SECONDARY_ID.quick(entity, v.rhs);
          }
          if (v.lhs.field === "primary_id_type") {
            return SET_ENTITY_PRIMARY_ID_TYPE.quick(entity, v.rhs);
          }
          if (v.lhs.field === "current_animation") {
            return SET_ENTITY_CURRENT_ANIMATION.quick(entity, v.rhs);
          }
          if (v.lhs.field === "animation_frame") {
            return SET_ENTITY_CURRENT_FRAME.quick(entity, v.rhs);
          }
          if (v.lhs.field === "strafe") {
            return SET_ENTITY_MOVEMENT_RELATIVE.quick(entity, v.rhs);
          }
          if (v.lhs.field === "relative_direction") {
            return SET_ENTITY_DIRECTION_RELATIVE.quick(entity, v.rhs);
          }
          throw new Error("unidentified int_getable, field: " + v.lhs.field);
        }
        if (typeof v.rhs === "string") {
          return COPY_VARIABLE.intoField(v.rhs, v.lhs.entity, v.lhs.field);
        }
        if (v.rhs instanceof IntBinaryExpression) {
          const temporary = newTemporary();
          const steps = v.rhs.flatten([]);
          dropTemporary();
          steps.push(COPY_VARIABLE.intoField(temporary, v.lhs.entity, v.lhs.field));
          return new MathlangSequence(debug, {
            steps,
            type: "parser-actions: action_set_int"
          });
        }
        throw new Error("unknown RHS type");
      }
    },
    action_set_bool: {
      // If we've matched this, we know the LHS is not a variable name.
      values: {},
      captures: ["lhs", "rhs"],
      handle: (v, f, node) => {
        const debug = new MathlangLocation(f, node);
        if (!(v.lhs instanceof BoolSetable)) {
          throw new Error("LHS not a bool_setable");
        }
        if (typeof v.rhs === "boolean") v.rhs = BoolLiteral.quick(debug, v.rhs);
        if (typeof v.rhs === "string") v.rhs = CheckSaveFlag.quick(debug, v.rhs);
        if (!(v.rhs instanceof BoolExpression)) {
          throw new Error("RHS not a bool_expression");
        }
        if (v.lhs.type === "entity") {
          const entity = coerceToString(
            f,
            node,
            v.lhs.value,
            "SET_ENTITY_GLITCHED field entity"
          );
          const lhs = SET_ENTITY_GLITCHED.quick(entity, true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "light") {
          const lights = coerceToString(
            f,
            node,
            v.lhs.value,
            "SET_LIGHTS_STATE field lights"
          );
          const lhs = SET_LIGHTS_STATE.quick(lights, true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "player_control") {
          const lhs = SET_PLAYER_CONTROL.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "lights_control") {
          const lhs = SET_LIGHTS_CONTROL.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "hex_editor") {
          const lhs = SET_HEX_EDITOR_STATE.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "hex_dialog_mode") {
          const lhs = SET_HEX_EDITOR_DIALOG_MODE.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "hex_control") {
          const lhs = SET_HEX_EDITOR_CONTROL.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "hex_clipboard") {
          const lhs = SET_HEX_EDITOR_CONTROL_CLIPBOARD.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        if (v.lhs.type === "serial_control") {
          const lhs = SET_SERIAL_DIALOG_CONTROL.quick(true);
          return actionSetBoolMaker(f, node, lhs, v.rhs);
        }
        throw new Error("unknown LHS type");
      }
    },
    action_set_position: {
      values: {},
      captures: ["movable", "coordinate"],
      handle: (v, f, node) => {
        const debug = new MathlangLocation(f, node);
        if (!(v.movable instanceof MovableIdentifier)) {
          throw new Error("invalid MovableIdentifier");
        }
        if (!(v.coordinate instanceof CoordinateIdentifier)) {
          throw new Error("invalid CoordinateIdentifier");
        }
        if (v.movable.type === "camera") {
          if (v.coordinate.type === "geometry" && v.coordinate.polygonType !== "length") {
            return TELEPORT_CAMERA_TO_GEOMETRY.quick(v.coordinate.value);
          }
          if (v.coordinate.type === "entity") {
            return SET_CAMERA_TO_FOLLOW_ENTITY.quick(v.coordinate.value);
          }
        } else if (v.movable.type === "entity") {
          if (v.coordinate.type === "geometry" && v.coordinate.polygonType !== "length") {
            return TELEPORT_ENTITY_TO_GEOMETRY.quick(v.movable.value, v.coordinate.value);
          }
          if (v.coordinate.type === "entity") {
            const variable = quickTemporary();
            const copyFrom = v.coordinate.value;
            const copyTo = v.movable.value;
            const steps = [
              COPY_VARIABLE.intoField(variable, copyFrom, "x"),
              COPY_VARIABLE.intoVariable(copyTo, "x", variable),
              COPY_VARIABLE.intoField(variable, copyFrom, "y"),
              COPY_VARIABLE.intoVariable(copyTo, "y", variable)
            ];
            return new MathlangSequence(debug, {
              steps,
              type: "parser-actions: action_set_position"
            });
          }
        }
        throw new Error("invalid everything");
      }
    },
    action_move_over_time: {
      values: {},
      captures: ["movable", "coordinate", "duration", "forever"],
      optionalCaptures: ["forever"],
      handle: (v, f, node) => {
        if (!(v.movable instanceof MovableIdentifier)) {
          throw new Error("invalid MovableIdentifier");
        }
        if (!(v.coordinate instanceof CoordinateIdentifier)) {
          throw new Error("invalid CoordinateIdentifier");
        }
        if (!(v.debug instanceof MathlangLocation)) {
          throw new Error("invalid debug node");
        }
        const duration = coerceToNumber(f, node, v.duration, "duration");
        if (v.movable.type === "camera") {
          if (v.coordinate.type === "entity") {
            if (v.forever) {
              f.quickError(
                v.debug.node,
                `cannot move camera to an entity's position forever`
              );
              return;
            } else {
              return PAN_CAMERA_TO_ENTITY.quick(v.coordinate.value, duration);
            }
          }
          if (v.coordinate.type === "geometry") {
            if (v.coordinate.polygonType === "length") {
              if (v.forever) {
                return LOOP_CAMERA_ALONG_GEOMETRY.quick(v.coordinate.value, duration);
              } else {
                return PAN_CAMERA_ALONG_GEOMETRY.quick(v.coordinate.value, duration);
              }
            } else if (v.coordinate.polygonType === "origin") {
              if (v.forever) {
                f.quickError(
                  v.debug.node,
                  `'forever' can only be used with geometry lengths, not single points`
                );
                return;
              } else {
                return PAN_CAMERA_TO_GEOMETRY.quick(v.coordinate.value, duration);
              }
            }
          }
        }
        if (v.movable.type === "entity") {
          if (v.coordinate.type === "entity") {
            f.quickError(
              v.debug.node,
              `cannot move an entity to another entity's position over time`
            );
            return;
          }
          if (v.coordinate.type === "geometry") {
            if (v.coordinate.polygonType === "length") {
              if (v.forever) {
                return LOOP_ENTITY_ALONG_GEOMETRY.quick(
                  v.movable.value,
                  v.coordinate.value,
                  duration
                );
              } else {
                return WALK_ENTITY_ALONG_GEOMETRY.quick(
                  v.movable.value,
                  v.coordinate.value,
                  duration
                );
              }
            }
            if (v.coordinate.polygonType === "origin") {
              if (v.forever) {
                f.quickError(
                  v.debug.node,
                  `'forever' can only be used with geometry lengths, not single points`
                );
                return;
              } else {
                return WALK_ENTITY_TO_GEOMETRY.quick(
                  v.movable.value,
                  v.coordinate.value,
                  duration
                );
              }
            }
          }
        }
      }
    },
    action_set_direction: {
      values: {},
      captures: ["entity", "target"],
      handle: (v, f, node) => {
        const entity = coerceToString(f, node, v.entity, "entity");
        if (!(v.target instanceof DirectionTarget)) {
          throw new Error("action_set_direction target not a DirectionTarget");
        }
        if (v.target.type === "nsew") {
          return SET_ENTITY_DIRECTION.quick(entity, v.target.value);
        }
        if (v.target.type === "geometry") {
          return SET_ENTITY_DIRECTION_TARGET_GEOMETRY.quick(entity, v.target.value);
        }
        if (v.target.type === "entity") {
          return SET_ENTITY_DIRECTION_TARGET_ENTITY.quick(entity, v.target.value);
        }
        throw new Error("invalid type of DirectionTarget");
      }
    },
    action_set_script: {
      values: {},
      captures: ["entity", "script_slot", "script"],
      handle: (v, f, node) => {
        const entity = coerceToString(f, node, v.entity, "entity");
        const script_slot = coerceToString(f, node, v.script_slot, "script_slot");
        const script = coerceToString(f, node, v.script, "script");
        if (entity === "%MAP%") {
          if (script_slot === "on_tick") {
            return SET_MAP_TICK_SCRIPT.quick(script);
          } else if (script_slot === "on_tick") {
            return SET_MAP_LOOK_SCRIPT.quick(script);
          }
          const errorNode2 = mandatoryChildForFieldName(f, node, "script_slot");
          f.quickError(
            errorNode2,
            `invalid map script slot`,
            `You can only set a map's 'on_tick' or 'on_look' slot`
          );
          return;
        }
        if (v.script_slot === "on_tick") {
          return SET_ENTITY_TICK_SCRIPT.quick(entity, script);
        }
        if (v.script_slot === "on_interact") {
          return SET_ENTITY_INTERACT_SCRIPT.quick(entity, script);
        }
        if (v.script_slot === "on_look") {
          return SET_ENTITY_LOOK_SCRIPT.quick(entity, script);
        }
        const errorNode = mandatoryChildForFieldName(f, node, "script_slot");
        f.quickError(
          errorNode,
          `invalid entity script slot`,
          `Valid entity script slots: 'on_tick', 'on_interact', 'on_look'`
        );
      }
    },
    action_set_entity_string: {
      values: {},
      captures: ["entity", "field", "value"],
      handle: (v, f, node) => {
        const entity = coerceToString(f, node, v.entity, "entity");
        const value = coerceToString(f, node, v.value, "value");
        if (v.field === "name") {
          return SET_ENTITY_NAME.quick(entity, value);
        } else if (v.field === "type") {
          return SET_ENTITY_TYPE.quick(entity, value);
        } else if (v.field === "path") {
          return SET_ENTITY_PATH.quick(entity, value);
        }
        throw new Error("invalid field?");
      }
    },
    action_op_equals: {
      values: {},
      captures: ["lhs", "operator", "rhs"],
      handle: (v, f, node) => {
        const debug = new MathlangLocation(f, node);
        const op = coerceToString(f, node, v.operator, "op");
        if (typeof v.lhs === "string") {
          if (typeof v.rhs === "number") {
            return MUTATE_VARIABLE.change(debug, v.lhs, v.rhs, op);
          }
          if (typeof v.rhs === "string") {
            return MUTATE_VARIABLES.change(v.lhs, v.rhs, op);
          }
          if (v.rhs instanceof EntityIntField) {
            const temp = quickTemporary();
            const steps = [
              COPY_VARIABLE.intoVariable(v.rhs.entity, v.rhs.field, temp),
              MUTATE_VARIABLES.change(v.lhs, temp, op)
            ];
            return new MathlangSequence(debug, {
              steps,
              type: "parser-actions: action_op_equals (LHS: string, RHS: IntGetable)"
            });
          }
          if (v.rhs instanceof IntBinaryExpression) {
            const temporary = newTemporary();
            if (!(v.rhs instanceof IntBinaryExpression)) {
              throw new Error("not IntBinaryExpression");
            }
            const steps = v.rhs.flatten([]);
            dropTemporary();
            steps.push(MUTATE_VARIABLES.change(v.lhs, temporary, op));
            return new MathlangSequence(debug, {
              steps,
              type: "action_op_equals (LHS: string, RHS: IntBinaryExpression)"
            });
          }
          throw new Error("unknown op equals type");
        }
        if (v.lhs instanceof EntityIntField) {
          if (typeof v.rhs === "number") {
            const temporary = newTemporary();
            const steps = [
              COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary),
              MUTATE_VARIABLE.change(debug, temporary, v.rhs, op),
              COPY_VARIABLE.intoField(temporary, v.lhs.entity, v.lhs.field)
            ];
            dropTemporary();
            return new MathlangSequence(debug, {
              steps,
              type: "parser-actions: action_op_equals (LHS: IntGetable, RHS: number)"
            });
          }
          if (typeof v.rhs === "string") {
            const temporary = newTemporary();
            const steps = [
              COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary),
              MUTATE_VARIABLES.change(temporary, v.rhs, op),
              COPY_VARIABLE.intoField(temporary, v.lhs.entity, v.lhs.field)
            ];
            dropTemporary();
            return new MathlangSequence(debug, {
              steps,
              type: "parser-actions: action_op_equals (LHS: IntGetable, RHS: string)"
            });
          }
          if (v.rhs instanceof IntBinaryExpression) {
            const temporary1 = newTemporary();
            const temporary2 = newTemporary();
            if (!(v.rhs instanceof IntBinaryExpression)) {
              throw new Error("not IntBinaryExpression");
            }
            const steps = [
              COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary1),
              ...v.rhs.flatten([]),
              MUTATE_VARIABLES.change(temporary1, temporary2, op),
              COPY_VARIABLE.intoField(temporary1, v.lhs.entity, v.lhs.field)
            ];
            dropTemporary();
            dropTemporary();
            return new MathlangSequence(debug, {
              steps,
              type: "parser-actions: action_op_equals (LHS: IntGetable, RHS: IntBinaryExpression)"
            });
          }
          if (v.rhs instanceof EntityIntField) {
            const temporary1 = newTemporary();
            const temporary2 = newTemporary();
            const steps = [
              COPY_VARIABLE.intoVariable(v.lhs.entity, v.lhs.field, temporary1),
              COPY_VARIABLE.intoVariable(v.rhs.entity, v.rhs.field, temporary2),
              MUTATE_VARIABLES.change(temporary1, temporary2, op),
              COPY_VARIABLE.intoField(temporary1, v.lhs.entity, v.lhs.field)
            ];
            dropTemporary();
            dropTemporary();
            return new MathlangSequence(debug, {
              steps,
              type: "parser-actions: action_op_equals (LHS: IntGetable, RHS: IntGetable)"
            });
          }
        }
        throw new Error("unknown op equals type");
      }
    },
    action_plus_minus_equals_ables: {
      values: {},
      captures: ["entity", "operator", "value"],
      handle: (v, f, node) => {
        const entity = coerceToString(f, node, v.entity, "entity");
        const op = coerceToString(f, node, v.operator, "operator");
        if (op !== "-=" && op !== "+=") {
          throw new Error("invalid op: " + op);
        }
        const value = coerceToNumber(f, node, v.value, "value");
        const sign = op === "-=" ? -1 : 1;
        return SET_ENTITY_DIRECTION_RELATIVE.quick(entity, sign * value);
      }
    }
  };
  const handleNode = (f, node) => {
    debugLog(`handleNode: ${node.grammarType}`);
    reportMissingChildNodes(f, node);
    reportErrorNodes(f, node);
    if (node.grammarType.startsWith("action_")) {
      return handleAction(f, node);
    }
    const nodeFn = nodeFns[node.grammarType];
    if (!nodeFn) {
      throw new Error("no parser-node function for " + node.grammarType);
    }
    const ret = nodeFn(f, node);
    return ret;
  };
  const includeRecursion = [];
  const nodeFns = {
    line_comment: () => [],
    block_comment: () => [],
    semicolon: () => [],
    ERROR: (f, node) => {
      if (node.namedChildren.some((v) => (v == null ? void 0 : v.grammarType) === "over_time_operator")) {
        f.quickError(
          node,
          `malformed 'do over time' expression`,
          `should take the form '@movable -> @coordinate over @duration [forever];'
   @movable = (player | self | entity @string) position | camera
   @coordinate = (player | self | entity @string) position | geometry @string (origin | length)`
        );
      }
      f.quickError(node, "syntax error");
      return [];
    },
    script_definition: (f, node) => {
      const scriptName = stringCaptureForFieldName(f, node, "script_name");
      const rawActions = handleNamedChildren(f, node.lastChild || node);
      const actions = [];
      rawActions.forEach((raw) => {
        if (raw instanceof MathlangSequence) {
          raw.steps.forEach((step) => actions.push(step));
        } else if (raw instanceof JSONLiteral) {
          raw.json.forEach((obj) => {
            if (typeof obj === "object" && obj.action) {
              actions.push(Action.fromArgs(obj));
            } else {
              f.quickError(raw.debug.node, "invalid JSON action: " + JSON.stringify(obj));
            }
          });
        } else {
          actions.push(raw);
        }
      });
      const returnLabel = "end of script " + f.p.advanceGotoSuffix();
      const lastChild = node.lastChild;
      if (!lastChild) throw new Error("could not find final node in script block");
      const labelAction = new LabelDefinition(
        new MathlangLocation(f, lastChild),
        {
          label: returnLabel
        }
      );
      actions.push(labelAction);
      actions.forEach((action, i2) => {
        if (action instanceof ReturnStatement) {
          actions[i2] = GotoLabel.quick(
            new MathlangLocation(f, action.debug.node),
            returnLabel
          );
        }
      });
      return [new ScriptDefinition(new MathlangLocation(f, node), { scriptName, actions })];
    },
    constant_assignment: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const label = textForFieldName(f, node, "label");
      const value = captureForFieldName(f, node, "value");
      if (!isMGSPrimitive(value)) {
        const valueNode = node.childForFieldName("value");
        f.quickError(valueNode || node, `constant value not an MGS primitive (${label})`);
        return [];
      }
      if (f.constants[label]) {
        f.quickError(node, `cannot redefine constant ${label}`);
      }
      f.constants[label] = {
        debug,
        value
      };
      return [ConstantDefinition.quick(debug, label, value)];
    },
    include_macro: (f, node) => {
      if (includeRecursion.includes(f.fileName)) {
        includeRecursion.push(f.fileName);
        throw new Error(
          `include_macro recursion
       ${includeRecursion.join("\n       -> ")}`
        );
      }
      includeRecursion.push(f.fileName);
      const fileName = stringCaptureForFieldName(f, node, "fileName");
      if (!f.p.fileMap[fileName].parsed) {
        f.p.parseFile(fileName);
      }
      debugLog(`include_macro: merging ${fileName} into ${f.fileName}...`);
      const newFile = f.p.fileMap[fileName].parsed;
      if (!newFile) throw new Error(`missing file to include: ${fileName}`);
      Object.keys(newFile.constants).forEach((constantName) => {
        if (f.constants[constantName]) {
          f.newError({
            message: `cannot redefine constant ${constantName} (via 'include')`,
            locations: [
              {
                fileName: newFile.fileName,
                node: newFile.constants[constantName].debug.node
              }
            ]
          });
        }
        f.constants[constantName] = newFile.constants[constantName];
      });
      newFile.nodes.forEach((node2) => {
        f.nodes.push(node2);
      });
      ["default", "serial"].forEach((type) => {
        Object.keys(newFile.settings[type]).forEach((param) => {
          f.settings[type][param] = newFile.settings[type][param];
        });
      });
      ["entity", "label"].forEach((type) => {
        Object.keys(newFile.settings[type]).forEach((target) => {
          const params = Object.keys(newFile.settings[type][target]);
          f.settings[type][target] = f.settings[type][target] || {};
          params.forEach((param) => {
            f.settings[type][target][param] = newFile.settings[type][target][param];
          });
        });
      });
      includeRecursion.pop();
      return [IncludeNode.quick(new MathlangLocation(f, node), fileName)];
    },
    rand_macro: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const horizontal = [];
      let spreadCount = -Infinity;
      node.namedChildren.filter((v) => v !== null).forEach((innerNode) => {
        const actions = handleNode(f, innerNode);
        const len = actions.length;
        if (len === 0) return;
        horizontal.push(actions);
        if (len === 1) return;
        if (spreadCount === -Infinity) spreadCount = len;
        if (spreadCount !== len) {
          f.quickError(
            innerNode,
            `spreads inside rand!() must contain same number of items`
          );
        }
      });
      const vertical = [];
      for (let i2 = 0; i2 < spreadCount; i2++) {
        const insert = horizontal.map((arr) => {
          return arr[i2 % arr.length];
        });
        vertical.push(insert);
      }
      const temp = quickTemporary();
      const iffs = vertical.map((body2, i2) => {
        return {
          condition: CheckVariable.quick(debug, temp, i2, "=="),
          debug,
          body: body2
        };
      });
      const sequence = ifChainMaker(f, node, iffs, [], "rand_macro");
      sequence.steps.unshift(MUTATE_VARIABLE.change(debug, temp, vertical.length, "?"));
      return [sequence];
    },
    label_definition: (f, node) => {
      const label = textForFieldName(f, node, "label");
      return [LabelDefinition.quick(new MathlangLocation(f, node), label)];
    },
    add_dialog_settings: (f, node) => {
      const targets = handleNamedChildren(f, node);
      if (!targets.every((v) => v instanceof AddDialogSettingsTarget)) {
        throw new Error("add_dialog_settings node not a AddDialogSettingsTarget");
      }
      return [AddDialogSettings.quick(new MathlangLocation(f, node), targets)];
    },
    add_dialog_settings_target: (f, node) => {
      let settingsTarget = {};
      const type = textForFieldName(f, node, "type");
      let target;
      if (type === "default") {
        settingsTarget = f.settings.default;
      } else if (type === "label" || type === "entity") {
        target = stringCaptureForFieldName(f, node, "target");
        f.settings[type][target] = f.settings[type][target] || {};
        settingsTarget = f.settings[type][target];
      } else {
        throw new Error(`unknown target type: ${type}`);
      }
      const parameters = capturesForFieldName(f, node, "dialog_parameter");
      if (!parameters.every((v) => v instanceof DialogParameter)) {
        throw new Error("not every dialog_parameter is a DialogParameter");
      }
      parameters.forEach((param) => {
        settingsTarget[param.property] = param.value;
      });
      const debug = new MathlangLocation(f, node);
      const ret = AddDialogSettingsTarget.quick(debug, type, parameters, target);
      return [ret];
    },
    add_serial_dialog_settings: (f, node) => {
      const parameters = capturesForFieldName(f, node, "serial_dialog_parameter");
      if (!parameters.every((v) => v instanceof SerialDialogParameter)) {
        throw new Error("not every serial_dialog_parameter is a SerialDialogParameter");
      }
      parameters.forEach((param) => {
        f.settings.serial[param.property] = param.value;
      });
      const debug = new MathlangLocation(f, node);
      return [AddSerialDialogSettings.quick(debug, parameters)];
    },
    serial_dialog_option: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const optionChar = textForFieldName(f, node, "option_type");
      let optionType = "options";
      if (optionChar === "_") optionType = "text_options";
      else if (optionChar !== "#") throw new Error("invalid option type: " + optionChar);
      const label = stringCaptureForFieldName(f, node, "label");
      const script = stringCaptureForFieldName(f, node, "script");
      return [SerialDialogOption.quick(debug, optionType, label, script)];
    },
    dialog_option: (f, node) => {
      const label = stringCaptureForFieldName(f, node, "label");
      const script = stringCaptureForFieldName(f, node, "script");
      const debug = new MathlangLocation(f, node);
      return [DialogOption.quick(debug, label, script)];
    },
    serial_dialog_definition: (f, node) => {
      const serialDialogNode = mandatoryChildForFieldName(f, node, "serial_dialog");
      const dialogName = stringCaptureForFieldName(f, node, "serial_dialog_name");
      const serialDialogs = handleNode(f, serialDialogNode);
      if (serialDialogs.length !== 1) {
        throw new Error("serial dialogs must have only 1 serial dialog");
      }
      const serialDialog = serialDialogs[0];
      if (!(serialDialog instanceof SerialDialog)) throw new Error("missing serial dialog");
      const debug = new MathlangLocation(f, node);
      return [SerialDialogDefinition.quick(debug, dialogName, serialDialog)];
    },
    dialog_definition: (f, node) => {
      const name2 = stringCaptureForFieldName(f, node, "dialog_name");
      const dialogs = handleChildrenForFieldName(f, node, "dialog");
      if (!dialogs.every((v) => v instanceof Dialog))
        throw new Error("not every dialog is a Dialog");
      const debug = new MathlangLocation(f, node);
      return [DialogDefinition.quick(debug, name2, dialogs)];
    },
    serial_dialog: (f, node) => {
      const settings = {};
      const params = capturesForFieldName(f, node, "serial_dialog_parameter");
      if (!params.every((v) => v instanceof SerialDialogParameter)) {
        throw new Error("not every serial dialog parameter is a SerialDialogParameter");
      }
      params.forEach((v) => {
        settings[v.property] = v.value;
      });
      const options = handleChildrenForFieldName(f, node, "serial_dialog_option");
      if (!options.every((v) => v instanceof SerialDialogOption)) {
        throw new Error("not every serial dialog option not aSerialDialogOption");
      }
      const messages = capturesForFieldName(f, node, "serial_message");
      if (!messages.every((v) => typeof v === "string")) {
        throw new Error("not every message is a string");
      }
      const info2 = {
        settings,
        messages,
        options
      };
      const serialDialog = buildSerialDialogFromInfo(f, node, info2);
      return [serialDialog];
    },
    dialog: (f, node) => {
      const identifier = captureForFieldName(f, node, "dialog_identifier");
      if (!(identifier instanceof DialogIdentifier)) {
        throw new Error("dialog_identifier is not a DialogIdentifier");
      }
      const settings = {};
      const params = capturesForFieldName(f, node, "dialog_parameter");
      if (!params.every((v) => v instanceof DialogParameter)) {
        throw new Error("not every dialog_parameter is a DialogParameter");
      }
      params.forEach((v) => {
        settings[v.property] = v.value;
      });
      const messageN = node.childrenForFieldName("message");
      const messages = messageN.map((v) => handleCapture(f, v));
      if (!messages.every((v) => typeof v === "string")) {
        throw new Error("not every dialog_message is a string");
      }
      const options = handleChildrenForFieldName(f, node, "dialog_option");
      if (!options.every((v) => v instanceof DialogOption)) {
        throw new Error("not every dialog_option is a DialogOption");
      }
      const info2 = {
        identifier,
        settings,
        messages,
        options
      };
      const dialogs = buildDialogFromInfo(f, node, info2, messageN);
      dialogs.debug = new MathlangLocation(f, node);
      return [dialogs];
    },
    json_literal: (f, node) => {
      const jsonNode = node.namedChildren[0];
      if (!jsonNode) throw new Error("could not find JSON node");
      const text = jsonNode.text;
      try {
        const parsed = JSON.parse(text);
        return [new JSONLiteral(new MathlangLocation(f, node), { json: parsed })];
      } catch {
        f.quickError(node, `JSON syntax error`, `Generic error. Check trailing commas!`);
      }
      return [];
    },
    copy_macro: (f, node) => {
      const script = stringCaptureForFieldName(f, node, "script");
      return [new CopyMacro(new MathlangLocation(f, node), { script })];
    },
    debug_macro: (f, node) => {
      const ret = [];
      let dialogName = "";
      const serialDialogNode = node.childForFieldName("serial_dialog");
      if (serialDialogNode) {
        const serialDialogs = handleNode(f, serialDialogNode);
        const serialDialog = serialDialogs[0];
        if (!(serialDialog instanceof SerialDialog)) {
          throw new Error("serial dialog not a SerialDialog");
        }
        dialogName = autoIdentifierName(f, node);
        ret.push(
          new SerialDialogDefinition(new MathlangLocation(f, node), {
            dialogName,
            serialDialog
          })
        );
      } else {
        dialogName = stringCaptureForFieldName(f, node, "serial_dialog_name");
      }
      const debug = new MathlangLocation(f, node);
      const condition = CheckDebugMode.quick(debug, true);
      const ifTrue = new SHOW_SERIAL_DIALOG({
        disable_newline: false,
        serial_dialog: dialogName
      });
      const action = simpleBranchMaker(f, node, condition, [ifTrue], []);
      ret.push(action);
      return ret;
    },
    looping_block: (f, node, printGotoLabel) => {
      return handleNamedChildren(f, node).map((v) => {
        if (Array.isArray(v)) return v;
        if (v instanceof ContinueStatement) {
          return GotoLabel.quick(
            new MathlangLocation(f, v.debug.node),
            `condition #${printGotoLabel}`
          );
        } else if (v instanceof BreakStatement) {
          return GotoLabel.quick(
            new MathlangLocation(f, v.debug.node),
            `rendezvous #${printGotoLabel}`
          );
        }
        return v;
      });
    },
    while_block: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const block = new ConditionalBlock(f, node, "while");
      const n = f.p.advanceGotoSuffix();
      const conditionL = `while condition #${n}`;
      const bodyL = `while body #${n}`;
      const rendezvousL = `while rendezvous #${n}`;
      const steps = [
        new LabelDefinition(debug, { label: conditionL }),
        ...block.condition.flatten(bodyL),
        GotoLabel.quick(new MathlangLocation(f, node), rendezvousL),
        new LabelDefinition(debug, { label: bodyL }),
        ...block.body,
        GotoLabel.quick(new MathlangLocation(f, block.conditionNode || node), conditionL),
        new LabelDefinition(debug, { label: rendezvousL })
      ];
      return [new MathlangSequence(debug, { steps, type: "parser-node: while_block" })];
    },
    do_while_block: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const doWhyle = new ConditionalBlock(f, node, "do while");
      const n = f.p.advanceGotoSuffix();
      const conditionL = `do while condition #${n}`;
      const bodyL = `do while body #${n}`;
      const rendezvousL = `do while rendezvous #${n}`;
      const steps = [
        new LabelDefinition(debug, { label: bodyL }),
        ...doWhyle.body,
        new LabelDefinition(debug, { label: conditionL }),
        ...doWhyle.condition.flatten(bodyL),
        new LabelDefinition(debug, { label: rendezvousL })
      ];
      return [new MathlangSequence(debug, { steps, type: "parser-node: do_while_block" })];
    },
    for_block: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const n = f.p.advanceGotoSuffix();
      const conditionL = `for condition #${n}`;
      const bodyL = `for body #${n}`;
      const rendezvousL = `for rendezvous #${n}`;
      const continueL = `for continue #${n}`;
      const conditionN = mandatoryChildForFieldName(f, node, "condition");
      const condition = handleCapture(f, conditionN);
      if (!(condition instanceof BoolExpression)) throw new Error("invalid condition");
      const bodyN = mandatoryChildForFieldName(f, node, "body");
      const incrementerN = mandatoryChildForFieldName(f, node, "incrementer");
      const body2 = handleNode(f, bodyN).map((v) => {
        if (v instanceof ContinueStatement)
          return GotoLabel.quick(new MathlangLocation(f, node), continueL);
        if (v instanceof BreakStatement)
          return GotoLabel.quick(new MathlangLocation(f, node), rendezvousL);
        return v;
      });
      const initializer = mandatoryChildForFieldName(f, node, "initializer");
      const steps = [
        ...handleNode(f, initializer),
        new LabelDefinition(debug, { label: conditionL }),
        ...condition.flatten(bodyL),
        GotoLabel.quick(new MathlangLocation(f, node), rendezvousL),
        new LabelDefinition(debug, { label: bodyL }),
        ...body2,
        new LabelDefinition(debug, { label: continueL }),
        ...handleNode(f, incrementerN),
        GotoLabel.quick(new MathlangLocation(f, conditionN), conditionL),
        new LabelDefinition(debug, { label: rendezvousL })
      ];
      return [new MathlangSequence(debug, { steps, type: "parser-node: for_block" })];
    },
    if_single: (f, node) => {
      const type = optionalTextForFieldName(f, node, "type");
      const conditionN = node.childForFieldName("condition");
      let condition = handleCapture(f, conditionN);
      if (typeof condition === "string") {
        const debug = new MathlangLocation(f, node);
        condition = CheckSaveFlag.quick(debug, condition, true);
      }
      if (typeof condition === "boolean" || condition instanceof BoolLiteral) {
        const value = condition instanceof BoolLiteral ? condition.value : condition;
        if (!type) {
          const script = stringCaptureForFieldName(f, node, "script");
          return value ? [RUN_SCRIPT.quick(script)] : [];
        } else if (type === "index") {
          const index = numberCaptureForFieldName(f, node, "index");
          return value ? [GOTO_ACTION_INDEX.quick(index)] : [];
        } else if (type === "label") {
          const label = stringCaptureForFieldName(f, node, "label");
          return value ? [GotoLabel.quick(new MathlangLocation(f, node), label)] : [];
        }
      }
      if (condition instanceof BoolComparison || condition instanceof BoolGetable) {
        if (!type) {
          const success_script = stringCaptureForFieldName(f, node, "script");
          return [condition.toAction({ success_script })];
        } else if (type === "index") {
          const jump_index = numberCaptureForFieldName(f, node, "index");
          return [condition.toAction({ jump_index })];
        } else if (type === "label") {
          const label = stringCaptureForFieldName(f, node, "label");
          return [condition.toAction({ label })];
        }
        return [condition];
      }
      throw new Error("invalid if_single");
    },
    if_chain: (f, node) => {
      const ifNodes = node.childrenForFieldName("if_block").filter((v) => v !== null);
      const iffs = ifNodes.map((v) => new ConditionalBlock(f, v, "if"));
      const elseNode = node.childForFieldName("else_block");
      const elseBody = newElse(f, elseNode);
      return [ifChainMaker(f, node, iffs, elseBody, "if_chain")];
    }
  };
  const opIntoStringMap$1 = {
    "=": "SET",
    "+": "ADD",
    "-": "SUB",
    "*": "MUL",
    "/": "DIV",
    "%": "MOD",
    "?": "RNG"
  };
  const handleCapture = (f, node) => {
    if (!node) throw new Error("null node");
    reportErrorNodes(f, node);
    reportMissingChildNodes(f, node);
    const grammarType = node.grammarType;
    if (grammarType.endsWith("_expansion")) {
      return node.namedChildren.map((v) => handleCapture(f, v)).flat();
    }
    if (grammarType === "CONSTANT") {
      const lookup = f.constants[node.text];
      if (lookup === void 0) {
        f.quickError(node, `Constant ${node.text} is undefined`);
      }
      return (lookup == null ? void 0 : lookup.value) !== void 0 ? lookup == null ? void 0 : lookup.value : node.text;
    }
    const fn = captureFns[grammarType];
    if (!fn) throw new Error(`no function found for grammar type ${grammarType}`);
    return fn(f, node);
  };
  const captureFns = {
    BOOL: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const text = node.text;
      if (text === "true") return BoolLiteral.quick(debug, true);
      if (text === "false") return BoolLiteral.quick(debug, false);
      if (text === "on") return BoolLiteral.quick(debug, true);
      if (text === "off") return BoolLiteral.quick(debug, false);
      if (text === "open") return BoolLiteral.quick(debug, true);
      if (text === "closed") return BoolLiteral.quick(debug, false);
      if (text === "down") return BoolLiteral.quick(debug, true);
      if (text === "up") return BoolLiteral.quick(debug, false);
      throw new Error("bool capture text not one of the mathlang bools");
    },
    BAREWORD: (f, node) => node.text,
    QUOTED_STRING: (f, node) => node.text.slice(1, -1),
    NUMBER: (f, node) => Number(node.text),
    DURATION: (f, node) => {
      const suffix = optionalTextForFieldName(f, node, "suffix");
      const int = textForFieldName(f, node, "NUMBER");
      let n = parseInt(int);
      if (suffix === "s") n *= 1e3;
      return n;
    },
    DISTANCE: (f, node) => parseInt(node.text),
    QUANTITY: (f, node) => {
      if (node.childCount === 0) {
        if (node.text === "once") return 1;
        if (node.text === "twice") return 2;
        if (node.text === "thrice") return 3;
      }
      const int = textForFieldName(f, node, "NUMBER");
      const n = parseInt(int);
      return n;
    },
    COLOR: (f, node) => {
      if (node.childCount === 0) {
        if (node.text === "white") return "#FFFFFF";
        if (node.text === "black") return "#000000";
        if (node.text === "red") return "#FF0000";
        if (node.text === "green") return "#00FF00";
        if (node.text === "blue") return "#0000FF";
        if (node.text === "magenta") return "#FF00FF";
        if (node.text === "cyan") return "#00FFFF";
        if (node.text === "yellow") return "#FFFF00";
      }
      if (node.text.length === 4) {
        const a = node.text[1];
        const b = node.text[2];
        const c = node.text[3];
        return `#${a}${a}${b}${b}${c}${c}`;
      }
      return node.text;
    },
    CONSTANT: (f, node) => node.text,
    op_equals: (f, node) => opIntoStringMap$1[node.text[0]],
    plus_minus_equals: (f, node) => node.text,
    forever: () => true,
    entity_or_map_identifier: (f, node) => {
      const type = optionalTextForFieldName(f, node, "type");
      return type === "map" ? "%MAP%" : extractEntityName(f, node);
    },
    entity_identifier: (f, node) => extractEntityName(f, node),
    movable_identifier: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const type = optionalTextForFieldName(f, node, "type");
      if (type === "camera") {
        return MovableIdentifier.quick(debug, "camera", "camera");
      } else {
        const value = extractEntityName(f, node);
        return MovableIdentifier.quick(debug, "entity", value);
      }
    },
    dialog_identifier: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const label = optionalTextForFieldName(f, node, "label");
      if (label) {
        return DialogIdentifier.quick(debug, "label", label);
      }
      const type = textForFieldName(f, node, "type");
      if (type !== "label" && type !== "entity" && type !== "name") {
        throw new Error("invalid dialog identifier type: " + type);
      }
      const value = stringCaptureForFieldName(f, node, "value");
      return DialogIdentifier.quick(debug, type, value);
    },
    dialog_parameter: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const property = textForFieldName(f, node, "property");
      const value = stringOrNumberCaptureForFieldName(f, node, "value");
      return DialogParameter.quick(debug, property, value);
    },
    serial_dialog_parameter: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const property = textForFieldName(f, node, "property");
      const value = stringOrNumberCaptureForFieldName(f, node, "value");
      return SerialDialogParameter.quick(debug, property, value);
    },
    coordinate_identifier: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const type = optionalTextForFieldName(f, node, "type");
      const polygonType = optionalTextForFieldName(f, node, "polygon_type");
      if (type === "entity_path") {
        return CoordinateIdentifier.quick(debug, "geometry", "%ENTITY_PATH%", polygonType);
      }
      if (type === "geometry") {
        const value = stringCaptureForFieldName(f, node, "geometry");
        return CoordinateIdentifier.quick(debug, "geometry", value, polygonType);
      }
      return CoordinateIdentifier.quick(debug, "entity", extractEntityName(f, node));
    },
    bool_setable: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const type = optionalTextForFieldName(f, node, "type");
      if (!type) {
        const value = stringCaptureForFieldName(f, node, "flag");
        return BoolSetable.quick(debug, "save_flag", value);
      }
      if (type === "glitched") {
        const value = stringCaptureForFieldName(f, node, "entity_identifier");
        return BoolSetable.quick(debug, "entity", value);
      }
      if (type === "light") {
        const value = stringCaptureForFieldName(f, node, "light");
        return BoolSetable.quick(debug, "light", value);
      }
      return BoolSetable.quick(debug, type, "");
    },
    int_binary_expression: (f, node) => {
      const rhsNode = mandatoryChildForFieldName(f, node, "rhs");
      const lhsNode = mandatoryChildForFieldName(f, node, "lhs");
      const op = textForFieldName(f, node, "operator");
      let rhs = handleCapture(f, rhsNode);
      let lhs = handleCapture(f, lhsNode);
      if (!(lhs instanceof IntBinaryExpression)) {
        lhs = IntUnit.fromAny(new MathlangLocation(f, lhsNode), lhs);
      }
      if (!(rhs instanceof IntBinaryExpression)) {
        rhs = IntUnit.fromAny(new MathlangLocation(f, rhsNode), rhs);
      }
      const debug = new MathlangLocation(f, node);
      return new IntBinaryExpression(debug, { lhs, rhs, op });
    },
    bool_binary_expression: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const rhsNode = mandatoryChildForFieldName(f, node, "rhs");
      const lhsNode = mandatoryChildForFieldName(f, node, "lhs");
      const op = textForFieldName(f, node, "operator");
      let rhs = handleCapture(f, rhsNode);
      let lhs = handleCapture(f, lhsNode);
      if (typeof lhs === "string") {
        lhs = CheckSaveFlag.quick(debug, lhs);
      }
      if (typeof rhs === "string") {
        rhs = CheckSaveFlag.quick(debug, rhs);
      }
      if (lhs instanceof BoolExpression && rhs instanceof BoolExpression) {
        return new BoolBinaryExpression(debug, {
          lhs,
          lhsNode,
          rhs,
          rhsNode,
          op
        });
      }
      throw new Error("invalid LHS and RHS combo for captured bool binary expression");
    },
    bool_grouping: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const capture = captureForFieldName(f, node, "inner");
      if (typeof capture === "boolean") {
        return BoolLiteral.quick(debug, capture);
      }
      if (typeof capture === "string") {
        return CheckSaveFlag.quick(debug, capture);
      }
      if (capture instanceof BoolExpression) return capture;
      throw new Error("bool_grouping capture did not yield BoolExpression");
    },
    bool_unary_expression: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const op = optionalTextForFieldName(f, node, "operator");
      if (op !== "!") throw new Error("captured unknown unary operator: " + op);
      const capture = captureForFieldName(f, node, "operand");
      if (typeof capture === "boolean") {
        return BoolLiteral.quick(debug, !capture);
      }
      if (typeof capture === "string") {
        return CheckSaveFlag.quick(debug, capture).invert();
      }
      if (capture instanceof BoolExpression) {
        let toInvert = capture;
        if (toInvert instanceof BoolBinaryExpression) {
          toInvert = toInvert.clone();
        }
        return toInvert.invert();
      }
      throw new Error("bool_unary_expression capture did not yield BoolExpression");
    },
    int_getable: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const entity = stringCaptureForFieldName(f, node, "entity_identifier");
      const field = textForFieldName(f, node, "property");
      return EntityIntField.quick(debug, entity, field);
    },
    bool_getable: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const type = optionalTextForFieldName(f, node, "type");
      if (type === "flag") {
        return CheckSaveFlag.quick(debug, stringCaptureForFieldName(f, node, "value"));
      } else if (type === "debug_mode") {
        return CheckDebugMode.quick(debug);
      } else if (type === "glitched") {
        return CheckEntityGlitched.quick(
          debug,
          stringCaptureForFieldName(f, node, "entity_identifier")
        );
      } else if (type === "intersects") {
        return CheckIfEntityIsInGeometry.quick(
          debug,
          stringCaptureForFieldName(f, node, "entity_identifier"),
          stringCaptureForFieldName(f, node, "geometry_identifier")
        );
      } else if (type === "dialog" || type === "serial_dialog") {
        const state = optionalTextForFieldName(f, node, "value");
        if (type === "dialog") {
          return CheckDialogOpen.quick(debug, state === "open");
        } else {
          return CheckSerialDialogOpen.quick(debug, state === "open");
        }
      } else if (type === "button") {
        const button_id = stringCaptureForFieldName(f, node, "button");
        const stateNode = mandatoryChildForFieldName(f, node, "state");
        if (stateNode.text === "pressed") {
          return CheckForButtonPress.quick(debug, button_id);
        } else {
          const state = handleCapture(f, stateNode);
          return CheckForButtonState.quick(
            debug,
            button_id,
            coerceAsBool(f, node, state, "button state")
          );
        }
      }
      throw new Error("failed to capture bool_getable");
    },
    string_checkable: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const entity = optionalStringCaptureForFieldName(f, node, "entity_identifier");
      if (entity === null) {
        const type = optionalTextForFieldName(f, node, "type");
        if (type === "warp_state") {
          return CheckWarpState.quick(debug, "");
        } else {
          throw new Error(
            `unidentifiable non-entity string_checkable: capturing type ${type}`
          );
        }
      }
      const property = textForFieldName(f, node, "property");
      if (property === "on_tick") {
        return CheckEntityTickScript.quick(debug, entity, "");
      } else if (property === "on_look") {
        return CheckEntityLookScript.quick(debug, entity, "");
      } else if (property === "on_interact") {
        return CheckEntityInteractScript.quick(debug, entity, "");
      } else if (property === "name") {
        return CheckEntityName.quick(debug, entity, "");
      } else if (property === "path") {
        return CheckEntityPath.quick(debug, entity, "");
      } else if (property === "type") {
        return CheckEntityType.quick(debug, entity, "");
      }
      throw new Error(`could not capture entity string_checkable`);
    },
    number_checkable_equality: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const entity = stringCaptureForFieldName(f, node, "entity_identifier");
      const property = textForFieldName(f, node, "property");
      if (property === "x") {
        return CheckEntityX.quick(debug, entity, NaN);
      } else if (property === "y") {
        return CheckEntityY.quick(debug, entity, NaN);
      } else if (property === "primary_id") {
        return CheckEntityPrimaryID.quick(debug, entity, NaN);
      } else if (property === "secondary_id") {
        return CheckEntitySecondaryID.quick(debug, entity, NaN);
      } else if (property === "primary_id_type") {
        return CheckEntityPrimaryIDType.quick(debug, entity, NaN);
      } else if (property === "current_animation") {
        return CheckEntityCurrentAnimation.quick(debug, entity, NaN);
      } else if (property === "animation_frame") {
        return CheckEntityCurrentFrame.quick(debug, entity, NaN);
      } else if (property === "strafe") {
        const propertyNode = mandatoryChildForFieldName(f, node, "property");
        f.quickError(propertyNode, `this property is not supported in boolean expressions`);
      }
      throw new Error("could not capture number_checkable_equality");
    },
    geometry_identifier: (f, node) => {
      const type = optionalTextForFieldName(f, node, "type");
      if (type === "entity_path") {
        return "%ENTITY_PATH%";
      }
      return stringCaptureForFieldName(f, node, "geometry");
    },
    entity_direction: (f, node) => {
      return stringCaptureForFieldName(f, node, "entity_identifier");
    },
    bool_comparison: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const lhsNode = mandatoryChildForFieldName(f, node, "lhs");
      const rhsNode = mandatoryChildForFieldName(f, node, "rhs");
      const op = textForFieldName(f, node, "operator");
      if (lhsNode.grammarType === "entity_direction") {
        return compareNSEW(f, node, lhsNode, rhsNode, op);
      }
      if (rhsNode.grammarType === "entity_direction") {
        return compareNSEW(f, node, rhsNode, lhsNode, op);
      }
      if (lhsNode.grammarType === "string_checkable") {
        return compareString(f, node, lhsNode, rhsNode, op);
      }
      if (rhsNode.grammarType === "string_checkable") {
        return compareString(f, node, rhsNode, lhsNode, op);
      }
      if (lhsNode.grammarType === "number_checkable_equality") {
        return compareNumberCheckableEquality(f, node, lhsNode, rhsNode, op);
      }
      if (rhsNode.grammarType === "number_checkable_equality") {
        return compareNumberCheckableEquality(f, node, rhsNode, lhsNode, op);
      }
      const lhs = handleCapture(f, lhsNode);
      const rhs = handleCapture(f, rhsNode);
      if (typeof lhs === "string") {
        if (typeof rhs === "string") {
          return CheckVariables.quick(debug, lhs, rhs, op);
        } else if (typeof rhs === "number") {
          return CheckVariable.quick(debug, lhs, rhs, op);
        }
      } else if (typeof lhs === "number") {
        if (typeof rhs === "string") {
          return CheckVariable.quick(debug, rhs, lhs, inverseOpMap[op]);
        } else if (typeof rhs === "number") {
          if (op === "<") return BoolLiteral.quick(debug, lhs < rhs);
          if (op === "<=") return BoolLiteral.quick(debug, lhs <= rhs);
          if (op === ">") return BoolLiteral.quick(debug, lhs > rhs);
          if (op === ">=") return BoolLiteral.quick(debug, lhs >= rhs);
          if (op === "==") return BoolLiteral.quick(debug, lhs == rhs);
          if (op === "!=") return BoolLiteral.quick(debug, lhs != rhs);
          throw new Error(`invalid op in captured bool comparison: ${op}`);
        }
      }
      throw new Error("failed to capture bool_comparison");
    },
    int_setable: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const entity = stringCaptureForFieldName(f, node, "entity_identifier");
      const field = textForFieldName(f, node, "property");
      return EntityIntField.quick(debug, entity, field);
    },
    int_grouping: (f, node) => {
      const capture = handleCapture(f, node.namedChildren[0]);
      if (capture instanceof IntExpression) return capture;
      throw new Error("captured int_grouping did not produce IntExpression");
    },
    direction_target: (f, node) => {
      const debug = new MathlangLocation(f, node);
      const direction = optionalTextForFieldName(f, node, "nsew");
      if (direction) {
        return DirectionTarget.quick(debug, "nsew", direction);
      }
      const target_geometry = optionalStringCaptureForFieldName(f, node, "geometry");
      if (target_geometry) {
        return DirectionTarget.quick(debug, "geometry", target_geometry);
      }
      const target_entity = optionalStringCaptureForFieldName(f, node, "entity");
      if (target_entity) {
        return DirectionTarget.quick(debug, "entity", target_entity);
      }
      throw new Error("could not capture direction_target");
    },
    set_entity_string_field: (f, node) => node.text
  };
  const compareNSEW = (f, node, entityNode, nsewNode, op) => {
    if (op !== "==" && op !== "!=") {
      throw new Error("invalid op for bool_comparison compareNSEW: " + op);
    }
    const debug = new MathlangLocation(f, node);
    const entity = stringCaptureForFieldName(f, entityNode, "entity_identifier");
    return CheckEntityDirection.quick(debug, entity, nsewNode.text, op === "==");
  };
  const compareString = (f, node, checkableNode, stringNode, op) => {
    const checkable = handleCapture(f, checkableNode);
    if (!(checkable instanceof StringCheckable)) {
      throw new Error("invalid StringCheckable");
    }
    if (op !== "==" && op !== "!=") {
      throw new Error("invalid op for bool_comparison: " + op);
    }
    const string = handleCapture(f, stringNode);
    checkable.updateProp(coerceToString(f, stringNode, string, "compareString"));
    checkable.expected_bool = op === "==";
    return checkable;
  };
  const compareNumberCheckableEquality = (f, node, checkableNode, numberNode, op) => {
    const checkable = handleCapture(f, checkableNode);
    if (!(checkable instanceof NumberCheckableEquality)) throw new Error("not a thing");
    if (op !== "==" && op !== "!=") {
      throw new Error("invalid op for bool_comparison compareNumberCheckableEquality: " + op);
    }
    const number = handleCapture(f, numberNode);
    if (typeof number !== "number") {
      f.quickError(numberNode, `This action can only compare to number literals`);
    }
    checkable.updateProp(
      coerceToNumber(f, numberNode, number, "compareNumberCheckableEquality expected number")
    );
    checkable.expected_bool = op === "==";
    return checkable;
  };
  const extractEntityName = (f, node) => {
    const type = optionalTextForFieldName(f, node, "type");
    if (type === "self") return "%SELF%";
    if (type === "player") return "%PLAYER%";
    if (type !== "entity") throw new Error("Entity identifier not an entity?");
    return stringCaptureForFieldName(f, node, "entity");
  };
  const handleChildrenForFieldName = (f, node, fieldName) => {
    const children = node.childrenForFieldName(fieldName);
    return children.filter((v) => v !== null).map((v) => handleNode(f, v)).flat();
  };
  const handleNamedChildren = (f, node) => {
    return node.namedChildren.filter((v) => v !== null).map((v) => handleNode(f, v)).flat();
  };
  const mandatoryChildForFieldName = (f, node, fieldName) => {
    const child = node.childForFieldName(fieldName);
    if (child === null) throw new Error("missing child for field name " + fieldName);
    return child;
  };
  const stringCaptureForFieldName = (f, node, fieldName) => {
    const captureNode = mandatoryChildForFieldName(f, node, fieldName);
    const capture = handleCapture(f, captureNode);
    if (typeof capture === "string") return capture;
    throw new Error(`capture from field ${fieldName} not a string`);
  };
  const optionalStringCaptureForFieldName = (f, node, fieldName) => {
    const captureNode = node.childForFieldName(fieldName);
    if (!captureNode) return null;
    const capture = handleCapture(f, captureNode);
    if (typeof capture === "string") return capture;
    throw new Error(`capture from field ${fieldName} not a string`);
  };
  const stringOrNumberCaptureForFieldName = (f, node, fieldName) => {
    const captureNode = mandatoryChildForFieldName(f, node, fieldName);
    const capture = handleCapture(f, captureNode);
    if (typeof capture === "string" || typeof capture === "number") return capture;
    throw new Error(`capture from field ${fieldName} not a string or number`);
  };
  const numberCaptureForFieldName = (f, node, fieldName) => {
    const captureNode = mandatoryChildForFieldName(f, node, fieldName);
    const capture = handleCapture(f, captureNode);
    if (typeof capture === "number") return capture;
    throw new Error(`capture from field ${fieldName} not a number`);
  };
  const captureForFieldName = (f, node, fieldName) => {
    const captureNode = node.childForFieldName(fieldName);
    if (!captureNode) return void 0;
    return handleCapture(f, captureNode);
  };
  const capturesForFieldName = (f, node, fieldName) => {
    return (node.childrenForFieldName(fieldName) || []).map((v) => handleCapture(f, v)).flat();
  };
  const optionalTextForFieldName = (f, node, fieldName) => {
    const captureNode = node.childForFieldName(fieldName);
    if (!captureNode) return void 0;
    return captureNode.text;
  };
  const textForFieldName = (f, node, fieldName) => {
    const captureNode = mandatoryChildForFieldName(f, node, fieldName);
    return captureNode.text;
  };
  const coerceToString = (f, node, v, label) => {
    if (typeof v !== "string") {
      f.newError({
        locations: [
          {
            node: f.constants[node.text].debug.node,
            fileName: f.constants[node.text].debug.fileName
          },
          { node, fileName: f.fileName }
        ],
        message: `${label} is not a string`
      });
      return "";
    }
    return v;
  };
  const coerceToNumber = (f, node, v, label) => {
    if (typeof v !== "number") {
      f.newError({
        locations: [
          {
            node: f.constants[node.text].debug.node,
            fileName: f.constants[node.text].debug.fileName
          },
          { node, fileName: f.fileName }
        ],
        message: `${label} is not a number`
      });
      return NaN;
    }
    return v;
  };
  const coerceAsBool = (f, node, v, label) => {
    if (v instanceof BoolLiteral) {
      return v.value;
    }
    if (typeof v !== "boolean") {
      f.newError({
        locations: [
          {
            node: f.constants[node.text].debug.node,
            fileName: f.constants[node.text].debug.fileName
          },
          { node, fileName: f.fileName }
        ],
        message: `${label} is not a boolean`
      });
      return false;
    }
    return v;
  };
  class AnyNode {
    clone() {
      if (this instanceof MathlangNode) return this.clone();
      return Action.fromArgs(this);
    }
  }
  class MathlangNode extends AnyNode {
    constructor() {
      super(...arguments);
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
    }
    clone() {
      return this.constructor(MathlangNode);
    }
    print() {
      return `// MATHLANG: ${this.mathlang}`;
    }
  }
  const isMGSPrimitive = (v) => {
    if (typeof v === "string") return true;
    if (typeof v === "number") return true;
    if (typeof v === "boolean" || v instanceof BoolLiteral) return true;
    return false;
  };
  class MathlangLocation {
    constructor(f, node, comment) {
      __publicField(this, "f");
      __publicField(this, "node");
      __publicField(this, "fileName");
      __publicField(this, "comment");
      this.f = f;
      this.fileName = f.fileName;
      this.node = node;
      if (comment) this.comment = comment;
    }
  }
  const truncate = (s, n) => {
    const orig = s.replace(/\n/g, " ");
    return s.length > n + 3 ? orig.slice(0, n) + "..." : orig;
  };
  class AddDialogSettings extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "targets");
      if (!args2.targets || !Array.isArray(args2.targets) || !args2.targets.every((v) => v instanceof AddDialogSettingsTarget)) {
        throw new Error("AddDialogSettings not given valid AddDialogSettingsTarget[]");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "add_dialog_settings";
      this.targets = args2.targets;
    }
    clone() {
      return new AddDialogSettings(this.debug, this.args);
    }
    static quick(debug, targets) {
      return new AddDialogSettings(debug, { targets });
    }
  }
  class AddDialogSettingsTarget extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "type");
      __publicField(this, "debug");
      __publicField(this, "parameters");
      __publicField(this, "target");
      if (!args2.parameters || !Array.isArray(args2.parameters) || !args2.parameters.every((v) => v instanceof DialogParameter)) {
        throw new Error("AddDialogSettingsTarget not given valid DialogParameter[]");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "add_dialog_settings_target";
      this.type = breakIfNotString(args2.type);
      this.parameters = args2.parameters;
      if (typeof args2.target === "string") this.target = args2.target;
    }
    clone() {
      return new AddDialogSettingsTarget(this.debug, this.args);
    }
    static quick(debug, type, parameters, target) {
      return new AddDialogSettingsTarget(debug, {
        type,
        parameters,
        target
      });
    }
  }
  class AddSerialDialogSettings extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "parameters");
      __publicField(this, "debug");
      if (!args2.parameters || !Array.isArray(args2.parameters) || !args2.parameters.every((v) => v instanceof SerialDialogParameter)) {
        throw new Error("AddSerialDialogSettings not given valid SerialDialogParameter[]");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "add_serial_dialog_settings";
      this.parameters = args2.parameters;
    }
    clone() {
      return new AddSerialDialogSettings(this.debug, this.args);
    }
    static quick(debug, parameters) {
      return new AddSerialDialogSettings(debug, {
        parameters
      });
    }
  }
  class ReturnStatement extends MathlangNode {
    constructor(debug) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      this.args = {};
      this.debug = debug;
      this.mathlang = "return_statement";
    }
    clone() {
      return new ReturnStatement(this.debug);
    }
  }
  class ContinueStatement extends MathlangNode {
    constructor(debug) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      this.args = {};
      this.debug = debug;
      this.mathlang = "continue_statement";
    }
    clone() {
      return new ContinueStatement(this.debug);
    }
  }
  class BreakStatement extends MathlangNode {
    constructor(debug) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      this.args = {};
      this.debug = debug;
      this.mathlang = "break_statement";
    }
    clone() {
      return new BreakStatement(this.debug);
    }
  }
  class GotoLabel extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "label");
      __publicField(this, "comment");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "goto_label";
      this.label = breakIfNotString(args2.label);
      if (typeof args2.comment === "string") this.comment = args2.comment;
    }
    clone() {
      return new GotoLabel(this.debug, this.args);
    }
    static quick(debug, label) {
      return new GotoLabel(debug, { label });
    }
    print() {
      return `${printGotoSegment(this)};`;
    }
  }
  class DialogDefinition extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "dialogName");
      __publicField(this, "dialogs");
      if (!args2.dialogs || !Array.isArray(args2.dialogs) || !args2.dialogs.every((v) => v instanceof Dialog)) {
        throw new Error("DialogDefinition not given valid Dialog[]");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "dialog_definition";
      this.dialogName = breakIfNotString(args2.dialogName);
      this.dialogs = args2.dialogs;
    }
    clone() {
      return new DialogDefinition(this.debug, this.args);
    }
    static quick(debug, dialogName, dialogs) {
      return new DialogDefinition(debug, { dialogName, dialogs });
    }
    print() {
      const truncated = truncate(this.dialogs[0].messages[0], 40);
      return `// auto dialog: "${truncated}"`;
    }
  }
  class DialogParameter extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "property");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "dialog_parameter";
      this.property = breakIfNotString(args2.property);
      this.value = breakIfNotStringOrNumber(args2.value);
    }
    clone() {
      return new DialogParameter(this.debug, this.args);
    }
    static quick(debug, property, value) {
      return new DialogParameter(debug, { property, value });
    }
  }
  class Dialog extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "wrap");
      __publicField(this, "emote");
      __publicField(this, "entity");
      __publicField(this, "name");
      __publicField(this, "portrait");
      __publicField(this, "alignment");
      __publicField(this, "border_tileset");
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "messages");
      __publicField(this, "response_type");
      __publicField(this, "options");
      if (!args2.messages || !Array.isArray(args2.messages) || !args2.messages.every((v) => typeof v === "string")) {
        throw new Error("Dialog not given valid messages:string[]");
      }
      if (args2.options && Array.isArray(args2.options)) {
        if (args2.options.length && args2.options.every((v) => v instanceof DialogOption)) {
          this.options = args2.options;
          this.response_type = "SELECT_FROM_SHORT_LIST";
        }
      }
      this.mathlang = "dialog";
      this.args = args2;
      this.debug = debug;
      this.messages = args2.messages;
      if (typeof args2.settings === "object" && args2.settings !== null) {
        Object.entries(args2.settings).forEach(([k, v]) => {
          this[k] = v;
        });
      }
    }
    clone() {
      return new DialogParameter(this.debug, this.args);
    }
  }
  class DialogIdentifier extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "type");
      __publicField(this, "value");
      if (args2.type !== "label" && args2.type !== "entity" && args2.type !== "name") {
        throw new Error("invalid DialogIdentifier type");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "dialog_identifier";
      this.type = args2.type;
      this.value = breakIfNotString(args2.value);
    }
    clone() {
      return new DialogIdentifier(this.debug, this.args);
    }
    static quick(debug, type, value) {
      return new DialogIdentifier(debug, { type, value });
    }
  }
  class DialogOption extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "label");
      __publicField(this, "script");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "dialog_option";
      this.label = breakIfNotString(args2.label);
      this.script = breakIfNotString(args2.script);
    }
    clone() {
      return new DialogOption(this.debug, this.args);
    }
    static quick(debug, label, script) {
      return new DialogOption(debug, {
        label,
        script
      });
    }
  }
  class SerialDialogDefinition extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "dialogName");
      __publicField(this, "serialDialog");
      if (!(args2.serialDialog instanceof SerialDialog)) {
        throw new Error("SerialDialogDefinition not given valid SerialDialog");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "serial_dialog_definition";
      this.dialogName = breakIfNotString(args2.dialogName);
      this.serialDialog = args2.serialDialog;
    }
    clone() {
      return new SerialDialogDefinition(this.debug, this.args);
    }
    static quick(debug, dialogName, serialDialog) {
      return new SerialDialogDefinition(debug, { dialogName, serialDialog });
    }
    print() {
      const truncated = truncate(this.serialDialog.messages[0], 40);
      return `// auto serial_dialog: "${truncated}"`;
    }
  }
  class SerialDialogParameter extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "property");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "serial_dialog_parameter";
      this.property = breakIfNotString(args2.property);
      this.value = breakIfNotStringOrNumber(args2.value);
    }
    clone() {
      return new SerialDialogParameter(this.debug, this.args);
    }
    static quick(debug, property, value) {
      return new SerialDialogParameter(debug, { property, value });
    }
  }
  class SerialDialog extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "messages");
      __publicField(this, "options");
      __publicField(this, "text_options");
      if (!args2.messages || !Array.isArray(args2.messages) || !args2.messages.every((v) => typeof v === "string")) {
        throw new Error("Dialog not given valid messages:string[]");
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "serial_dialog";
      this.messages = args2.messages;
      if (args2.options && Array.isArray(args2.options)) {
        if (args2.options.length && args2.options.every((v) => v instanceof SerialDialogOption)) {
          this.options = args2.options;
        }
      }
      if (args2.text_options && Array.isArray(args2.text_options)) {
        if (args2.text_options.length && args2.text_options.every((v) => v instanceof SerialDialogOption)) {
          this.text_options = args2.text_options;
        }
      }
    }
    clone() {
      return new SerialDialog(this.debug, this.args);
    }
  }
  class SerialDialogOption extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "optionType");
      __publicField(this, "label");
      __publicField(this, "script");
      if (args2.optionType !== "text_options" && args2.optionType !== "options") {
        throw new Error("invalid option type " + args2.optionType);
      }
      this.args = args2;
      this.debug = debug;
      this.mathlang = "serial_dialog_option";
      this.optionType = args2.optionType;
      this.label = breakIfNotString(args2.label);
      this.script = breakIfNotString(args2.script);
    }
    clone() {
      return new SerialDialogOption(this.debug, this.args);
    }
    static quick(debug, optionType, label, script) {
      return new SerialDialogOption(debug, {
        optionType,
        label,
        script
      });
    }
  }
  class IncludeNode extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "include_macro";
      this.value = breakIfNotString(args2.value);
    }
    clone() {
      return new IncludeNode(this.debug, this.args);
    }
    static quick(debug, value) {
      return new IncludeNode(debug, { value });
    }
  }
  class ConstantDefinition extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "label");
      __publicField(this, "value");
      if (!isMGSPrimitive(args2.value)) throw new Error("not primitive");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "constant_assignment";
      this.label = breakIfNotString(args2.label);
      this.value = args2.value;
    }
    clone() {
      return new ConstantDefinition(this.debug, this.args);
    }
    static quick(debug, label, value) {
      return new ConstantDefinition(debug, { label, value });
    }
  }
  class ScriptDefinition extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "scriptName");
      __publicField(this, "prePrint");
      __publicField(this, "testPrint");
      __publicField(this, "printed");
      __publicField(this, "rawNodes");
      __publicField(this, "actions");
      __publicField(this, "preActions");
      __publicField(this, "copyScriptResolved");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "script_definition";
      this.scriptName = breakIfNotString(args2.scriptName);
      if (typeof args2.prePrint === "string") this.prePrint = args2.prePrint;
      if (typeof args2.testPrint === "string") this.testPrint = args2.testPrint;
      if (typeof args2.printed === "string") this.printed = args2.printed;
      if (args2.rawNodes) {
        if (!Array.isArray(args2.rawNodes) || !args2.rawNodes.every((v) => v instanceof AnyNode)) {
          throw new Error("ScriptDefinition not given valid rawNodes:AnyNode[]");
        } else {
          this.rawNodes = args2.rawNodes;
        }
      }
      if (args2.preActions) {
        if (!Array.isArray(args2.preActions) || !args2.preActions.every((v) => v instanceof AnyNode)) {
          throw new Error("ScriptDefinition not given valid preActions:AnyNode[]");
        } else {
          this.preActions = args2.preActions;
        }
      }
      if (!args2.actions || !Array.isArray(args2.actions) || !args2.actions.every((v) => v instanceof AnyNode)) {
        throw new Error("ScriptDefinition not given valid actions:AnyNode[]");
      }
      this.actions = args2.actions;
      if (args2.copyScriptResolved) this.copyScriptResolved = true;
    }
    clone() {
      const cloned = new ScriptDefinition(this.debug, this.args);
      cloned.actions = cloned.actions.map((v) => v.clone());
      if (cloned.rawNodes) {
        cloned.rawNodes = cloned.rawNodes.map((v) => v.clone());
      }
      if (cloned.preActions) {
        cloned.preActions = cloned.preActions.map((v) => v.clone());
      }
      return cloned;
    }
  }
  class CommentNode extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "comment");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "comment";
      this.comment = breakIfNotString(args2.comment);
    }
    clone() {
      return new CommentNode(this.debug, this.args);
    }
    static quick(debug, comment) {
      return new CommentNode(debug, { comment });
    }
    print() {
      const truncated = truncate(this.comment, 70);
      return `// ${truncated}`;
    }
  }
  class LabelDefinition extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "label");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "label_definition";
      this.label = breakIfNotString(args2.label);
    }
    clone() {
      return new LabelDefinition(this.debug, this.args);
    }
    static quick(debug, label) {
      return new LabelDefinition(debug, { label });
    }
    print() {
      return `${sanitizeLabel(this.label)}:`;
    }
  }
  class JSONLiteral extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "json");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "json_literal";
      if (!Array.isArray(args2.json)) throw new Error("need array");
      try {
        this.json = JSON.parse(JSON.stringify(args2.json));
      } catch (e) {
        const error = new Error("failed to parse JSON in JSONLiteral constructor");
        error.cause = e;
        throw error;
      }
    }
    clone() {
      return new JSONLiteral(this.debug, this.args);
    }
  }
  class CopyMacro extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "script");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "copy_script";
      this.script = breakIfNotString(args2.script);
    }
    clone() {
      return new CopyMacro(this.debug, this.args);
    }
    print() {
      return `copy!("${this.script}")`;
    }
  }
  class MathlangSequence extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "type");
      __publicField(this, "steps");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "sequence";
      if (!args2.steps || !Array.isArray(args2.steps) || !args2.steps.every((v) => v instanceof AnyNode)) {
        throw new Error("MathlangSequence not given valid AnyNode[]");
      }
      this.type = breakIfNotString(args2.type);
      this.steps = args2.steps;
      if (!(this.steps[0] instanceof CommentNode)) {
        const innerComment = debug.node.text.replace(/[\n\s\t]+/g, " ");
        const comment = `${args2.type}: ${innerComment}`;
        const mathlangComment = CommentNode.quick(debug, comment);
        this.steps.unshift(mathlangComment);
      }
      const flatSteps = [];
      this.steps.forEach((v) => {
        if (v instanceof MathlangSequence) {
          flatSteps.push(...v.steps);
        } else {
          flatSteps.push(v);
        }
      });
      this.steps = flatSteps;
    }
    clone() {
      return new MathlangSequence(this.debug, this.args);
    }
  }
  class IntExpression extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      this.args = args2;
      this.debug = debug;
    }
  }
  class IntBinaryExpression extends IntExpression {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "mathlang");
      __publicField(this, "lhs");
      __publicField(this, "rhs");
      __publicField(this, "op");
      this.mathlang = "int_binary_expression";
      if (!(args2.lhs instanceof IntExpression)) {
        throw new Error("IntBinaryExpression LHS not IntExpression");
      }
      if (!(args2.rhs instanceof IntExpression)) {
        throw new Error("IntBinaryExpression RHS not IntExpression");
      }
      this.lhs = args2.lhs;
      this.rhs = args2.rhs;
      this.op = breakIfNotString(args2.op);
    }
    clone() {
      return new IntBinaryExpression(this.debug, this.args);
    }
    flatten(steps) {
      const temp = latestTemporary();
      const lhs = this.lhs;
      const op = this.op;
      const rhs = this.rhs;
      if (lhs instanceof IdentifierLiteral) {
        steps.push(MUTATE_VARIABLES.set(lhs.debug, temp, lhs.source));
      } else if (lhs instanceof NumberLiteral) {
        steps.push(MUTATE_VARIABLE.set(temp, lhs.value));
      } else if (lhs instanceof EntityIntField) {
        steps.push(COPY_VARIABLE.intoVariable(lhs.entity, lhs.field, temp));
      } else if (lhs instanceof IntBinaryExpression) {
        lhs.flatten(steps);
      }
      if (rhs instanceof IdentifierLiteral) {
        steps.push(MUTATE_VARIABLES.change(temp, rhs.source, op));
      } else if (rhs instanceof NumberLiteral) {
        if (invisibleMath(op, rhs.value)) ;
        else {
          steps.push(MUTATE_VARIABLE.change(rhs.debug, temp, rhs.value, op));
        }
      } else if (rhs instanceof EntityIntField) {
        const quickTemp = quickTemporary();
        steps.push(
          COPY_VARIABLE.intoVariable(rhs.entity, rhs.field, quickTemp),
          MUTATE_VARIABLES.change(temp, quickTemp, op)
        );
      } else if (rhs instanceof IntBinaryExpression) {
        const newTemp = newTemporary();
        rhs.flatten(steps);
        steps.push(MUTATE_VARIABLES.change(temp, newTemp, op));
        dropTemporary();
      }
      return steps;
    }
  }
  const invisibleMath = (op, operand) => {
    if (op === "+" && operand === 0) return true;
    if (op === "-" && operand === 0) return true;
    if (op === "*" && operand === 1) return true;
    if (op === "/" && operand === 1) return true;
    return false;
  };
  class IntUnit extends IntExpression {
    static fromAny(debug, v) {
      if (v instanceof IntBinaryExpression) return v;
      if (v instanceof EntityIntField) return v;
      if (debug.node instanceof Node && debug.node.grammarType === "CONSTANT" && typeof v !== "string" && typeof v !== "number") {
        if (!debug.f) throw new Error("missing f");
        v = coerceToString(debug.f, debug.node, v, "constant");
      }
      if (typeof v === "number") {
        return NumberLiteral.quick(debug, v);
      }
      if (typeof v === "string") {
        return IdentifierLiteral.quick(debug, v);
      }
      throw new Error("invalid IntUnit");
    }
  }
  class NumberLiteral extends IntUnit {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "value");
      this.value = breakIfNotNumber(args2.value);
    }
    static quick(debug, value) {
      return new NumberLiteral(debug, { value });
    }
    clone() {
      return new NumberLiteral(this.debug, this.args);
    }
  }
  class IntGetable extends IntUnit {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      this.mathlang = "int_getable";
      this.args = args2;
      this.debug = debug;
    }
    storeInVariable(variable) {
      return Action.fromArgs({ ...this, variable });
    }
    clone() {
      return new IntGetable(this.debug, this.args);
    }
  }
  class IdentifierLiteral extends IntGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "source");
      this.source = breakIfNotString(args2.source);
    }
    static quick(debug, source) {
      return new IdentifierLiteral(debug, { source });
    }
    clone() {
      return new IdentifierLiteral(this.debug, this.args);
    }
  }
  class EntityIntField extends IntGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "entity");
      __publicField(this, "field");
      __publicField(this, "inbound");
      this.inbound = false;
      this.entity = breakIfNotString(args2.entity);
      this.field = breakIfNotString(args2.field);
    }
    static quick(debug, entity, field) {
      return new EntityIntField(debug, { entity, field });
    }
    clone() {
      return new EntityIntField(this.debug, this.args);
    }
  }
  class BoolExpression extends MathlangNode {
    invert() {
      console.error("the children should be doing this, not me");
      return this;
    }
    flatten(ifLabel) {
      const debug = this.debug;
      if (this instanceof BoolLiteral && this.value === true) {
        return [GotoLabel.quick(debug, ifLabel)];
      } else if (this instanceof BoolLiteral && this.value === false) {
        return [];
      }
      if (typeof this === "string") {
        return [
          new CHECK_SAVE_FLAG({
            save_flag: this,
            expected_bool: true,
            label: ifLabel
          })
        ];
      }
      if (this instanceof BoolGetable || this instanceof BoolComparison) {
        return [Action.fromArgs({ ...this, label: ifLabel })];
      }
      if (!(this instanceof BoolBinaryExpression)) {
        throw new Error("expansion for condition not yet implemented");
      }
      const op = this.op;
      const lhs = this.lhs;
      const rhs = this.rhs;
      if (typeof lhs === "number" || typeof rhs === "number") {
        throw new Error("LHS or RHS not a number");
      }
      if (op === "||") {
        return [...lhs.flatten(ifLabel), ...rhs.flatten(ifLabel)];
      }
      if (op === "&&") {
        if (!debug.f) throw new Error("should have an f?");
        const suffix = debug.f.p.advanceGotoSuffix();
        const secondIfTrueLabel = `if true #${suffix}`;
        const secondRendezvousLabel = `rendezvous #${suffix}`;
        return [
          ...lhs.flatten(secondIfTrueLabel),
          GotoLabel.quick(debug, secondRendezvousLabel),
          new LabelDefinition(debug, { label: secondIfTrueLabel }),
          ...rhs.flatten(ifLabel),
          new LabelDefinition(debug, { label: secondRendezvousLabel })
        ];
      }
      if (op !== "==" && op !== "!=") {
        throw new Error("expected == or !==, found " + op);
      }
      const expandAs = new BoolBinaryExpression(debug, {
        op: "||",
        lhs: new BoolBinaryExpression(lhs.debug, {
          op: "&&",
          lhs,
          rhs,
          lhsNode: this.lhsNode,
          rhsNode: this.rhsNode
        }),
        rhs: new BoolBinaryExpression(rhs.debug, {
          op: "&&",
          lhs: lhs.invert(),
          rhs: rhs.invert(),
          lhsNode: this.lhsNode,
          rhsNode: this.rhsNode
        }),
        lhsNode: this.lhsNode,
        rhsNode: this.rhsNode
      });
      return expandAs.flatten(ifLabel);
    }
  }
  class BoolUnit extends BoolExpression {
  }
  class BoolLiteral extends BoolUnit {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "bool_literal";
      this.value = breakIfNotBool(args2.value);
    }
    static quick(debug, value) {
      return new BoolLiteral(debug, { value });
    }
    invert() {
      this.value = !this.value;
      return this;
    }
  }
  class BoolComparison extends BoolExpression {
    constructor() {
      super(...arguments);
      __publicField(this, "action");
      __publicField(this, "expected_bool");
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    getBool() {
      return this.expected_bool;
    }
    toAction(args2) {
      return Action.fromArgs({ ...this, ...args2 });
    }
  }
  class BoolBinaryExpression extends BoolExpression {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "lhs");
      __publicField(this, "rhs");
      __publicField(this, "op");
      __publicField(this, "lhsNode");
      __publicField(this, "rhsNode");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "bool_binary_expression";
      if (!(args2.lhs instanceof BoolExpression)) throw new Error("not BoolExpression");
      if (!(args2.rhs instanceof BoolExpression)) throw new Error("not BoolExpression");
      if (!(args2.lhsNode instanceof Node)) throw new Error("not TSNode");
      if (!(args2.rhsNode instanceof Node)) throw new Error("not TSNode");
      this.op = breakIfNotString(args2.op);
      this.lhs = args2.lhs;
      this.rhs = args2.rhs;
      this.lhsNode = args2.lhsNode;
      this.rhsNode = args2.rhsNode;
    }
    clone() {
      return new BoolBinaryExpression(this.debug, this.args);
    }
    invert() {
      if (this.op === "||" || this.op === "&&") {
        if (typeof this.lhs === "number" || typeof this.rhs === "number") {
          throw new Error("|| or && for a number??");
        }
        this.lhs = this.lhs.invert();
        this.rhs = this.rhs.invert();
      }
      this.op = inverseOpMap[this.op];
      return this;
    }
  }
  class BoolGetable extends BoolUnit {
    constructor(debug, args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "mathlang");
      __publicField(this, "args");
      __publicField(this, "debug");
      __publicField(this, "comment");
      __publicField(this, "expected_bool");
      this.mathlang = "bool_getable";
      this.debug = debug;
      this.args = args2;
    }
    getBool() {
      return this.expected_bool;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    toAction(args2) {
      return Action.fromArgs({ ...this, ...args2 });
    }
  }
  class CheckEntityGlitched extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      this.action = "CHECK_ENTITY_GLITCHED";
      this.entity = breakIfNotString(args2.entity);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, entity, provided_bool) {
      return new CheckEntityGlitched(debug, {
        entity,
        expected_bool: provided_bool === void 0 ? true : provided_bool
      });
    }
  }
  class CheckSaveFlag extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "save_flag");
      this.action = "CHECK_SAVE_FLAG";
      this.save_flag = breakIfNotString(args2.save_flag);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, save_flag, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckSaveFlag(debug, { save_flag, expected_bool });
    }
  }
  class CheckIfEntityIsInGeometry extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      this.action = "CHECK_IF_ENTITY_IS_IN_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.entity = breakIfNotString(args2.entity);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, entity, geometry, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckIfEntityIsInGeometry(debug, {
        entity,
        geometry,
        expected_bool
      });
    }
  }
  class CheckForButtonPress extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "button_id");
      this.action = "CHECK_FOR_BUTTON_PRESS";
      this.button_id = breakIfNotString(args2.button_id);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, button_id, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckForButtonPress(debug, { button_id, expected_bool });
    }
  }
  class CheckForButtonState extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "button_id");
      this.action = "CHECK_FOR_BUTTON_STATE";
      this.button_id = breakIfNotString(args2.button_id);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, button_id, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckForButtonState(debug, { button_id, expected_bool });
    }
  }
  class CheckDialogOpen extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      this.action = "CHECK_DIALOG_OPEN";
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckDialogOpen(debug, { expected_bool });
    }
  }
  class CheckSerialDialogOpen extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      this.action = "CHECK_SERIAL_DIALOG_OPEN";
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckSerialDialogOpen(debug, { expected_bool });
    }
  }
  class CheckDebugMode extends BoolGetable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      this.action = "CHECK_DEBUG_MODE";
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckDebugMode(debug, { expected_bool });
    }
  }
  class StringCheckable extends BoolComparison {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "comment");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "string_checkable";
      this.expected_bool = true;
    }
    updateProp(_) {
      throw new Error(`Parent should not be trying to change its string property (value ${_})`);
    }
  }
  class CheckEntityName extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "string");
      this.action = "CHECK_ENTITY_NAME";
      this.entity = breakIfNotString(args2.entity);
      this.string = breakIfNotString(args2.string);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.string = value;
    }
    getProp() {
      return this.string;
    }
    static quick(debug, entity, string, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityName(debug, {
        entity,
        string,
        expected_bool
      });
    }
  }
  class CheckEntityInteractScript extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_script");
      this.action = "CHECK_ENTITY_INTERACT_SCRIPT";
      this.entity = breakIfNotString(args2.entity);
      this.expected_script = breakIfNotString(args2.expected_script);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_script = value;
    }
    getProp() {
      return this.expected_script;
    }
    static quick(debug, entity, expected_script, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityInteractScript(debug, {
        entity,
        expected_script,
        expected_bool
      });
    }
  }
  class CheckEntityTickScript extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_script");
      this.action = "CHECK_ENTITY_TICK_SCRIPT";
      this.entity = breakIfNotString(args2.entity);
      this.expected_script = breakIfNotString(args2.expected_script);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_script = value;
    }
    getProp() {
      return this.expected_script;
    }
    static quick(debug, entity, expected_script, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityTickScript(debug, {
        entity,
        expected_script,
        expected_bool
      });
    }
  }
  class CheckEntityLookScript extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_script");
      this.action = "CHECK_ENTITY_LOOK_SCRIPT";
      this.entity = breakIfNotString(args2.entity);
      this.expected_script = breakIfNotString(args2.expected_script);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_script = value;
    }
    getProp() {
      return this.expected_script;
    }
    static quick(debug, entity, expected_script, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityLookScript(debug, {
        entity,
        expected_script,
        expected_bool
      });
    }
  }
  class CheckEntityType extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "entity_type");
      this.action = "CHECK_ENTITY_TYPE";
      this.entity = breakIfNotString(args2.entity);
      this.entity_type = breakIfNotString(args2.entity_type);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.entity_type = value;
    }
    getProp() {
      return this.entity_type;
    }
    static quick(debug, entity, entity_type, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityType(debug, { entity, entity_type, expected_bool });
    }
  }
  class CheckEntityDirection extends StringCheckable {
    // north, south, east, west
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "direction");
      this.action = "CHECK_ENTITY_DIRECTION";
      this.entity = breakIfNotString(args2.entity);
      this.direction = breakIfNotString(args2.direction);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.direction = value;
    }
    getProp() {
      return this.direction;
    }
    static quick(debug, entity, direction, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityDirection(debug, { entity, direction, expected_bool });
    }
  }
  class CheckEntityPath extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      this.action = "CHECK_ENTITY_PATH";
      this.entity = breakIfNotString(args2.entity);
      this.geometry = breakIfNotString(args2.geometry);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.geometry = value;
    }
    getProp() {
      return this.geometry;
    }
    static quick(debug, entity, geometry, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityPath(debug, { entity, geometry, expected_bool });
    }
  }
  class CheckWarpState extends StringCheckable {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "string");
      this.action = "CHECK_WARP_STATE";
      this.string = breakIfNotString(args2.string);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.string = value;
    }
    getProp() {
      return this.string;
    }
    static quick(debug, string, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckWarpState(debug, { string, expected_bool });
    }
  }
  class NumberComparison extends BoolComparison {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "comment");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "number_comparison";
      this.expected_bool = true;
    }
  }
  class CheckVariable extends NumberComparison {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "comparison");
      __publicField(this, "value");
      this.action = "CHECK_VARIABLE";
      this.variable = breakIfNotString(args2.variable);
      this.comparison = breakIfNotString(args2.comparison);
      this.value = breakIfNotNumber(args2.value);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, variable, value, comparison, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckVariable(debug, {
        variable,
        value,
        comparison,
        expected_bool
      });
    }
  }
  class CheckVariables extends NumberComparison {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "comparison");
      __publicField(this, "source");
      this.action = "CHECK_VARIABLES";
      this.variable = breakIfNotString(args2.variable);
      this.comparison = breakIfNotString(args2.comparison);
      this.source = breakIfNotString(args2.source);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(debug, variable, source, comparison, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckVariables(debug, {
        variable,
        source,
        comparison,
        expected_bool
      });
    }
  }
  class NumberCheckableEquality extends BoolComparison {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "comment");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "number_checkable_equality";
    }
    updateProp(_) {
      throw new Error(`Parent should not be trying to change its number property (value ${_})`);
    }
  }
  class CheckEntityX extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_X";
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityX(debug, { entity, expected_u2, expected_bool });
    }
  }
  class CheckEntityY extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_Y";
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityY(debug, { entity, expected_u2, expected_bool });
    }
  }
  class CheckEntityPrimaryID extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_PRIMARY_ID";
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityPrimaryID(debug, { entity, expected_u2, expected_bool });
    }
  }
  class CheckEntitySecondaryID extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_SECONDARY_ID";
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntitySecondaryID(debug, { entity, expected_u2, expected_bool });
    }
  }
  class CheckEntityPrimaryIDType extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_byte");
      this.action = "CHECK_ENTITY_PRIMARY_ID_TYPE";
      this.entity = breakIfNotString(args2.entity);
      this.expected_byte = breakIfNotNumber(args2.expected_byte);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_byte = value;
    }
    getProp() {
      return this.expected_byte;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_byte, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityPrimaryIDType(debug, {
        entity,
        expected_byte,
        expected_bool
      });
    }
  }
  class CheckEntityCurrentAnimation extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_byte");
      this.action = "CHECK_ENTITY_CURRENT_ANIMATION";
      this.entity = breakIfNotString(args2.entity);
      this.expected_byte = breakIfNotNumber(args2.expected_byte);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_byte = value;
    }
    getProp() {
      return this.expected_byte;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_byte, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityCurrentAnimation(debug, {
        entity,
        expected_byte,
        expected_bool
      });
    }
  }
  class CheckEntityCurrentFrame extends NumberCheckableEquality {
    constructor(debug, args2) {
      super(debug, args2);
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_byte");
      __publicField(this, "expected_bool");
      this.action = "CHECK_ENTITY_CURRENT_FRAME";
      this.entity = breakIfNotString(args2.entity);
      this.expected_byte = breakIfNotNumber(args2.expected_byte);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_byte = value;
    }
    getProp() {
      return this.expected_byte;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(debug, entity, expected_byte, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CheckEntityCurrentFrame(debug, {
        entity,
        expected_byte,
        expected_bool
      });
    }
  }
  class BoolSetable extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "type");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "bool_setable";
      this.value = breakIfNotString(args2.value);
      this.type = breakIfNotString(args2.type);
    }
    clone() {
      return new BoolSetable(this.debug, this.args);
    }
    static quick(debug, type, value) {
      return new BoolSetable(debug, { type, value });
    }
  }
  class MovableIdentifier extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "type");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "movable_identifier";
      this.value = breakIfNotString(args2.value);
      this.type = breakIfNotString(args2.type);
    }
    clone() {
      return new MovableIdentifier(this.debug, this.args);
    }
    static quick(debug, type, value) {
      return new MovableIdentifier(debug, { type, value });
    }
  }
  class CoordinateIdentifier extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "type");
      __publicField(this, "value");
      __publicField(this, "polygonType");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "coordinate_identifier";
      this.value = breakIfNotString(args2.value);
      this.type = breakIfNotString(args2.type);
      if (args2.polygonType) this.polygonType = breakIfNotString(args2.polygonType);
    }
    clone() {
      return new CoordinateIdentifier(this.debug, this.args);
    }
    static quick(debug, type, value, polygonType) {
      return new CoordinateIdentifier(debug, { type, value, polygonType });
    }
  }
  class DirectionTarget extends MathlangNode {
    constructor(debug, args2) {
      super();
      __publicField(this, "mathlang");
      __publicField(this, "debug");
      __publicField(this, "args");
      __publicField(this, "type");
      __publicField(this, "value");
      this.args = args2;
      this.debug = debug;
      this.mathlang = "direction_target";
      this.value = breakIfNotString(args2.value);
      this.type = breakIfNotString(args2.type);
    }
    clone() {
      return new DirectionTarget(this.debug, this.args);
    }
    static quick(debug, type, value) {
      return new DirectionTarget(debug, { type, value });
    }
  }
  const doesNodeHaveLabelToChangeToIndex = (v) => {
    if (v instanceof GotoLabel && v.label) return true;
    if (v instanceof CheckAction && v.label) return true;
    return false;
  };
  const opIntoStringMap = {
    "=": "SET",
    "+": "ADD",
    "-": "SUB",
    "*": "MUL",
    "/": "DIV",
    "%": "MOD",
    "?": "RNG"
  };
  const stringIntoOpMap = {
    ADD: "+",
    SUB: "-",
    MUL: "*",
    DIV: "/",
    MOD: "%",
    RNG: "?",
    SET: ""
  };
  class Action extends AnyNode {
    constructor() {
      super(...arguments);
      __publicField(this, "action");
    }
    clone() {
      const fn = actionConstructorLookup[this.action];
      if (!fn) throw new Error("no action constructor for " + this.action);
      return fn(this);
    }
    print() {
      return `json[${JSON.stringify(this, null, "	")}]`;
    }
    static fromArgs(args2) {
      if (typeof args2 !== "object" || args2 === null) {
        throw new Error("cannot make Action from non-object");
      }
      const actionName = breakIfNotString(args2.action);
      if (actionConstructorLookup[actionName]) {
        return actionConstructorLookup[actionName](args2);
      }
    }
  }
  class CheckAction extends Action {
    constructor() {
      super();
      __publicField(this, "comment");
      __publicField(this, "success_script");
      __publicField(this, "label");
      __publicField(this, "jump_index");
      __publicField(this, "expected_bool");
      this.expected_bool = true;
    }
    getBool() {
      return this.expected_bool;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
  }
  class BoolGetableAction extends CheckAction {
  }
  class StringCheckableAction extends CheckAction {
    constructor() {
      super();
    }
    updateProp(prop) {
      this.comment = prop;
      throw new Error(`the parent method shouldn't be used`);
    }
  }
  class NumberComparisonAction extends CheckAction {
    constructor() {
      super();
    }
    updateProp(prop) {
      this.expected_bool = prop;
    }
  }
  class NumberCheckableEqualityAction extends CheckAction {
    constructor() {
      super();
    }
    updateProp(prop) {
      this.jump_index = prop;
    }
  }
  const sanitizeLabel = (label) => label.includes(" ") ? label.replace(/ /g, "_").replace(/-/g, "_").replace(/#/g, "") : label;
  const printGotoSegment = (data) => {
    if (data.label) {
      return `goto label ${sanitizeLabel(data.label)}`;
    }
    if (!(data instanceof CheckAction)) throw new Error("not a CheckAction");
    if (data.jump_index !== void 0) {
      if (typeof data.jump_index === "string") {
        return `goto label ${sanitizeLabel(data.jump_index)}`;
      }
      return `goto index ${data.jump_index}`;
    }
    if (data.success_script) {
      return `goto script "${data.success_script}"`;
    }
    throw new Error("cannot print goto segment without destination!");
  };
  const printCheckAction = (data, lhs, smartInvert) => {
    const bang = smartInvert && !data.getBool() ? "!" : "";
    const goto = printGotoSegment(data);
    return `if ${bang}${lhs} then ${goto};`;
  };
  const printSetBoolAction = (data, lhs) => {
    return `${lhs} = ${data.getProp()};`;
  };
  const printDuration = (duration) => duration + "ms";
  const printGeometry = (geometry) => `geometry "${geometry}"`;
  const printEntityIdentifier = (entity) => {
    if (entity === "%PLAYER%") return "player";
    if (entity === "%SELF%") return "self";
    if (entity === "%MAP%") return "map";
    if (entity === "%CAMERA%") return "camera";
    return `entity "${entity}"`;
  };
  const printEntityFieldEquality = (v, param, value) => {
    const lhs = `${printEntityIdentifier(v.entity)} ${param}`;
    return v.expected_bool ? printCheckAction(v, `${lhs} == ${value}`, false) : printCheckAction(v, `${lhs} != ${value}`, false);
  };
  class NULL_ACTION extends Action {
    constructor() {
      super();
      __publicField(this, "action");
      this.action = "NULL_ACTION";
    }
    print() {
      return `// NULL_ACTION`;
    }
  }
  class LABEL extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "value");
      this.action = "LABEL";
      this.value = breakIfNotString(args2.value);
    }
    print() {
      return `${sanitizeLabel(this.value)}:`;
    }
  }
  class RUN_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "script");
      this.action = "RUN_SCRIPT";
      this.script = breakIfNotString(args2.script);
    }
    static quick(script) {
      return new RUN_SCRIPT({ script });
    }
    print() {
      return `goto script "${this.script}";`;
    }
  }
  class BLOCKING_DELAY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "duration");
      this.action = "BLOCKING_DELAY";
      this.duration = breakIfNotNumber(args2.duration);
    }
    print() {
      return `block ${printDuration(this.duration)};`;
    }
  }
  class NON_BLOCKING_DELAY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "duration");
      this.action = "NON_BLOCKING_DELAY";
      this.duration = breakIfNotNumber(args2.duration);
    }
    print() {
      return `wait ${printDuration(this.duration)};`;
    }
  }
  class SET_ENTITY_NAME extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "string");
      this.action = "SET_ENTITY_NAME";
      this.entity = breakIfNotString(args2.entity);
      this.string = breakIfNotString(args2.string);
    }
    static quick(entity, string) {
      return new SET_ENTITY_NAME({ entity, string });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} name = "${this.string}";`;
    }
  }
  class SET_ENTITY_X extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "u2_value");
      this.action = "SET_ENTITY_X";
      this.entity = breakIfNotString(args2.entity);
      this.u2_value = breakIfNotNumber(args2.u2_value);
    }
    static quick(entity, u2_value) {
      return new SET_ENTITY_X({ entity, u2_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} x = ${this.u2_value};`;
    }
  }
  class SET_ENTITY_Y extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "u2_value");
      this.action = "SET_ENTITY_Y";
      this.entity = breakIfNotString(args2.entity);
      this.u2_value = breakIfNotNumber(args2.u2_value);
    }
    static quick(entity, u2_value) {
      return new SET_ENTITY_Y({ entity, u2_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} y = ${this.u2_value};`;
    }
  }
  class SET_ENTITY_INTERACT_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "script");
      this.action = "SET_ENTITY_INTERACT_SCRIPT";
      this.entity = breakIfNotString(args2.entity);
      this.script = breakIfNotString(args2.script);
    }
    static quick(entity, script) {
      return new SET_ENTITY_INTERACT_SCRIPT({ entity, script });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} on_interact = "${this.script}";`;
    }
  }
  class SET_ENTITY_TICK_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "script");
      this.action = "SET_ENTITY_TICK_SCRIPT";
      this.entity = breakIfNotString(args2.entity);
      this.script = breakIfNotString(args2.script);
    }
    static quick(entity, script) {
      return new SET_ENTITY_TICK_SCRIPT({ entity, script });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} on_tick = "${this.script}";`;
    }
  }
  class SET_ENTITY_TYPE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "entity_type");
      this.action = "SET_ENTITY_TYPE";
      this.entity = breakIfNotString(args2.entity);
      this.entity_type = breakIfNotString(args2.entity_type);
    }
    static quick(entity, entity_type) {
      return new SET_ENTITY_TYPE({ entity, entity_type });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} type = "${this.entity_type}";`;
    }
  }
  class SET_ENTITY_PRIMARY_ID extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "u2_value");
      this.action = "SET_ENTITY_PRIMARY_ID";
      this.entity = breakIfNotString(args2.entity);
      this.u2_value = breakIfNotNumber(args2.u2_value);
    }
    static quick(entity, u2_value) {
      return new SET_ENTITY_PRIMARY_ID({ entity, u2_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} primary_id = ${this.u2_value};`;
    }
  }
  class SET_ENTITY_SECONDARY_ID extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "u2_value");
      this.action = "SET_ENTITY_SECONDARY_ID";
      this.entity = breakIfNotString(args2.entity);
      this.u2_value = breakIfNotNumber(args2.u2_value);
    }
    static quick(entity, u2_value) {
      return new SET_ENTITY_SECONDARY_ID({ entity, u2_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} secondary_id = ${this.u2_value};`;
    }
  }
  class SET_ENTITY_PRIMARY_ID_TYPE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "byte_value");
      this.action = "SET_ENTITY_PRIMARY_ID_TYPE";
      this.entity = breakIfNotString(args2.entity);
      this.byte_value = breakIfNotNumber(args2.byte_value);
    }
    static quick(entity, byte_value) {
      return new SET_ENTITY_PRIMARY_ID_TYPE({ entity, byte_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} primary_id_type = ${this.byte_value};`;
    }
  }
  class SET_ENTITY_CURRENT_ANIMATION extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "byte_value");
      this.action = "SET_ENTITY_CURRENT_ANIMATION";
      this.entity = breakIfNotString(args2.entity);
      this.byte_value = breakIfNotNumber(args2.byte_value);
    }
    static quick(entity, byte_value) {
      return new SET_ENTITY_CURRENT_ANIMATION({ entity, byte_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} current_animation = ${this.byte_value};`;
    }
  }
  class SET_ENTITY_CURRENT_FRAME extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "byte_value");
      this.action = "SET_ENTITY_CURRENT_FRAME";
      this.entity = breakIfNotString(args2.entity);
      this.byte_value = breakIfNotNumber(args2.byte_value);
    }
    static quick(entity, byte_value) {
      return new SET_ENTITY_CURRENT_FRAME({ entity, byte_value });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} animation_frame = ${this.byte_value};`;
    }
  }
  class SET_ENTITY_DIRECTION_RELATIVE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "relative_direction");
      this.action = "SET_ENTITY_DIRECTION_RELATIVE";
      this.entity = breakIfNotString(args2.entity);
      this.relative_direction = breakIfNotNumber(args2.relative_direction);
    }
    static quick(entity, relative_direction) {
      return new SET_ENTITY_DIRECTION_RELATIVE({ entity, relative_direction });
    }
    print() {
      if (this.relative_direction < 0) {
        return `${printEntityIdentifier(this.entity)} direction -= ${this.relative_direction};`;
      } else {
        return `${printEntityIdentifier(this.entity)} direction += ${this.relative_direction};`;
      }
    }
  }
  class SET_ENTITY_DIRECTION extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "direction");
      this.action = "SET_ENTITY_DIRECTION";
      this.entity = breakIfNotString(args2.entity);
      this.direction = breakIfNotString(args2.direction);
    }
    static quick(entity, direction) {
      return new SET_ENTITY_DIRECTION({ entity, direction });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} direction = "${this.direction}";`;
    }
  }
  class SET_ENTITY_DIRECTION_TARGET_ENTITY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "target_entity");
      this.action = "SET_ENTITY_DIRECTION_TARGET_ENTITY";
      this.entity = breakIfNotString(args2.entity);
      this.target_entity = breakIfNotString(args2.target_entity);
    }
    static quick(entity, target_entity) {
      return new SET_ENTITY_DIRECTION_TARGET_ENTITY({ entity, target_entity });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} direction = ${printEntityIdentifier(this.target_entity)};`;
    }
  }
  class SET_ENTITY_DIRECTION_TARGET_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "target_geometry");
      this.action = "SET_ENTITY_DIRECTION_TARGET_GEOMETRY";
      this.entity = breakIfNotString(args2.entity);
      this.target_geometry = breakIfNotString(args2.target_geometry);
    }
    static quick(entity, target_geometry) {
      return new SET_ENTITY_DIRECTION_TARGET_GEOMETRY({ entity, target_geometry });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} direction = ${printGeometry(this.target_geometry)};`;
    }
  }
  class SET_ENTITY_GLITCHED extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "bool_value");
      this.action = "SET_ENTITY_GLITCHED";
      this.entity = breakIfNotString(args2.entity);
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(entity, bool_value) {
      return new SET_ENTITY_GLITCHED({ entity, bool_value });
    }
    print() {
      return printSetBoolAction(this, `${printEntityIdentifier(this.entity)} glitched`);
    }
  }
  class SET_ENTITY_PATH extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "geometry");
      this.action = "SET_ENTITY_PATH";
      this.entity = breakIfNotString(args2.entity);
      this.geometry = breakIfNotString(args2.geometry);
    }
    static quick(entity, geometry) {
      return new SET_ENTITY_PATH({ entity, geometry });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} path = "${this.geometry}";`;
    }
  }
  class COPY_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "script");
      __publicField(this, "search_and_replace");
      this.action = "COPY_SCRIPT";
      this.script = breakIfNotString(args2.script);
      if (args2.search_and_replace) {
        const search_and_replace = {};
        Object.entries(args2.search_and_replace).forEach(([k, v]) => {
          if (typeof k === "string" && typeof v === "string") search_and_replace[k] = v;
        });
        this.search_and_replace = search_and_replace;
      }
    }
    static quick(script) {
      return new COPY_SCRIPT({ script });
    }
    print() {
      if (!this.search_and_replace) {
        return `copy!("${this.script}")`;
      }
      const action = {
        action: this.action,
        script: this.script,
        search_and_replace: this.search_and_replace
      };
      const strung = JSON.stringify(action, null, "	");
      return `json[${strung}]`;
    }
  }
  class SET_SAVE_FLAG extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "save_flag");
      __publicField(this, "bool_value");
      this.action = "SET_SAVE_FLAG";
      this.save_flag = breakIfNotString(args2.save_flag);
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static toValue(save_flag, bool_value) {
      return new SET_SAVE_FLAG({ save_flag, bool_value });
    }
    static toFlag(f, node, save_flag, source, invert) {
      const actionIfTrue = SET_SAVE_FLAG.toValue(save_flag, true);
      const actionIfFalse = SET_SAVE_FLAG.toValue(save_flag, false);
      const debug = new MathlangLocation(f, node);
      return simpleBranchMaker(
        f,
        node,
        CheckSaveFlag.quick(debug, source, !invert),
        [actionIfTrue],
        [actionIfFalse]
      );
    }
    print() {
      return printSetBoolAction(this, `"${this.save_flag}"`);
    }
  }
  class SET_PLAYER_CONTROL extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_PLAYER_CONTROL";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(bool_value) {
      return new SET_PLAYER_CONTROL({ bool_value });
    }
    print() {
      return printSetBoolAction(this, `player_control`);
    }
  }
  class SET_MAP_TICK_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "script");
      this.action = "SET_MAP_TICK_SCRIPT";
      this.script = breakIfNotString(args2.script);
    }
    static quick(script) {
      return new SET_MAP_TICK_SCRIPT({ script });
    }
    print() {
      return `map on_tick = "${this.script}";`;
    }
  }
  class SET_HEX_CURSOR_LOCATION extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "address");
      this.action = "SET_HEX_CURSOR_LOCATION";
      this.address = breakIfNotNumber(args2.address);
    }
    // todo print?
  }
  class SET_WARP_STATE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "string");
      this.action = "SET_WARP_STATE";
      this.string = breakIfNotString(args2.string);
    }
    print() {
      return `warp_state = "${this.string}";`;
    }
  }
  class SET_HEX_EDITOR_STATE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_HEX_EDITOR_STATE";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(bool_value) {
      return new SET_HEX_EDITOR_STATE({ bool_value });
    }
    print() {
      return printSetBoolAction(this, `hex_editor`);
    }
  }
  class SET_HEX_EDITOR_DIALOG_MODE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_HEX_EDITOR_DIALOG_MODE";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(bool_value) {
      return new SET_HEX_EDITOR_DIALOG_MODE({ bool_value });
    }
    print() {
      return printSetBoolAction(this, `hex_dialog_mode`);
    }
  }
  class SET_HEX_EDITOR_CONTROL extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_HEX_EDITOR_CONTROL";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(bool_value) {
      return new SET_HEX_EDITOR_CONTROL({ bool_value });
    }
    print() {
      return printSetBoolAction(this, `hex_control`);
    }
  }
  class SET_HEX_EDITOR_CONTROL_CLIPBOARD extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_HEX_EDITOR_CONTROL_CLIPBOARD";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(bool_value) {
      return new SET_HEX_EDITOR_CONTROL_CLIPBOARD({ bool_value });
    }
    print() {
      return printSetBoolAction(this, `hex_clipboard`);
    }
  }
  class LOAD_MAP extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "map");
      this.action = "LOAD_MAP";
      this.map = breakIfNotString(args2.map);
    }
    static quick(map) {
      return new LOAD_MAP({ map });
    }
    print() {
      return `load map "${this.map}";`;
    }
  }
  class SHOW_DIALOG extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "dialog");
      this.action = "SHOW_DIALOG";
      this.dialog = breakIfNotString(args2.dialog);
    }
    static quick(dialog) {
      return new SHOW_DIALOG({ dialog });
    }
    print() {
      return `show dialog "${this.dialog}";`;
    }
  }
  class PLAY_ENTITY_ANIMATION extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "animation");
      __publicField(this, "play_count");
      this.action = "PLAY_ENTITY_ANIMATION";
      this.entity = breakIfNotString(args2.entity);
      this.animation = breakIfNotNumber(args2.animation);
      this.play_count = breakIfNotNumber(args2.play_count);
    }
    print() {
      return `${printEntityIdentifier(this.entity)} animation -> ${this.animation} ${this.play_count}x;`;
    }
  }
  class TELEPORT_ENTITY_TO_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      this.action = "TELEPORT_ENTITY_TO_GEOMETRY";
      this.entity = breakIfNotString(args2.entity);
      this.geometry = breakIfNotString(args2.geometry);
    }
    static quick(entity, geometry) {
      return new TELEPORT_ENTITY_TO_GEOMETRY({ entity, geometry });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} position = ${printGeometry(this.geometry)};`;
    }
  }
  class WALK_ENTITY_TO_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      __publicField(this, "duration");
      this.action = "WALK_ENTITY_TO_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.entity = breakIfNotString(args2.entity);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(entity, geometry, duration) {
      return new WALK_ENTITY_TO_GEOMETRY({ entity, geometry, duration });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} position -> ${printGeometry(this.geometry)} origin over ${printDuration(this.duration)};`;
    }
  }
  class WALK_ENTITY_ALONG_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      __publicField(this, "duration");
      this.action = "WALK_ENTITY_ALONG_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.entity = breakIfNotString(args2.entity);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(entity, geometry, duration) {
      return new WALK_ENTITY_ALONG_GEOMETRY({ entity, geometry, duration });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} position -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)};`;
    }
  }
  class LOOP_ENTITY_ALONG_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      __publicField(this, "duration");
      this.action = "LOOP_ENTITY_ALONG_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.entity = breakIfNotString(args2.entity);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(entity, geometry, duration) {
      return new LOOP_ENTITY_ALONG_GEOMETRY({ entity, geometry, duration });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} position -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)} forever;`;
    }
  }
  class SET_CAMERA_TO_FOLLOW_ENTITY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      this.action = "SET_CAMERA_TO_FOLLOW_ENTITY";
      this.entity = breakIfNotString(args2.entity);
    }
    static quick(entity) {
      return new SET_CAMERA_TO_FOLLOW_ENTITY({ entity });
    }
    print() {
      return `camera = ${printEntityIdentifier(this.entity)} position;`;
    }
  }
  class TELEPORT_CAMERA_TO_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      this.action = "TELEPORT_CAMERA_TO_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
    }
    static quick(geometry) {
      return new TELEPORT_CAMERA_TO_GEOMETRY({ geometry });
    }
    print() {
      return `camera = ${printGeometry(this.geometry)};`;
    }
  }
  class PAN_CAMERA_TO_ENTITY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "duration");
      this.action = "PAN_CAMERA_TO_ENTITY";
      this.entity = breakIfNotString(args2.entity);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(entity, duration) {
      return new PAN_CAMERA_TO_ENTITY({ duration, entity });
    }
    print() {
      return `camera -> ${printEntityIdentifier(this.entity)} position over ${printDuration(this.duration)};`;
    }
  }
  class PAN_CAMERA_TO_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "duration");
      this.action = "PAN_CAMERA_TO_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(geometry, duration) {
      return new PAN_CAMERA_TO_GEOMETRY({ geometry, duration });
    }
    print() {
      return `camera -> ${printGeometry(this.geometry)} origin over ${printDuration(this.duration)};`;
    }
  }
  class PAN_CAMERA_ALONG_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "duration");
      this.action = "PAN_CAMERA_ALONG_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(geometry, duration) {
      return new PAN_CAMERA_ALONG_GEOMETRY({ geometry, duration });
    }
    print() {
      return `camera -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)};`;
    }
  }
  class LOOP_CAMERA_ALONG_GEOMETRY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "duration");
      this.action = "LOOP_CAMERA_ALONG_GEOMETRY";
      this.geometry = breakIfNotString(args2.geometry);
      this.duration = breakIfNotNumber(args2.duration);
    }
    static quick(geometry, duration) {
      return new LOOP_CAMERA_ALONG_GEOMETRY({ geometry, duration });
    }
    print() {
      return `camera -> ${printGeometry(this.geometry)} length over ${printDuration(this.duration)} forever;`;
    }
  }
  class SET_SCREEN_SHAKE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "duration");
      __publicField(this, "frequency");
      __publicField(this, "amplitude");
      this.action = "SET_SCREEN_SHAKE";
      this.duration = breakIfNotNumber(args2.duration);
      this.frequency = breakIfNotNumber(args2.frequency);
      this.amplitude = breakIfNotNumber(args2.amplitude);
    }
    print() {
      return `camera shake -> ${this.frequency}ms ${this.amplitude}px over ${printDuration(this.duration)};`;
    }
  }
  class SCREEN_FADE_OUT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "duration");
      __publicField(this, "color");
      this.action = "SCREEN_FADE_OUT";
      this.duration = breakIfNotNumber(args2.duration);
      this.color = breakIfNotString(args2.color);
    }
    print() {
      return `camera fade out -> ${this.color} over ${printDuration(this.duration)};`;
    }
  }
  class SCREEN_FADE_IN extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "duration");
      __publicField(this, "color");
      this.action = "SCREEN_FADE_IN";
      this.duration = breakIfNotNumber(args2.duration);
      this.color = breakIfNotString(args2.color);
    }
    print() {
      return `camera fade in -> ${this.color} over ${printDuration(this.duration)};`;
    }
  }
  class MUTATE_VARIABLE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "operation");
      __publicField(this, "value");
      this.action = "MUTATE_VARIABLE";
      this.variable = breakIfNotString(args2.variable);
      this.operation = breakIfNotString(args2.operation);
      this.value = breakIfNotNumber(args2.value);
    }
    static set(variable, value) {
      return new MUTATE_VARIABLE({ operation: "SET", value, variable });
    }
    static change(debug, variable, value, op) {
      if (op === "+" && value === 0) {
        return CommentNode.quick(debug, "This action was optimized out (+ 0)");
      }
      if (op === "*" && value === 1) {
        return CommentNode.quick(debug, "This action was optimized out (* 1)");
      }
      if (op === "/" && value === 1) {
        return CommentNode.quick(debug, "This action was optimized out (/ 1)");
      }
      if (op === "-" && value === 0) {
        return CommentNode.quick(debug, "This action was optimized out (- 0)");
      }
      return new MUTATE_VARIABLE({ operation: opIntoStringMap[op] || op, value, variable });
    }
    print() {
      return `"${this.variable}" ${stringIntoOpMap[this.operation]}= ${this.value};`;
    }
  }
  class MUTATE_VARIABLES extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "operation");
      __publicField(this, "source");
      this.action = "MUTATE_VARIABLES";
      this.variable = breakIfNotString(args2.variable);
      this.operation = breakIfNotString(args2.operation);
      this.source = breakIfNotString(args2.source);
    }
    static set(debug, variable, source) {
      if (variable === source) {
        return CommentNode.quick(
          debug,
          `This action was optimized out (setting '${variable}' to itself)`
        );
      }
      return new MUTATE_VARIABLES({ operation: "SET", source, variable });
    }
    static change(variable, source, op) {
      return new MUTATE_VARIABLES({
        variable,
        source,
        operation: opIntoStringMap[op] || op
      });
    }
    print() {
      return `"${this.variable}" ${stringIntoOpMap[this.operation]}= "${this.source}";`;
    }
  }
  class COPY_VARIABLE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "entity");
      __publicField(this, "field");
      __publicField(this, "inbound");
      this.action = "COPY_VARIABLE";
      this.variable = breakIfNotString(args2.variable);
      this.entity = breakIfNotString(args2.entity);
      this.field = breakIfNotString(args2.field);
      this.inbound = breakIfNotBool(args2.inbound);
    }
    static intoField(variable, entity, field) {
      return new COPY_VARIABLE({ entity, field, inbound: false, variable });
    }
    static intoVariable(entity, field, variable) {
      return new COPY_VARIABLE({ entity, field, inbound: true, variable });
    }
    print() {
      return this.inbound ? `"${this.variable}" = ${printEntityIdentifier(this.entity)} ${this.field};` : `${printEntityIdentifier(this.entity)} ${this.field} = "${this.variable}";`;
    }
  }
  class SLOT_SAVE extends Action {
    constructor() {
      super();
      __publicField(this, "action");
      this.action = "SLOT_SAVE";
    }
    print() {
      return `save slot;`;
    }
  }
  class SLOT_LOAD extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "slot");
      this.action = "SLOT_LOAD";
      this.slot = breakIfNotNumber(args2.slot);
    }
    print() {
      return `load slot ${this.slot};`;
    }
  }
  class SLOT_ERASE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "slot");
      this.action = "SLOT_ERASE";
      this.slot = breakIfNotNumber(args2.slot);
    }
    print() {
      return `erase slot ${this.slot};`;
    }
  }
  class SET_CONNECT_SERIAL_DIALOG extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "serial_dialog");
      this.action = "SET_CONNECT_SERIAL_DIALOG";
      this.serial_dialog = breakIfNotString(args2.serial_dialog);
    }
    print() {
      return `serial_connect = "${this.serial_dialog}";`;
    }
  }
  class SHOW_SERIAL_DIALOG extends Action {
    // might be absent on old stuff
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "serial_dialog");
      __publicField(this, "disable_newline");
      this.action = "SHOW_SERIAL_DIALOG";
      this.serial_dialog = breakIfNotString(args2.serial_dialog);
      if (args2.disable_newline) {
        this.disable_newline = true;
      }
    }
    static quick(serial_dialog, disable_newline) {
      return new SHOW_SERIAL_DIALOG({ serial_dialog, disable_newline: !!disable_newline });
    }
    print() {
      const verb = this.disable_newline ? "concat" : "show";
      return `${verb} serial_dialog "${this.serial_dialog}";`;
    }
  }
  class SET_MAP_LOOK_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "script");
      this.action = "SET_MAP_LOOK_SCRIPT";
      this.script = breakIfNotString(args2.script);
    }
    static quick(script) {
      return new SET_MAP_LOOK_SCRIPT({ script });
    }
    print() {
      return `map on_look = "${this.script}";`;
    }
  }
  class SET_ENTITY_LOOK_SCRIPT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "script");
      __publicField(this, "entity");
      this.action = "SET_ENTITY_LOOK_SCRIPT";
      this.script = breakIfNotString(args2.script);
      this.entity = breakIfNotString(args2.entity);
    }
    static quick(entity, script) {
      return new SET_ENTITY_LOOK_SCRIPT({ entity, script });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} on_look = "${this.script}";`;
    }
  }
  class SET_TELEPORT_ENABLED extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_TELEPORT_ENABLED";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    // todo print?
  }
  class SET_BLE_FLAG extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "ble_flag");
      __publicField(this, "bool_value");
      this.action = "SET_BLE_FLAG";
      this.ble_flag = breakIfNotString(args2.ble_flag);
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
  }
  class SET_SERIAL_DIALOG_CONTROL extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "bool_value");
      this.action = "SET_SERIAL_DIALOG_CONTROL";
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    static quick(bool_value) {
      return new SET_SERIAL_DIALOG_CONTROL({ bool_value });
    }
    print() {
      return printSetBoolAction(this, `serial_control`);
    }
  }
  class REGISTER_SERIAL_DIALOG_COMMAND extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "command");
      __publicField(this, "script");
      __publicField(this, "is_fail");
      this.action = "REGISTER_SERIAL_DIALOG_COMMAND";
      this.command = breakIfNotString(args2.command);
      this.script = breakIfNotString(args2.script);
      if (args2.is_fail) this.is_fail = true;
    }
    print() {
      return this.is_fail ? `command "${this.command}" fail = "${this.script}";` : `command "${this.command}" = "${this.script}";`;
    }
  }
  class REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "command");
      __publicField(this, "script");
      __publicField(this, "argument");
      this.action = "REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT";
      this.command = breakIfNotString(args2.command);
      this.script = breakIfNotString(args2.script);
      this.argument = breakIfNotString(args2.argument);
    }
    print() {
      return `command "${this.command}" + "${this.argument}" = "${this.script}";`;
    }
  }
  class UNREGISTER_SERIAL_DIALOG_COMMAND extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "command");
      __publicField(this, "is_fail");
      this.action = "UNREGISTER_SERIAL_DIALOG_COMMAND";
      this.command = breakIfNotString(args2.command);
      if (args2.is_fail !== void 0) {
        this.is_fail = breakIfNotBool(args2.is_fail);
      }
    }
    print() {
      return `delete command "${this.command}";`;
    }
  }
  class UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "command");
      __publicField(this, "argument");
      this.action = "UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT";
      this.command = breakIfNotString(args2.command);
      this.argument = breakIfNotString(args2.argument);
    }
    print() {
      return `delete command "${this.command}" + "${this.argument}";`;
    }
  }
  class SET_ENTITY_MOVEMENT_RELATIVE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "relative_direction");
      __publicField(this, "entity");
      this.action = "SET_ENTITY_MOVEMENT_RELATIVE";
      this.relative_direction = breakIfNotNumber(args2.relative_direction);
      this.entity = breakIfNotString(args2.entity);
    }
    static quick(entity, relative_direction) {
      return new SET_ENTITY_MOVEMENT_RELATIVE({ entity, relative_direction });
    }
    print() {
      return `${printEntityIdentifier(this.entity)} strafe = ${this.relative_direction};`;
    }
  }
  class CLOSE_DIALOG extends Action {
    constructor() {
      super();
      __publicField(this, "action");
      this.action = "CLOSE_DIALOG";
    }
    print() {
      return `close dialog;`;
    }
  }
  class CLOSE_SERIAL_DIALOG extends Action {
    constructor() {
      super();
      __publicField(this, "action");
      this.action = "CLOSE_SERIAL_DIALOG";
    }
    print() {
      return `close serial_dialog;`;
    }
  }
  class SET_LIGHTS_CONTROL extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "enabled");
      this.action = "SET_LIGHTS_CONTROL";
      this.enabled = breakIfNotBool(args2.enabled);
    }
    updateProp(v) {
      this.enabled = v;
    }
    getProp() {
      return this.enabled;
    }
    invert() {
      this.enabled = !this.enabled;
      return this;
    }
    static quick(enabled) {
      return new SET_LIGHTS_CONTROL({ enabled });
    }
    print() {
      return printSetBoolAction(this, `lights_control`);
    }
  }
  class SET_LIGHTS_STATE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "lights");
      __publicField(this, "enabled");
      this.action = "SET_LIGHTS_STATE";
      this.enabled = breakIfNotBool(args2.enabled);
      this.lights = breakIfNotStringOrStringArray(args2.lights);
    }
    updateProp(v) {
      this.enabled = v;
    }
    getProp() {
      return this.enabled;
    }
    invert() {
      this.enabled = !this.enabled;
      return this;
    }
    static quick(lights, enabled) {
      return new SET_LIGHTS_STATE({ lights, enabled });
    }
    print() {
      return printSetBoolAction(this, `light ${this.lights}`);
    }
  }
  class GOTO_ACTION_INDEX extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "action_index");
      this.action = "GOTO_ACTION_INDEX";
      this.action_index = breakIfNotStringOrNumber(args2.action_index);
    }
    static quick(action_index) {
      return new GOTO_ACTION_INDEX({ action_index });
    }
    print() {
      if (typeof this.action_index === "string") {
        return `goto label ${sanitizeLabel(this.action_index)};`;
      }
      return `goto index ${this.action_index};`;
    }
  }
  class SET_SCRIPT_PAUSE extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "script_slot");
      __publicField(this, "bool_value");
      this.action = "SET_SCRIPT_PAUSE";
      this.entity = breakIfNotString(args2.entity);
      this.script_slot = breakIfNotString(args2.script_slot);
      this.bool_value = breakIfNotBool(args2.bool_value);
    }
    updateProp(v) {
      this.bool_value = v;
    }
    getProp() {
      return this.bool_value;
    }
    invert() {
      this.bool_value = !this.bool_value;
      return this;
    }
    print() {
      return `${this.bool_value ? "" : "un"}pause ${printEntityIdentifier(this.entity)} ${this.script_slot};`;
    }
  }
  class REGISTER_SERIAL_DIALOG_COMMAND_ALIAS extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "command");
      __publicField(this, "alias");
      this.action = "REGISTER_SERIAL_DIALOG_COMMAND_ALIAS";
      this.command = breakIfNotString(args2.command);
      this.alias = breakIfNotString(args2.alias);
    }
    print() {
      return `alias "${this.alias}" = "${this.command}";`;
    }
  }
  class UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "alias");
      this.action = "UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS";
      this.alias = breakIfNotString(args2.alias);
    }
    print() {
      return `delete alias "${this.alias}";`;
    }
  }
  class SET_SERIAL_DIALOG_COMMAND_VISIBILITY extends Action {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "command");
      __publicField(this, "is_visible");
      this.action = "SET_SERIAL_DIALOG_COMMAND_VISIBILITY";
      this.command = breakIfNotString(args2.command);
      this.is_visible = breakIfNotBool(args2.is_visible);
    }
    updateProp(v) {
      this.is_visible = v;
    }
    getProp() {
      return this.is_visible;
    }
    invert() {
      this.is_visible = !this.is_visible;
      return this;
    }
    print() {
      return `${this.is_visible ? "un" : ""}hide command "${this.command}";`;
    }
  }
  class CHECK_ENTITY_NAME extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "string");
      this.action = "CHECK_ENTITY_NAME";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.string = breakIfNotString(args2.string);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.string = value;
    }
    getProp() {
      return this.string;
    }
    static quick(entity, string, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_NAME({ entity, string, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "name", `"${this.string}"`);
    }
  }
  class CHECK_ENTITY_X extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_X";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_X({ entity, expected_u2, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "x", this.expected_u2);
    }
  }
  class CHECK_ENTITY_Y extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_Y";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_Y({ entity, expected_u2, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "y", this.expected_u2);
    }
  }
  class CHECK_ENTITY_INTERACT_SCRIPT extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_script");
      this.action = "CHECK_ENTITY_INTERACT_SCRIPT";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_script = breakIfNotString(args2.expected_script);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_script = value;
    }
    getProp() {
      return this.expected_script;
    }
    static quick(entity, expected_script, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_INTERACT_SCRIPT({ entity, expected_script, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "on_interact", `"${this.expected_script}"`);
    }
  }
  class CHECK_ENTITY_TICK_SCRIPT extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_script");
      this.action = "CHECK_ENTITY_TICK_SCRIPT";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_script = breakIfNotString(args2.expected_script);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_script = value;
    }
    getProp() {
      return this.expected_script;
    }
    static quick(entity, expected_script, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_TICK_SCRIPT({ entity, expected_script, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "on_tick", `"${this.expected_script}"`);
    }
  }
  class CHECK_ENTITY_LOOK_SCRIPT extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_script");
      this.action = "CHECK_ENTITY_LOOK_SCRIPT";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_script = breakIfNotString(args2.expected_script);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_script = value;
    }
    getProp() {
      return this.expected_script;
    }
    static quick(entity, expected_script, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_LOOK_SCRIPT({ entity, expected_script, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "on_look", `"${this.expected_script}"`);
    }
  }
  class CHECK_ENTITY_TYPE extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "entity_type");
      this.action = "CHECK_ENTITY_TYPE";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.entity_type = breakIfNotString(args2.entity_type);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.entity_type = value;
    }
    getProp() {
      return this.entity_type;
    }
    static quick(entity, entity_type, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_TYPE({ entity, entity_type, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "type", `"${this.entity_type}"`);
    }
  }
  class CHECK_ENTITY_PRIMARY_ID extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_PRIMARY_ID";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_PRIMARY_ID({ entity, expected_u2, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "primary_id", this.expected_u2);
    }
  }
  class CHECK_ENTITY_SECONDARY_ID extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_u2");
      this.action = "CHECK_ENTITY_SECONDARY_ID";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_u2 = breakIfNotNumber(args2.expected_u2);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_u2 = value;
    }
    getProp() {
      return this.expected_u2;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_u2, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_SECONDARY_ID({ entity, expected_u2, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "secondary_id", this.expected_u2);
    }
  }
  class CHECK_ENTITY_PRIMARY_ID_TYPE extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_byte");
      this.action = "CHECK_ENTITY_PRIMARY_ID_TYPE";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_byte = breakIfNotNumber(args2.expected_byte);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_byte = value;
    }
    getProp() {
      return this.expected_byte;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_byte, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_PRIMARY_ID_TYPE({ entity, expected_byte, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "primary_id_type", this.expected_byte);
    }
  }
  class CHECK_ENTITY_CURRENT_ANIMATION extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_byte");
      this.action = "CHECK_ENTITY_CURRENT_ANIMATION";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_byte = breakIfNotNumber(args2.expected_byte);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_byte = value;
    }
    getProp() {
      return this.expected_byte;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_byte, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_CURRENT_ANIMATION({ entity, expected_byte, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "current_animation", this.expected_byte);
    }
  }
  class CHECK_ENTITY_CURRENT_FRAME extends NumberCheckableEqualityAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "expected_byte");
      __publicField(this, "expected_bool");
      this.action = "CHECK_ENTITY_CURRENT_FRAME";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_byte = breakIfNotNumber(args2.expected_byte);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.expected_byte = value;
    }
    getProp() {
      return this.expected_byte;
    }
    invert() {
      this.expected_bool = !this.expected_bool;
      return this;
    }
    static quick(entity, expected_byte, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_CURRENT_FRAME({ entity, expected_byte, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "animation_frame", this.expected_byte);
    }
  }
  class CHECK_ENTITY_DIRECTION extends StringCheckableAction {
    // north, south, east, west
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      __publicField(this, "direction");
      this.action = "CHECK_ENTITY_DIRECTION";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.direction = breakIfNotString(args2.direction);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.direction = value;
    }
    getProp() {
      return this.direction;
    }
    static quick(entity, direction, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_DIRECTION({ entity, direction, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "direction", `${this.direction}`);
    }
  }
  class CHECK_ENTITY_GLITCHED extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "entity");
      this.action = "CHECK_ENTITY_GLITCHED";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(entity, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_GLITCHED({ entity, expected_bool });
    }
    print() {
      return printCheckAction(this, `${printEntityIdentifier(this.entity)} glitched`, true);
    }
  }
  class CHECK_ENTITY_PATH extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      this.action = "CHECK_ENTITY_PATH";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.entity = breakIfNotString(args2.entity);
      this.geometry = breakIfNotString(args2.geometry);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.geometry = value;
    }
    getProp() {
      return this.geometry;
    }
    static quick(entity, geometry, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_ENTITY_PATH({ entity, geometry, expected_bool });
    }
    print() {
      return printEntityFieldEquality(this, "path", `"${this.geometry}"`);
    }
  }
  class CHECK_SAVE_FLAG extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "save_flag");
      this.action = "CHECK_SAVE_FLAG";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.save_flag = breakIfNotString(args2.save_flag);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(save_flag, provided_bool, provided_label) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      const action = new CHECK_SAVE_FLAG({ save_flag, expected_bool });
      action.label = provided_label || "";
      return action;
    }
    print() {
      return printCheckAction(this, `"${this.save_flag}"`, true);
    }
  }
  class CHECK_IF_ENTITY_IS_IN_GEOMETRY extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "geometry");
      __publicField(this, "entity");
      this.action = "CHECK_IF_ENTITY_IS_IN_GEOMETRY";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.geometry = breakIfNotString(args2.geometry);
      this.entity = breakIfNotString(args2.entity);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(entity, geometry, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_IF_ENTITY_IS_IN_GEOMETRY({ entity, geometry, expected_bool });
    }
    print() {
      return printCheckAction(
        this,
        `${printEntityIdentifier(this.entity)} intersects ${printGeometry(this.geometry)}`,
        true
      );
    }
  }
  class CHECK_FOR_BUTTON_PRESS extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "button_id");
      this.action = "CHECK_FOR_BUTTON_PRESS";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.button_id = breakIfNotString(args2.button_id);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(button_id, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_FOR_BUTTON_PRESS({ button_id, expected_bool });
    }
    print() {
      return printCheckAction(this, `button ${this.button_id} pressed`, true);
    }
  }
  class CHECK_FOR_BUTTON_STATE extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "button_id");
      this.action = "CHECK_FOR_BUTTON_STATE";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.button_id = breakIfNotString(args2.button_id);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(button_id, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_FOR_BUTTON_STATE({ button_id, expected_bool });
    }
    print() {
      return printCheckAction(
        this,
        `button ${this.button_id} ${this.expected_bool ? "down" : "up"}`,
        false
      );
    }
  }
  class CHECK_WARP_STATE extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "string");
      this.action = "CHECK_WARP_STATE";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.string = breakIfNotString(args2.string);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.string = value;
    }
    getProp() {
      return this.string;
    }
    static quick(string, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_WARP_STATE({ string, expected_bool });
    }
    print() {
      return this.expected_bool ? printCheckAction(this, `warp_state == "${this.string}"`, false) : printCheckAction(this, `warp_state != "${this.string}"`, false);
    }
  }
  class CHECK_VARIABLE extends NumberComparisonAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "comparison");
      __publicField(this, "value");
      this.action = "CHECK_VARIABLE";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.variable = breakIfNotString(args2.variable);
      this.comparison = breakIfNotString(args2.comparison);
      this.value = breakIfNotNumber(args2.value);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
      if (this.comparison === "!=") {
        this.comparison = "==";
        this.expected_bool = !this.expected_bool;
      }
    }
    static quick(variable, value, comparison, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_VARIABLE({
        variable,
        value,
        comparison,
        expected_bool
      });
    }
    print() {
      const op = this.expected_bool ? this.comparison : inverseOpMap[this.comparison];
      return printCheckAction(this, `"${this.variable}" ${op} ${this.value}`, false);
    }
  }
  class CHECK_VARIABLES extends NumberComparisonAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "variable");
      __publicField(this, "comparison");
      __publicField(this, "source");
      this.action = "CHECK_VARIABLES";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.variable = breakIfNotString(args2.variable);
      this.comparison = breakIfNotString(args2.comparison);
      this.source = breakIfNotString(args2.source);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
      if (this.comparison === "!=") {
        this.comparison = "==";
        this.expected_bool = !this.expected_bool;
      }
    }
    static quick(variable, source, comparison, provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_VARIABLES({
        variable,
        source,
        comparison,
        expected_bool
      });
    }
    print() {
      const op = this.expected_bool ? this.comparison : inverseOpMap[this.comparison];
      return printCheckAction(this, `"${this.variable}" ${op} "${this.source}"`, false);
    }
  }
  class CHECK_MAP extends StringCheckableAction {
    constructor(args2) {
      super();
      // TODO: is this even in the engine? O.o
      __publicField(this, "action");
      __publicField(this, "map");
      __publicField(this, "expected_bool");
      this.action = "CHECK_MAP";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.map = breakIfNotString(args2.map);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.map = value;
    }
    getProp() {
      return this.map;
    }
    // todo print fn?
  }
  class CHECK_BLE_FLAG extends StringCheckableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      __publicField(this, "ble_flag");
      this.action = "CHECK_BLE_FLAG";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.ble_flag = breakIfNotString(args2.ble_flag);
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    updateProp(value) {
      this.ble_flag = value;
    }
    getProp() {
      return this.ble_flag;
    }
    // todo print fn?
  }
  class CHECK_DIALOG_OPEN extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      this.action = "CHECK_DIALOG_OPEN";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_DIALOG_OPEN({ expected_bool });
    }
    print() {
      return printCheckAction(this, `dialog ${this.expected_bool ? "open" : "closed"}`, false);
    }
  }
  class CHECK_SERIAL_DIALOG_OPEN extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      this.action = "CHECK_SERIAL_DIALOG_OPEN";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_SERIAL_DIALOG_OPEN({ expected_bool });
    }
    print() {
      return printCheckAction(
        this,
        `serial_dialog ${this.expected_bool ? "open" : "closed"}`,
        false
      );
    }
  }
  class CHECK_DEBUG_MODE extends BoolGetableAction {
    constructor(args2) {
      super();
      __publicField(this, "action");
      this.action = "CHECK_DEBUG_MODE";
      if (args2.success_script) {
        this.success_script = breakIfNotString(args2.success_script);
      } else if (args2.label) {
        this.label = breakIfNotString(args2.label);
      } else if (args2.jump_index) {
        this.jump_index = breakIfNotStringOrNumber(args2.jump_index);
      }
      this.expected_bool = breakIfNotBool(args2.expected_bool);
    }
    static quick(provided_bool) {
      const expected_bool = provided_bool === void 0 ? true : provided_bool;
      return new CHECK_DEBUG_MODE({ expected_bool });
    }
    print() {
      return printCheckAction(this, "debug_mode", true);
    }
  }
  const breakIfNotStringOrStringArray = (v) => {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.every((v2) => typeof v2 === "string")) return v;
    throw new Error("not a string or a strng array");
  };
  const breakIfNotString = (v) => {
    if (typeof v === "string") return v;
    throw new Error("not a string");
  };
  const breakIfNotStringOrNumber = (v) => {
    if (typeof v === "string") return v;
    if (typeof v === "number") return v;
    throw new Error("not a string or number");
  };
  const breakIfNotNumber = (v) => {
    if (typeof v === "number") return v;
    throw new Error("not a number");
  };
  const breakIfNotBool = (v) => {
    if (typeof v === "boolean") return v;
    throw new Error("not a boolean");
  };
  const actionConstructorLookup = {
    NULL_ACTION: () => new NULL_ACTION(),
    COPY_SCRIPT: (args2) => new COPY_SCRIPT(args2),
    LABEL: (args2) => new LABEL(args2),
    RUN_SCRIPT: (args2) => new RUN_SCRIPT(args2),
    BLOCKING_DELAY: (args2) => new BLOCKING_DELAY(args2),
    NON_BLOCKING_DELAY: (args2) => new NON_BLOCKING_DELAY(args2),
    UNREGISTER_SERIAL_DIALOG_COMMAND: (args2) => {
      return new UNREGISTER_SERIAL_DIALOG_COMMAND(args2);
    },
    UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: (args2) => {
      return new UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(args2);
    },
    SET_ENTITY_NAME: (args2) => new SET_ENTITY_NAME(args2),
    SET_ENTITY_X: (args2) => new SET_ENTITY_X(args2),
    SET_ENTITY_Y: (args2) => new SET_ENTITY_Y(args2),
    SET_ENTITY_INTERACT_SCRIPT: (args2) => new SET_ENTITY_INTERACT_SCRIPT(args2),
    SET_ENTITY_TICK_SCRIPT: (args2) => new SET_ENTITY_TICK_SCRIPT(args2),
    SET_ENTITY_TYPE: (args2) => new SET_ENTITY_TYPE(args2),
    SET_ENTITY_PRIMARY_ID: (args2) => new SET_ENTITY_PRIMARY_ID(args2),
    SET_ENTITY_SECONDARY_ID: (args2) => new SET_ENTITY_SECONDARY_ID(args2),
    SET_ENTITY_PRIMARY_ID_TYPE: (args2) => new SET_ENTITY_PRIMARY_ID_TYPE(args2),
    SET_ENTITY_CURRENT_ANIMATION: (args2) => {
      return new SET_ENTITY_CURRENT_ANIMATION(args2);
    },
    SET_ENTITY_CURRENT_FRAME: (args2) => new SET_ENTITY_CURRENT_FRAME(args2),
    SET_ENTITY_DIRECTION: (args2) => new SET_ENTITY_DIRECTION(args2),
    SET_ENTITY_DIRECTION_RELATIVE: (args2) => {
      return new SET_ENTITY_DIRECTION_RELATIVE(args2);
    },
    SET_ENTITY_DIRECTION_TARGET_ENTITY: (args2) => {
      return new SET_ENTITY_DIRECTION_TARGET_ENTITY(args2);
    },
    SET_ENTITY_DIRECTION_TARGET_GEOMETRY: (args2) => {
      return new SET_ENTITY_DIRECTION_TARGET_GEOMETRY(args2);
    },
    SET_ENTITY_GLITCHED: (args2) => new SET_ENTITY_GLITCHED(args2),
    SET_ENTITY_PATH: (args2) => new SET_ENTITY_PATH(args2),
    SET_SAVE_FLAG: (args2) => new SET_SAVE_FLAG(args2),
    SET_PLAYER_CONTROL: (args2) => new SET_PLAYER_CONTROL(args2),
    SET_MAP_TICK_SCRIPT: (args2) => new SET_MAP_TICK_SCRIPT(args2),
    SET_HEX_CURSOR_LOCATION: (args2) => new SET_HEX_CURSOR_LOCATION(args2),
    SET_WARP_STATE: (args2) => new SET_WARP_STATE(args2),
    SET_HEX_EDITOR_STATE: (args2) => new SET_HEX_EDITOR_STATE(args2),
    SET_HEX_EDITOR_DIALOG_MODE: (args2) => new SET_HEX_EDITOR_DIALOG_MODE(args2),
    SET_HEX_EDITOR_CONTROL: (args2) => new SET_HEX_EDITOR_CONTROL(args2),
    SET_HEX_EDITOR_CONTROL_CLIPBOARD: (args2) => {
      return new SET_HEX_EDITOR_CONTROL_CLIPBOARD(args2);
    },
    LOAD_MAP: (args2) => new LOAD_MAP(args2),
    SHOW_DIALOG: (args2) => new SHOW_DIALOG(args2),
    PLAY_ENTITY_ANIMATION: (args2) => new PLAY_ENTITY_ANIMATION(args2),
    TELEPORT_ENTITY_TO_GEOMETRY: (args2) => new TELEPORT_ENTITY_TO_GEOMETRY(args2),
    WALK_ENTITY_TO_GEOMETRY: (args2) => new WALK_ENTITY_TO_GEOMETRY(args2),
    WALK_ENTITY_ALONG_GEOMETRY: (args2) => new WALK_ENTITY_ALONG_GEOMETRY(args2),
    LOOP_ENTITY_ALONG_GEOMETRY: (args2) => new LOOP_ENTITY_ALONG_GEOMETRY(args2),
    SET_CAMERA_TO_FOLLOW_ENTITY: (args2) => new SET_CAMERA_TO_FOLLOW_ENTITY(args2),
    TELEPORT_CAMERA_TO_GEOMETRY: (args2) => new TELEPORT_CAMERA_TO_GEOMETRY(args2),
    PAN_CAMERA_TO_ENTITY: (args2) => new PAN_CAMERA_TO_ENTITY(args2),
    PAN_CAMERA_TO_GEOMETRY: (args2) => new PAN_CAMERA_TO_GEOMETRY(args2),
    PAN_CAMERA_ALONG_GEOMETRY: (args2) => new PAN_CAMERA_ALONG_GEOMETRY(args2),
    LOOP_CAMERA_ALONG_GEOMETRY: (args2) => new LOOP_CAMERA_ALONG_GEOMETRY(args2),
    SET_SCREEN_SHAKE: (args2) => new SET_SCREEN_SHAKE(args2),
    SCREEN_FADE_OUT: (args2) => new SCREEN_FADE_OUT(args2),
    SCREEN_FADE_IN: (args2) => new SCREEN_FADE_IN(args2),
    MUTATE_VARIABLE: (args2) => new MUTATE_VARIABLE(args2),
    MUTATE_VARIABLES: (args2) => new MUTATE_VARIABLES(args2),
    COPY_VARIABLE: (args2) => new COPY_VARIABLE(args2),
    SLOT_SAVE: () => new SLOT_SAVE(),
    SLOT_LOAD: (args2) => new SLOT_LOAD(args2),
    SLOT_ERASE: (args2) => new SLOT_ERASE(args2),
    SET_CONNECT_SERIAL_DIALOG: (args2) => new SET_CONNECT_SERIAL_DIALOG(args2),
    SHOW_SERIAL_DIALOG: (args2) => new SHOW_SERIAL_DIALOG(args2),
    SET_MAP_LOOK_SCRIPT: (args2) => new SET_MAP_LOOK_SCRIPT(args2),
    SET_ENTITY_LOOK_SCRIPT: (args2) => new SET_ENTITY_LOOK_SCRIPT(args2),
    SET_TELEPORT_ENABLED: (args2) => new SET_TELEPORT_ENABLED(args2),
    SET_BLE_FLAG: (args2) => new SET_BLE_FLAG(args2),
    SET_SERIAL_DIALOG_CONTROL: (args2) => new SET_SERIAL_DIALOG_CONTROL(args2),
    REGISTER_SERIAL_DIALOG_COMMAND: (args2) => {
      return new REGISTER_SERIAL_DIALOG_COMMAND(args2);
    },
    REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: (args2) => {
      return new REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT(args2);
    },
    SET_ENTITY_MOVEMENT_RELATIVE: (args2) => {
      return new SET_ENTITY_MOVEMENT_RELATIVE(args2);
    },
    CLOSE_DIALOG: () => new CLOSE_DIALOG(),
    CLOSE_SERIAL_DIALOG: () => new CLOSE_SERIAL_DIALOG(),
    SET_LIGHTS_CONTROL: (args2) => new SET_LIGHTS_CONTROL(args2),
    SET_LIGHTS_STATE: (args2) => new SET_LIGHTS_STATE(args2),
    GOTO_ACTION_INDEX: (args2) => new GOTO_ACTION_INDEX(args2),
    SET_SCRIPT_PAUSE: (args2) => new SET_SCRIPT_PAUSE(args2),
    REGISTER_SERIAL_DIALOG_COMMAND_ALIAS: (args2) => {
      return new REGISTER_SERIAL_DIALOG_COMMAND_ALIAS(args2);
    },
    UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS: (args2) => {
      return new UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS(args2);
    },
    SET_SERIAL_DIALOG_COMMAND_VISIBILITY: (args2) => {
      return new SET_SERIAL_DIALOG_COMMAND_VISIBILITY(args2);
    },
    CHECK_ENTITY_NAME: (args2) => new CHECK_ENTITY_NAME(args2),
    CHECK_ENTITY_X: (args2) => new CHECK_ENTITY_X(args2),
    CHECK_ENTITY_Y: (args2) => new CHECK_ENTITY_Y(args2),
    CHECK_ENTITY_INTERACT_SCRIPT: (args2) => {
      return new CHECK_ENTITY_INTERACT_SCRIPT(args2);
    },
    CHECK_ENTITY_TICK_SCRIPT: (args2) => new CHECK_ENTITY_TICK_SCRIPT(args2),
    CHECK_ENTITY_LOOK_SCRIPT: (args2) => new CHECK_ENTITY_LOOK_SCRIPT(args2),
    CHECK_ENTITY_TYPE: (args2) => new CHECK_ENTITY_TYPE(args2),
    CHECK_ENTITY_PRIMARY_ID: (args2) => new CHECK_ENTITY_PRIMARY_ID(args2),
    CHECK_ENTITY_SECONDARY_ID: (args2) => new CHECK_ENTITY_SECONDARY_ID(args2),
    CHECK_ENTITY_PRIMARY_ID_TYPE: (args2) => {
      return new CHECK_ENTITY_PRIMARY_ID_TYPE(args2);
    },
    CHECK_ENTITY_CURRENT_ANIMATION: (args2) => {
      return new CHECK_ENTITY_CURRENT_ANIMATION(args2);
    },
    CHECK_ENTITY_CURRENT_FRAME: (args2) => new CHECK_ENTITY_CURRENT_FRAME(args2),
    CHECK_ENTITY_DIRECTION: (args2) => new CHECK_ENTITY_DIRECTION(args2),
    CHECK_ENTITY_GLITCHED: (args2) => new CHECK_ENTITY_GLITCHED(args2),
    CHECK_ENTITY_PATH: (args2) => new CHECK_ENTITY_PATH(args2),
    CHECK_SAVE_FLAG: (args2) => new CHECK_SAVE_FLAG(args2),
    CHECK_IF_ENTITY_IS_IN_GEOMETRY: (args2) => {
      return new CHECK_IF_ENTITY_IS_IN_GEOMETRY(args2);
    },
    CHECK_FOR_BUTTON_PRESS: (args2) => new CHECK_FOR_BUTTON_PRESS(args2),
    CHECK_FOR_BUTTON_STATE: (args2) => new CHECK_FOR_BUTTON_STATE(args2),
    CHECK_WARP_STATE: (args2) => new CHECK_WARP_STATE(args2),
    CHECK_VARIABLE: (args2) => new CHECK_VARIABLE(args2),
    CHECK_VARIABLES: (args2) => new CHECK_VARIABLES(args2),
    CHECK_MAP: (args2) => new CHECK_MAP(args2),
    CHECK_BLE_FLAG: (args2) => new CHECK_BLE_FLAG(args2),
    CHECK_DIALOG_OPEN: (args2) => new CHECK_DIALOG_OPEN(args2),
    CHECK_SERIAL_DIALOG_OPEN: (args2) => new CHECK_SERIAL_DIALOG_OPEN(args2),
    CHECK_DEBUG_MODE: (args2) => new CHECK_DEBUG_MODE(args2)
  };
  const debugLog = (message) => {
  };
  const ansiTags = {
    // styles
    bold: "\x1B[1m",
    // aka bright
    dim: "\x1B[2m",
    // aka dim
    "/": "\x1B[0m",
    reset: "\x1B[0m",
    // reset all styles
    // fg colors
    k: "\x1B[30m",
    black: "\x1B[30m",
    r: "\x1B[31m",
    red: "\x1B[31m",
    g: "\x1B[32m",
    green: "\x1B[32m",
    y: "\x1B[33m",
    yellow: "\x1B[33m",
    b: "\x1B[34m",
    blue: "\x1B[34m",
    m: "\x1B[35m",
    magenta: "\x1B[35m",
    c: "\x1B[36m",
    cyan: "\x1B[36m",
    w: "\x1B[37m",
    white: "\x1B[37m",
    // bg colors
    "bg-k": "\x1B[40m",
    "bg-black": "\x1B[40m",
    "bg-r": "\x1B[41m",
    "bg-red": "\x1B[41m",
    "bg-g": "\x1B[42m",
    "bg-green": "\x1B[42m",
    "bg-y": "\x1B[43m",
    "bg-yellow": "\x1B[43m",
    "bg-b": "\x1B[44m",
    "bg-blue": "\x1B[44m",
    "bg-m": "\x1B[45m",
    "bg-magenta": "\x1B[45m",
    "bg-c": "\x1B[46m",
    "bg-cyan": "\x1B[46m",
    "bg-w": "\x1B[47m",
    "bg-white": "\x1B[47m",
    // non-color-related
    bell: "\x07"
  };
  const printAction = (v) => {
    if (v instanceof Action) return v.print();
    if (v instanceof MathlangNode) return v.print();
    throw new Error("unhandled print case");
  };
  const printScript = (scriptName, actions) => {
    const printedActions = actions.map(printAction).filter((v) => v !== void 0).map((v) => {
      return v.split("\n").map((v2) => `	${v2}`).join("\n");
    });
    const ret = [`"${scriptName}" {`, ...printedActions, "}"];
    return ret.join("\n");
  };
  const TEMP = "__TEMP_";
  const temporaries = [];
  let temporaryStep = 0;
  const newTemporary = (value) => {
    if (temporaries.length === 0 && value !== void 0) {
      temporaries.unshift(value);
    } else {
      temporaries.unshift(TEMP + temporaryStep);
      temporaryStep += 1;
    }
    return temporaries[0] || "";
  };
  const dropTemporary = () => {
    temporaryStep -= 1;
    temporaryStep = temporaryStep < 0 ? 0 : temporaryStep;
    return temporaries.shift() || "";
  };
  const quickTemporary = () => {
    newTemporary();
    return dropTemporary();
  };
  const latestTemporary = () => temporaries[0];
  const inverseOpMap = {
    "<": ">=",
    "<=": ">",
    ">=": "<",
    ">": "<=",
    "==": "!=",
    "!=": "==",
    "&&": "||",
    "||": "&&"
  };
  const reportMissingChildNodes = (f, node) => {
    const missingNodes = node.children.filter((v) => v !== null).filter((child) => child == null ? void 0 : child.isMissing);
    missingNodes.forEach((missingChild) => {
      f.quickError(missingChild, `missing token: ${missingChild.type}`);
    });
    return missingNodes;
  };
  const reportErrorNodes = (f, node) => {
    const errorNodes = node.children.filter((v) => v !== null).filter((child) => child.type === "ERROR");
    errorNodes.forEach((errorNode) => {
      f.quickError(errorNode, "syntax error");
    });
    return errorNodes;
  };
  const printableLocation = (fileMap, location2) => {
    const fileName = location2.fileName || "";
    const fileText = fileMap[fileName].fileText;
    const allLines = fileText.split("\n");
    const row = location2.node.startPosition.row;
    const col = location2.node.startPosition.column;
    const endRow = location2.node.endPosition.row;
    const endCol = location2.node.endPosition.column;
    const line = allLines[row].replace(/\t/g, " ");
    const squigglySize = row === endRow ? endCol - col : allLines[row].length - col;
    const arrow = "~".repeat(col) + "^".repeat(squigglySize);
    const message = `╓-${fileName} ${row}:${col}
║ ${line}
╙~` + arrow;
    return message;
  };
  const printableMessage = (fileMap, prefix, v) => {
    let message = `${prefix}: ${v.message}
` + v.locations.map((location2) => {
      return printableLocation(fileMap, location2);
    }).join("\n");
    if (v.footer) {
      message += "\n" + v.footer;
    }
    return message + "\n";
  };
  const autoIdentifierName = (f, node) => {
    return f.fileName + "-" + node.startPosition.row + ":" + node.startPosition.column;
  };
  const simpleBranchMaker = (f, node, condition, trueBlock, falseBlock) => {
    const debug = new MathlangLocation(f, node);
    const n = f.p.advanceGotoSuffix();
    const ifLabel = `if true #${n}`;
    const rendezvousLabel = `rendezvous #${n}`;
    let top = [];
    if (condition instanceof BoolComparison || condition instanceof BoolGetable) {
      top = [Action.fromArgs({ ...condition, label: ifLabel })];
    } else if (condition instanceof BoolBinaryExpression) {
      top = condition.flatten(ifLabel);
    }
    const steps = [
      ...top,
      ...falseBlock,
      GotoLabel.quick(debug, rendezvousLabel),
      LabelDefinition.quick(debug, ifLabel),
      ...trueBlock,
      LabelDefinition.quick(debug, rendezvousLabel)
    ];
    return new MathlangSequence(debug, {
      steps,
      type: "longerBranchMaker"
    });
  };
  class ConditionalBlock {
    constructor(f, node, type) {
      __publicField(this, "condition");
      __publicField(this, "conditionNode");
      __publicField(this, "body");
      __publicField(this, "bodyNode");
      __publicField(this, "debug");
      const debug = new MathlangLocation(f, node);
      this.conditionNode = mandatoryChildForFieldName(f, node, "condition");
      let condition = handleCapture(f, this.conditionNode);
      if (typeof condition === "string") condition = CheckSaveFlag.quick(debug, condition);
      if (!(condition instanceof BoolExpression)) {
        throw new Error(type + " condition not BoolExpression");
      }
      this.condition = condition;
      this.bodyNode = mandatoryChildForFieldName(f, node, "body");
      this.body = handleNamedChildren(f, this.bodyNode);
      this.debug = new MathlangLocation(f, node);
    }
  }
  const newElse = (f, elseNode) => {
    let elseBody = [];
    if (elseNode && elseNode.lastChild) {
      elseBody = handleNamedChildren(f, elseNode.lastChild);
    }
    return elseBody;
  };
  const ifChainMaker = (f, node, iffs, elseBody, label) => {
    const debug = new MathlangLocation(f, node);
    const rendezvousL = label + ` rendezvous #${f.p.advanceGotoSuffix()}`;
    const steps = [];
    let bottomSteps = [];
    iffs.forEach((iff) => {
      const ifL = `if true #${f.p.advanceGotoSuffix()}`;
      steps.push(...iff.condition.flatten(ifL));
      const bottomInsert = [
        new LabelDefinition(debug, { label: ifL }),
        ...iff.body,
        GotoLabel.quick(new MathlangLocation(f, iff.bodyNode || iff.debug.node), rendezvousL)
      ];
      bottomSteps = bottomInsert.concat(bottomSteps);
    });
    steps.push(...elseBody);
    steps.push(GotoLabel.quick(new MathlangLocation(f, node), rendezvousL));
    const combined = steps.concat(bottomSteps);
    combined.push(LabelDefinition.quick(debug, rendezvousL));
    return new MathlangSequence(debug, { steps: combined, type: "parser-node: " + label });
  };
  const simplifyLabelGotos = (actions) => {
    for (let i2 = 0; i2 < actions.length; i2++) {
      const action = actions[i2];
      const next = actions[i2 + 1];
      if (action instanceof GotoLabel && next instanceof LabelDefinition && next.label === action.label) {
        actions.splice(i2, 1);
      }
    }
    const labelDefThenDifferentGotoLabel = {};
    actions.forEach((action, i2) => {
      if (action instanceof LabelDefinition) {
        const next = actions[i2 + 1];
        if (next instanceof GotoLabel) {
          labelDefThenDifferentGotoLabel[action.label] = next.label;
        }
      }
    });
    actions.forEach((action) => {
      if (action instanceof GotoLabel) {
        const alias = labelDefThenDifferentGotoLabel[action.label];
        if (alias) {
          action.label = alias;
        }
      }
    });
    return actions;
  };
  class FileState {
    constructor(p, fileName) {
      __publicField(this, "p");
      __publicField(this, "fileName");
      __publicField(this, "constants");
      __publicField(this, "settings");
      __publicField(this, "nodes");
      __publicField(this, "errorCount");
      __publicField(this, "warningCount");
      this.p = p;
      this.fileName = fileName;
      this.constants = {};
      this.settings = {
        default: {},
        entity: {},
        label: {},
        serial: {}
      };
      this.nodes = [];
      this.errorCount = 0;
      this.warningCount = 0;
    }
    quickError(node, message, footer) {
      const err2 = {
        message,
        locations: [
          {
            node,
            fileName: this.fileName
          }
        ]
      };
      if (footer) {
        err2.footer = footer;
      }
      this.p.newError(err2);
      this.errorCount += 1;
    }
    newError(message) {
      this.p.newError(message);
      this.errorCount += 1;
    }
    quickWarning(node, message, footer) {
      const warn = {
        message,
        locations: [
          {
            node,
            fileName: this.fileName
          }
        ]
      };
      if (footer) {
        warn.footer = footer;
      }
      this.p.newWarning(warn);
      this.warningCount += 1;
    }
    newWarning(message) {
      this.p.newWarning(message);
      this.warningCount += 1;
    }
    // print the file's parse status
    printableMessageInformation() {
      if (this.errorCount === 0 && this.warningCount === 0) {
        return `(${ansiTags.green}OK${ansiTags.reset})`;
      }
      const errMessage = this.errorCount ? `${ansiTags.red}${this.errorCount} error${this.errorCount === 1 ? "" : "s"}${ansiTags.reset}` : `0 errors`;
      const warnMessage = this.warningCount ? `${ansiTags.yellow}${this.warningCount} warning${this.warningCount === 1 ? "" : "s"}${ansiTags.reset}` : `0 warnings`;
      const ret = [errMessage, warnMessage].join(", ");
      return `(${ret})`;
    }
  }
  const copyRecursion = [];
  class ProjectState {
    constructor(tsParser, fileMap, scenarioData) {
      // stuff needed to be handed around
      __publicField(this, "parser");
      __publicField(this, "fileMap");
      // global project things
      __publicField(this, "scripts");
      __publicField(this, "dialogs");
      __publicField(this, "serialDialogs");
      // duplicates
      __publicField(this, "duplicates");
      // error/warning messages
      __publicField(this, "errors");
      __publicField(this, "warnings");
      // auto counter, so that auto-generated gotos don't share labels:
      __publicField(this, "gotoSuffixValue");
      Object.entries(scenarioData).forEach(([k, v]) => {
        this[k] = v;
      });
      this.parser = tsParser;
      this.fileMap = fileMap;
      this.scripts = {};
      this.dialogs = {};
      this.serialDialogs = {};
      this.duplicates = {
        scripts: {},
        dialogs: {},
        serialDialogs: {}
      };
      this.errors = [];
      this.warnings = [];
      this.gotoSuffixValue = 0;
    }
    newError(v) {
      this.errors.push(v);
    }
    newWarning(v) {
      this.warnings.push(v);
    }
    advanceGotoSuffix() {
      return ++this.gotoSuffixValue;
    }
    getGotoSuffix() {
      return this.gotoSuffixValue;
    }
    // for adding a file's data to the project
    addScript(data) {
      const name2 = data.scriptName;
      data.rawNodes = data.actions;
      const finalizedActions = [];
      data.rawNodes.forEach((node) => {
        if (node instanceof DialogDefinition) {
          this.addDialog(node);
        } else if (node instanceof SerialDialogDefinition) {
          this.addSerialDialog(node);
        } else {
          finalizedActions.push(node);
        }
      });
      data.actions = simplifyLabelGotos(finalizedActions.flat());
      if (!this.scripts[name2]) {
        this.scripts[name2] = data;
      } else {
        if (!this.duplicates.scripts[name2]) {
          this.duplicates.scripts[name2] = [this.scripts[name2]];
        }
        this.duplicates.scripts[name2].push(data);
      }
    }
    addDialog(data) {
      const name2 = data.dialogName;
      if (!this.dialogs[name2]) {
        this.dialogs[name2] = data;
      } else {
        if (!this.duplicates.dialogs[name2]) {
          this.duplicates.dialogs[name2] = [this.dialogs[name2]];
        }
        this.duplicates.dialogs[name2].push(data);
      }
    }
    addSerialDialog(data) {
      const name2 = data.dialogName;
      if (!this.serialDialogs[name2]) {
        this.serialDialogs[name2] = data;
      } else {
        if (!this.duplicates.serialDialogs[name2]) {
          this.duplicates.serialDialogs[name2] = [this.serialDialogs[name2]];
        }
        this.duplicates.serialDialogs[name2].push(data);
      }
    }
    // take the given file name and expand all copy_script inside
    // needs to be here because it can call itself
    bakeCopyScriptSingle(f, node, scriptName) {
      if (copyRecursion.includes(scriptName)) {
        copyRecursion.push(scriptName);
        throw new Error(`copy_macro recursion
       ${copyRecursion.join("\n       -> ")}`);
      }
      copyRecursion.push(scriptName);
      const finalActions = [];
      const scriptData = this.scripts[scriptName];
      scriptData.actions.forEach((action) => {
        if (!(action instanceof COPY_SCRIPT) && !(action instanceof CopyMacro)) {
          finalActions.push(action);
          return;
        }
        const targetScript = action.script;
        if (!this.scripts[targetScript]) {
          const useNode = action instanceof MathlangNode ? action.debug.node.childForFieldName("script") || action.debug.node : node;
          this.newError({
            locations: [
              {
                fileName: scriptData.debug.fileName,
                node: useNode
              }
            ],
            message: "copy_script: no script found by the name " + targetScript
          });
          return;
        }
        if (!this.scripts[action.script].copyScriptResolved) {
          this.bakeCopyScriptSingle(f, node, action.script);
        }
        const labelSuffix = "c" + this.advanceGotoSuffix();
        const copiedActions = this.scripts[action.script].actions.map(
          (copiedAction) => {
            if (doesNodeHaveLabelToChangeToIndex(copiedAction) && copiedAction.label || copiedAction instanceof LabelDefinition) {
              copiedAction.label += labelSuffix;
            }
            return copiedAction;
          }
        );
        if (action instanceof COPY_SCRIPT && action.search_and_replace) {
          const searchAndReplace = action.search_and_replace;
          const searchedAndReplaced = copiedActions.map((v) => {
            if (v instanceof MathlangNode) return v;
            if (!(v instanceof Action)) throw new Error("Should be an Action");
            let string = JSON.stringify(v);
            Object.entries(searchAndReplace).forEach(([k, v2]) => {
              string = string.replace(new RegExp(k, "g"), v2);
            });
            let ret = "";
            try {
              ret = JSON.parse(string);
            } catch (e) {
              const error = new Error("failed to parse JSON in bakeCopyScriptSingle");
              error.cause = e;
              throw error;
            }
            return Action.fromArgs(ret);
          });
          const comment = `Copying: ${action.script} (-${labelSuffix}) with search_and_replace: ${JSON.stringify(action.search_and_replace)}`;
          finalActions.push(CommentNode.quick(new MathlangLocation(f, node), comment));
          finalActions.push(...searchedAndReplaced);
        } else {
          const comment = `Copying: ${action.script} (-${labelSuffix})`;
          finalActions.push(CommentNode.quick(new MathlangLocation(f, node), comment));
          finalActions.push(...copiedActions);
        }
      });
      this.scripts[scriptName].copyScriptResolved = true;
      this.scripts[scriptName].actions = finalActions;
      copyRecursion.pop();
    }
    parseFile(fileName) {
      const fileMap = this.fileMap;
      const text = fileMap[fileName].fileText;
      const ast = this.parser.parse(text);
      if (!ast) throw new Error("tree-sitter parser failed to produce AST");
      const document2 = ast.rootNode;
      const f = new FileState(this, fileName);
      let catastrophicErrorReported = false;
      const nodes = document2.namedChildren.map((node) => {
        if (catastrophicErrorReported) {
          return;
        } else if (node && !node.isError) {
          return handleNode(f, node);
        } else if (!catastrophicErrorReported) {
          if ((node == null ? void 0 : node.text) === ";") {
            f.quickError(node, `unexpected semicolon`);
          } else {
            if (!node) {
              throw new Error("no node found for catastrophic error case");
            }
            f.quickError(
              node,
              `catastrophic syntax error (naive guess: invalid script name)`,
              `Avoid keywords for bare script names in definitions, or wrap the script name in quotes
   add { ... } // INVALID
   include { ... } // INVALID
   script add { ... } // fix with keyword
   "include" { ... } // fix with quotes
`
            );
            catastrophicErrorReported = true;
          }
        }
      }).flat().filter((v) => v);
      f.nodes = nodes.filter((v) => v !== void 0);
      fileMap[fileName].parsed = f;
      return f;
    }
  }
  const parseProject = async (fileMap, scenarioData) => {
    const parser = await initTreeSitter();
    const p = new ProjectState(parser, fileMap, scenarioData);
    Object.keys(fileMap).forEach((fileName) => {
      if (fileName.endsWith(".mgs") && !fileMap[fileName].parsed) {
        p.parseFile(fileName);
      }
    });
    Object.keys(fileMap).forEach((fileName) => {
      if (!fileName.endsWith(".mgs")) return;
      const f = fileMap[fileName].parsed;
      if (!f) throw new Error(`File "${fileName}" failed to parse in time (?)`);
      f.nodes.forEach((node) => {
        if (node instanceof ScriptDefinition) {
          p.addScript(node);
        } else if (node instanceof DialogDefinition) {
          p.addDialog(node);
        } else if (node instanceof SerialDialogDefinition) {
          p.addSerialDialog(node);
        }
      });
      debugLog(
        `File ${ansiTags.c}"${fileName}"${ansiTags.reset} complete! ` + f.printableMessageInformation()
      );
    });
    const cats = ["scripts", "dialogs", "serialDialogs"];
    cats.forEach((category) => {
      const entries = Object.entries(p.duplicates[category]);
      entries.forEach(([name2, dupes]) => {
        p.newError({
          message: `multiple ${category} with name "${name2}"`,
          locations: dupes.map((dupe) => ({
            fileName: dupe.debug.fileName,
            node: dupe.debug.node.firstNamedChild || dupe.debug.node
          }))
        });
        dupes.forEach((dupe) => {
          const file = p.fileMap[dupe.debug.fileName].parsed;
          if (!file) {
            throw new Error(`No parsed file found by name "${dupe.debug.fileName}"`);
          }
          file.errorCount += 1;
        });
      });
    });
    Object.keys(p.scripts).forEach((scriptName) => {
      const standardizedActions = p.scripts[scriptName].actions.filter(
        (v) => !(v instanceof CommentNode) && !(v instanceof DialogDefinition) && !(v instanceof SerialDialogDefinition)
      ).map((action, i2, arr) => {
        const OOB = arr.length;
        if (action instanceof CopyMacro) {
          const manual = COPY_SCRIPT.quick(breakIfNotString(action.script));
          return manual;
        }
        if (action instanceof LabelDefinition) {
          const value = breakIfNotString(action.label);
          return new LABEL({ value });
        }
        if (action instanceof GotoLabel) {
          const ret = new GOTO_ACTION_INDEX({
            action_index: breakIfNotString(action.label)
          });
          return ret;
        }
        if (action instanceof ReturnStatement) {
          const ret = new GOTO_ACTION_INDEX({
            action_index: OOB
          });
          return ret;
        }
        if (action instanceof BoolGetable || action instanceof BoolComparison) {
          return Action.fromArgs(action);
        }
        if (!(action instanceof Action)) {
          throw new Error("Found non-Action when trying to standardize Action");
        }
        return action;
      });
      p.scripts[scriptName].preActions = standardizedActions.map((v) => ({ ...v }));
      p.scripts[scriptName].prePrint = printScript(scriptName, standardizedActions);
    });
    Object.keys(p.scripts).forEach((scriptName) => {
      if (!p.scripts[scriptName].copyScriptResolved) {
        const fileName = p.scripts[scriptName].debug.fileName;
        const f = p.fileMap[fileName].parsed || p.scripts[scriptName].debug.f;
        if (!f) throw new Error(`file ${fileName} not parsed`);
        const node = p.scripts[scriptName].debug.node;
        p.bakeCopyScriptSingle(f, node, scriptName);
      }
    });
    Object.keys(p.scripts).forEach((scriptName) => {
      p.scripts[scriptName].testPrint = printScript(scriptName, p.scripts[scriptName].actions);
    });
    Object.keys(p.scripts).forEach((scriptName) => {
      const scriptData = p.scripts[scriptName];
      const registry = {};
      const actions = scriptData.actions;
      let gaplessIndex = 0;
      for (let i2 = 0; i2 < actions.length; i2++) {
        const currAction = actions[i2];
        if (currAction instanceof CommentNode || currAction instanceof DialogDefinition || currAction instanceof SerialDialogDefinition) {
          continue;
        } else if (currAction instanceof LabelDefinition) {
          registry[currAction.label] = gaplessIndex;
          const comment = `'${currAction.label}':`;
          actions[i2] = CommentNode.quick(currAction.debug, comment);
        } else {
          gaplessIndex += 1;
        }
      }
      actions.forEach((action, i2) => {
        if (doesNodeHaveLabelToChangeToIndex(action)) {
          if (!action.label) throw new Error(`action should have a label and doesn't`);
          const jumpToIndex = registry[action.label];
          if (jumpToIndex === void 0) {
            throw new Error(
              `Jump index not registered for label "${action.label}" in script "${scriptName}"`
            );
          }
          if (action instanceof GotoLabel) {
            actions[i2] = GOTO_ACTION_INDEX.quick(jumpToIndex);
          } else {
            action.comment = `goto label '${action.label}'`;
            action.jump_index = jumpToIndex;
            delete action.label;
          }
        }
      });
    });
    Object.keys(p.scripts).forEach((scriptName) => {
      const actions = p.scripts[scriptName].actions;
      p.scripts[scriptName].printed = printScript(scriptName, actions);
      p.scripts[scriptName].actions = actions.filter((item) => item instanceof Action);
    });
    const messages = [];
    const errCount = p.errors.length;
    const warnCount = p.warnings.length;
    if (errCount) {
      messages.push(ansiTags.red + `${errCount} error${plural(errCount)}` + ansiTags.reset);
    }
    if (warnCount) {
      messages.push(ansiTags.yellow + `${warnCount} warning${plural(warnCount)}` + ansiTags.reset);
    }
    if (messages.length) {
      console.log(`Issues found: ${messages.join(", ")}`);
    } else {
      console.log(`All your project's MGS files parsed with no issues!`);
    }
    p.warnings.forEach((message) => {
      const str = ansiTags.yellow + printableMessage(p.fileMap, "Warning", message) + ansiTags.reset;
      console.warn(str);
    });
    p.errors.forEach((message) => {
      const str = ansiTags.red + printableMessage(p.fileMap, "Error", message) + ansiTags.reset;
      console.error(str);
    });
    return p;
  };
  const plural = (n) => n !== 1 ? "s" : "";
  const __viteBrowserExternal = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: "Module" }));
  const treeSitterMagegamescript = "data:application/wasm;base64,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AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAIvAXYO7AkAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4ABgQGCAYMBhAGFAYYBhwGIAYkBigGLAYwBjQGOAY8BkAGRAZIBkwGUAZUBlgGXAZgBmQGaAZsBnAGdAZ4BnwGgAaEBogGjAaQBpQGmAacBqAGpAaoBqwGsAa0BrgGvAbABsQGyAbMBtAG1AbYBtwG4AbkBugG7AbwBvQG+Ab8BwAHBAcIBwwHEAcUBxgHHAcgByQHKAcsBzAHNAc4BzwHQAdEB0gHTAdQB1QHWAdcB2AHZAdoB2wHcAd0B3gHfAeAB4QHiAeMB5AHlAeYB5wHoAekB6gHrAewB7QHuAe8B8AHxAfIB8wH0AfUB9gH3AfgB+QH6AfsB/AH9Af4B/wGAAoECggKDAoQChQKGAocCiAKJAooCiwKMAo0CjgKPApACkQKSApMClAKVApYClwKYApkCmgKbApwCnQKeAp8CoAKhAqICowKkAqUCpgKnAqgCqQKqAqsCrAKtAq4CrwKwArECsgKzArQCtQK2ArcCuAK5AroCuwK8Ar0CvgK/AsACwQLCAsMCxALFAsYCxwLIAskCygLLAswCzQLOAs8C0ALRAtIC0wLUAtUC1gLXAtgC2QLaAtsC3ALdAt4C3wLgAuEC4gLjAuQC5QLmAucC6ALpAuoC6wLsAu0C7gLvAvAC8QLyAvMC9AL1AvYC9wL4AvkC+gL7AvwC/QL+Av8CgAOBA4IDgwOEA4UDhgOHA4gDiQOKA4sDjAONA44DjwOQA5EDkgOTA5QDlQOWA5cDmAOZA5oDmwOcA50DngOfA6ADoQOiA6MDpAOlA6YDpwOoA6kDqgOrA6wDrQOuA68DsAOxA7IDswO0A7UDtgO3A7gDuQO6A7sDvAO9A74DvwPAA8EDwgPDA8QDxQPGA8cDyAPJA8oDywPMA80DzgPPA9AD0QPSA9MD1APVA9YD1wPYA9kD2gPbA9wD3QPeA98D4APhA+ID4wPkA+UD5gPnA+gD6QPqA+sD7APtA+4D7wPwA/ED8gPzA/QD9QP2A/cD+AP5A/oD+wP8A/0D/gP/A4AEgQSCBIMEhASFBIYEhwSIBIkEigSLBIwEjQSOBI8EkASRBJIEkwSUBJUElgSXBJgEmQSaBJsEnASdBJ4EnwSgBKEEogSjBKQEpQSmBKcEqASpBKoEqwSsBK0ErgSvBLAEsQSyBLMEtAS1BLYEtwS4BLkEugS7BLwEvQS+BL8EwATBBMIEwwTEBMUExgTHBMgEyQTKBMsEzATNBM4EzwTQBNEE0gTTBNQE1QTWBNcE2ATZBNoE2wTcBN0E3gTfBOAE4QTiBOME5ATlBOYE5wToBOkE6gTrBOwE7QTuBO8E8ATxBPIE8wT0BPUE9gT3BPgE+QT6BPsE/AT9BP4E/wSABYEFggWDBYQFhQWGBYcFiAWJBYoFiwWMBY0FjgWPBZAFkQWSBZMFlAWVBZYFlwWYBZkFmgWbBZwFnQWeBZ8FoAWhBaIFowWkBaUFpgWnBagFqQWqBasFrAWtBa4FrwWwBbEFsgWzBbQFtQW2BbcFuAW5BboFuwW8Bb0FvgW/BcAFwQXCBcMFxAXFBcYFxwXIBckFygXLBcwFzQXOBc8F0AXRBdIF0wXUBdUF1gXXBdgF2QXaBdsF3AXdBd4F3wXgBeEF4gXjBeQF5QXmBecF6AXpBeoF6wXsBe0F7gXvBfAF8QXyBfMF9AX1BfYF9wX4BfkF+gX7BfwF/QX+Bf8FgAaBBoIGgwaEBoUGhgaHBogGiQaKBosGjAaNBo4GjwaQBpEGkgaTBpQGlQaWBpcGmAaZBpoGmwacBp0GngafBqAGoQaiBqMGpAalBqYGpwaoBqkGqgarBqwGrQauBq8GsAaxBrIGswa0BrUGtga3BrgGuQa6BrsGvAa9Br4GvwbABsEGwgbDBsQGxQbGBscGyAbJBsoGywbMBs0GzgbPBtAG0QbSBtMG1AbVBtYG1wbYBtkG2gbbBtwG3QbeBt8G4AbhBuIG4wbkBuUG5gbnBugG6QbqBusG7AbtBu4G7wbwBvEG8gbzBvQG9Qb2BvcG+Ab5BvoG+wb8Bv0G/gb/BoAHgQeCB4MHhAeFB4YHhweIB4kHigeLB4wHjQeOB48HkAeRB5IHkweUB5UHlgeXB5gHmQeaB5sHnAedB54HnwegB6EHogejB6QHpQemB6cHqAepB6oHqwesB60HrgevB7AHsQeyB7MHtAe1B7YHtwe4B7kHuge7B7wHvQe+B78HwAfBB8IHwwfEB8UHxgfHB8gHyQfKB8sHzAfNB84HzwfQB9EH0gfTB9QH1QfWB9cH2AfZB9oH2wfcB90H3gffB+AH4QfiB+MH5AflB+YH5wfoB+kH6gfrB+wH7QfuB+8H8AfxB/IH8wf0B/UH9gf3B/gH+Qf6B/sH/Af9B/4H/weACIEIggiDCIQIhQiGCIcIiAiJCIoIiwiMCI0IjgiPCJAIkQiSCJMIlAiVCJYIlwiYCJkImgibCJwInQieCJ8IoAihCKIIowikCKUIpginCKgI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bQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAgAAEAmwCiAQcABwAOAA8AEAARABgAMACgASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAhAAEAmwCmAQcABwAOAA8AEAARABgAMACkASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAiAAEAmwCqAQQABwAOAA8AGACoAS0ABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCBAIIAgwCEAJIABQADAAEAAQAFAAEABAAjAAEAmwCuAQQABwAOAA8AGACsAS0ABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCBAIIAgwCEAJIABQADAAEAAQAFAAEABAAkAAEAmwCyAQQABwAOAA8AGACwAS0ABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCBAIIAgwCEAJIABQADAAEAAQAFAAEABAAlAAEAmwC2AQcABwAOAA8AEAARABgAMAC0ASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAmAAEAmwC6AQQABwAOAA8AGAC4AS0ABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCBAIIAgwCEAJIABQADAAEAAQAFAAEABAAnAAEAmwAlAAQABwAOAA8AGAC8ASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAKAABAJsAsgEEAAcADgAPABgAsAEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEACkAAQCbAMABBAAHAA4ADwAYAL4BLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAqAAEAmwCqAQUABwAOAA8AGAAwAKgBKwAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AgQCCAIMAhACSAAUAAwABAAEABQABAAQAKwABAJsArgEFAAcADgAPABgAMACsASsABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIEAggCDAIQAkgAFAAMAAQABAAUAAQAEACwAAQCbAMQBBAAHAA4ADwAYAMIBLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAtAAEAmwDIAQQABwAOAA8AGADGASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQALgABAJsAzAEEAAcADgAPABgAygEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAC8AAQCbANABBAAHAA4ADwAYAM4BLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAwAAEAmwDUAQQABwAOAA8AGADSASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAMQABAJsAtgEEAAcADgAPABgAtAEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEADIAAQCbANgBBAAHAA4ADwAYANYBLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAAzAAEAmwDcAQQABwAOAA8AGADaASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQANAABAJsA4AEEAAcADgAPABgA3gEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEADUAAQCbAKYBBAAHAA4ADwAYAKQBLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAA2AAEAmwDkAQQABwAOAA8AGADiASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQANwABAJsA6AEEAAcADgAPABgA5gEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEADgAAQCbAKIBBAAHAA4ADwAYAKABLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAA5AAEAmwDsAQQABwAOAA8AGADqASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAOgABAJsA8AEEAAcADgAPABgA7gEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEADsAAQCbAPQBBAAHAA4ADwAYAPIBLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAA8AAEAmwD4AQQABwAOAA8AGAD2ASwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAPQABAJsA/AEEAAcADgAPABgA+gEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAD4AAQCbAAACBAAHAA4ADwAYAP4BLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABAA/AAEAmwAEAgQABwAOAA8AGAACAiwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAQAABAJsACAIEAAcADgAPABgABgIsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAEEAAQCbAAwCBAAHAA4ADwAYAAoCLAAGAB0AJwAtADEAMgAzADQANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABCAAEAmwAQAgQABwAOAA8AGAAOAiwABgAdACcALQAxADIAMwA0ADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAQwABAJsAFAIEAAcADgAPABgAEgIsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAEQAAQCbALoBBQAHAA4ADwAYADAAuAErAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCBAIIAgwCEAJIABQADAAEAAQAFAAEABABFAAEAmwCyAQUABwAOAA8AGAAwALABKwAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AgQCCAIMAhACSAAUAAwABAAEABQABAAQARgABAJsAugEEAAcADgAPABgAuAEsAAYAHQAnAC0AMQAyADMANAA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAEcAAQCbAAACBQAHAA4ADwAYADAA/gEqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQASAABAJsA2AEFAAcADgAPABgAMADWASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABJAAEAmwDcAQUABwAOAA8AGAAwANoBKgAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAEoAAQCbAOABBQAHAA4ADwAYADAA3gEqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQASwABAJsA5AEFAAcADgAPABgAMADiASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABMAAEAmwDoAQUABwAOAA8AGAAwAOYBKgAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAE0AAQCbAOwBBQAHAA4ADwAYADAA6gEqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQATgABAJsA8AEFAAcADgAPABgAMADuASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABPAAEAmwD0AQUABwAOAA8AGAAwAPIBKgAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAFAAAQCbAPgBBQAHAA4ADwAYADAA9gEqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAUQABAJsA/AEFAAcADgAPABgAMAD6ASoABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABSAAEAmwDMAQUABwAOAA8AGAAwAMoBKgAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAFMAAQCbAAQCBQAHAA4ADwAYADAAAgIqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAVAABAJsACAIFAAcADgAPABgAMAAGAioABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABVAAEAmwAMAgUABwAOAA8AGAAwAAoCKgAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAFYAAQCbABACBQAHAA4ADwAYADAADgIqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEABQABAAQAVwABAJsAFAIFAAcADgAPABgAMAASAioABgAdACcALQAxADIANQA2ADcAOQA6ADsAPAA+AD8AQABBAEIAQwBFAEYARwBIAEkASgBLAEwAagBrAGwAbQBuAG8AcABxAHMAdAB/AIIAgwCEAJIABQADAAEAAQAFAAEABABYAAEAmwC6AQUABwAOAA8AGAAwALgBKgAGAB0AJwAtADEAMgA1ADYANwA5ADoAOwA8AD4APwBAAEEAQgBDAEUARgBHAEgASQBKAEsATABqAGsAbABtAG4AbwBwAHEAcwB0AH8AggCDAIQAkgAFAAMAAQABAAUAAQAEAFkAAQCbABgCBQAHAA4ADwAYADAAFgIqAAYAHQAnAC0AMQAyADUANgA3ADkAOgA7ADwAPgA/AEAAQQBCAEMARQBGAEcASABJAEoASwBMAGoAawBsAG0AbgBvAHAAcQBzAHQAfwCCAIMAhACSAAUAAwABAAEA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kgABAJsAzQABAAIB3QABANgALgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAA0AAwABAAEABQABAAQAKAIBAB0A3gIBAAYA5AIBAC8A6AIBABEAkwABAJsAzQABAAIB3QABANgALgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAAwAAwABAAEABQABAAQAKAIBAB0A3gIBAAYA5AIBAC8AlAABAJsAzQABAAIB3QABANgALgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAAwAAwABAAEABQABAAQAKAIBAB0A3gIBAAYA5AIBAC8AlQABAJsAtAABAAIB3QABANgALgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAAwAAwABAAEABQABAAQAKAIBAB0A3gIBAAYA5AIBAC8AlgABAJsA3QABANgA+QABAAIBLgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAAwAAwABAAEABQABAAQAKAIBAB0A3gIBAAYA5AIBAC8AlwABAJsAnwABAAIB3QABANgALgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAAwAAwABAAEABQABAAQAKAIBAB0A3gIBAAYA5AIBAC8AmAABAJsAoQABAAIB3QABANgALgICAEgASQDYAAIAAAEEAdkAAgABAQgB4AIDAAcACAAOAAwAAwABAAEABQABAAQAKAIBAB0A7AIBAFQA7gIBAFUAmQABAJsAJQIBAPgAJwIBAB0BkAIBANgAlgIBAOIA6gICAEgASQDwAgQAZgBnAGgAaQAKAAMAAQABAAUAAQAEAJ4CAQCHANwCAQByAPICAQAQAPQCAQARAJoAAQCbAMsAAQAUAdgBAQA5AZwCBwCFAIYAiACJAIoAiwCMAAcAAwABAAEABQABAAQAcgIBAIcA9gIBAFYAmwABAJsAkAICABAAEQBwAggAcgCFAIYAiACJAIoAiwCMAAcAAwABAAEABQABAAQAegIBAIcA+AIBAFYAnAABAJsApAICABAAEQB4AggAcgCFAIYAiACJAIoAiwCMAAkAAwABAAEABQABAAQA+gIBAIAAnQABAJsABwEBAO4AmQEBAO0AgAICAF0AXwCMAgIAYwBkAIICBABeAGAAYQBiAAcAAwABAAEABQABAAQA1AABAK4A/AICAAcAGAD+AgIAGQAeAJ4AAgCbADABAQMFAB0AHwAgACEAIgAHAAMAAQABAAUAAQAEAAYDAQB8AJcAAQD+AJgAAQD/AJ8AAQCbAAQDCAAQABEAEgAwAEQAewB9AH4ABQADAAEAAQAFAAEABACgAAEAmwAIAwUAAAAHAA4AEgAwAAoDBgAGABMAFAAVABoAJgAIAAMAAQABAAUAAQAEAA4DAQB8AJcAAQD+AJgAAQD/AKEAAQCbAAwDAgB7AH0ABAMGABAAEQASADAARAB+AAUAAwABAAEABQABAAQAogABAJsAEAMFAAAABwAOABIAMAASAwYABgATABQAFQAaACYACQADAAEAAQAFAAEABAD6AgEAgACjAAEAmwApAQEA7gCZAQEA7QCAAgIAXQBfAIwCAgBjAGQAggIEAF4AYABhAGIACQADAAEAAQAFAAEABAAWAwEADwAYAwEAEQAaAwEAFwCkAAEAmwASAgEAvwDzAQIAvAC9ABQDBQAHACkAKgArACwACQADAAEAAQAFAAEABAAcAwEABwClAAEAmwCnAAEAMAHUAAEArgDWAAEAMgEeAwIAGQAeACADBQAdAB8AIAAhACIABgADAAEAAQAFAAEABAAmAwEAfACmAAEAmwAkAwIAYwBkACIDCAAQABEAEgAwAEQAewB9AH4ACQADAAEAAQAFAAEABAAcAwEABwCeAAEAMAGnAAEAmwC7AAEAMgHUAAEArgAeAwIAGQAeACADBQAdAB8AIAAhACIABQADAAEAAQAFAAEABACoAAEAmwAoAwUAAAAHAA4AEgAwACoDBgAGABMAFAAVABoAJgAFAAMAAQABAAUAAQAEAKkAAQCbACwDBQAAAAcADgASADAALgMGAAYAEwAUABUAGgAmAAkAAwABAAEABQABAAQAFgMBAA8AGgMBABcAMAMBABEAqgABAJsA+QEBAL8A8wECALwAvQAUAwUABwApACoAKwAsAAgAAwABAAEABQABAAQAMgMBABgAngABADABqwABAJsA1AABAK4AHgMCABkAHgAgAwUAHQAfACAAIQAiAAQAAwABAAEABQABAAQArAABAJsAigIKAAgADgAdAEgASQBmAGcAaABpAGoACAADAAEAAQAFAAEABAA0AwEAGACtAAEAmwCxAAEAMAHUAAEArgAeAwIAGQAeACADBQAdAB8AIAAhACIACAADAAEAAQAFAAEABACuAAEAmwBqAQEA7gCZAQEA7QCAAgIAXQBfAIwCAgBjAGQAggIEAF4AYABhAGIACAADAAEAAQAFAAEABAAWAwEADwAaAwEAFwCvAAEAmwCOAgEAvwDzAQIAvAC9ABQDBQAHACkAKgArACwACAADAAEAAQAFAAEABAA2AwEAGACrAAEAMAGwAAEAmwDUAAEArgAeAwIAGQAeACADBQAdAB8AIAAhACIACAADAAEAAQAFAAEABAA4AwEAGACeAAEAMAGxAAEAmwDUAAEArgAeAwIAGQAeACADBQAdAB8AIAAhACIACAADAAEAAQAFAAEABAAWAwEADwAaAwEAFwCyAAEAmwAoAgEAvwDzAQIAvAC9ABQDBQAHACkAKgArACwACAADAAEAAQAFAAEABAA+AwEACABAAwEADACzAAEAmwA8AwIABwAOADoDAwAFAAYADQAIAwMAnQCeAJ8ACwADAAEAAQAFAAEABAAOAwEAfABCAwEAEABEAwEAEQCXAAEA/gCYAAEA/wC0AAEAmwC6AQEAQAEMAwIAewB9AEYDAgBEAH4ABAADAAEAAQAFAAEABAC1AAEAmwBIAwkAEAARABIAMABbAFwAYwBkAIAABAADAAEAAQAFAAEABAC2AAEAmwBKAwkAEAARABIAMABbAFwAYwBkAIAABQADAAEAAQAFAAEABAC3AAEAmwBMAwMAAAAHAA4ATgMGAAYAEwAUABUAGgAmAAUAAwABAAEABQABAAQAuAABAJsAUAMDAAAABwAOAFIDBgAGABMAFAAVABoAJgAFAAMAAQABAAUAAQAEALkAAQCbAFQDAwAAAAcADgBWAwYABgATABQAFQAaACYABAADAAEAAQAFAAEABAC6AAEAmwBYAwkABwAYABkAHQAeAB8AIAAhACIACgADAAEAAQAFAAEABAAcAwEABwBcAwEAGABeAwEAIwC7AAEAmwAMAQEAMgEPAQEAMwFUAQEAswBaAwMABgAdAB8ABAADAAEAAQAFAAEABAC8AAEAmwBgAwkAEAARABIAMABbAFwAYwBkAIAABQADAAEAAQAFAAEABAC9AAEAmwBiAwMAAAAHAA4AZAMGAAYAEwAUABUAGgAmAAUAAwABAAEABQABAAQAaAMBAHwAvgABAJsAZgMIABAAEQASADAARAB7AH0AfgAGAAMAAQABAAUAAQAEAG0AAQDuAL8AAQCbAGwDAgBjAGQAagMGABAAEQASADAAWwBcAAcAAwABAAEABQABAAQAbgMBAFsAbQABAO4AwAABAJsAbAMCAGMAZABqAwUAEAARABIAMABcAAUAAwABAAEABQABAAQAbQABAO4AwQABAJsAagMIABAAEQASADAAWwBcAGMAZAAEAAMAAQABAAUAAQAEAMIAAQCbAHADCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMMAAQCbAHIDCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMQAAQCbAHQDCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMUAAQCbAHYDCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMYAAQCbAHgDCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMcAAQCbACQDCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMgAAQCbAHoDCQAQABEAEgAwAFsAXABjAGQAgAAEAAMAAQABAAUAAQAEAMkAAQCbAHwDCQAQABEAEgAwAFsAXABjAGQAgAAFAAMAAQABAAUAAQAEAIADAQAJAMoAAQCbAH4DCAAIAA4ADwAQABEAEgAwAFkABAADAAEAAQAFAAEABADLAAEAmwCCAwkAEAARAFoAlACVAJYAlwCYAJkABQADAAEAAQAFAAEABADMAAEAmwC6AQMAAAAHAA4AuAEGAAYAEwAUABUAGgAmAAkAAwABAAEABQABAAQADgMBAHwAlwABAP4AmAABAP8AzQABAJsADAMCAHsAfQBGAwIARAB+AIQDAgAQABEABAADAAEAAQAFAAEABADOAAEAmwB+AgkAEAARABIAMABbAFwAYwBkAIAACQADAAEAAQAFAAEABAAOAwEAfACXAAEA/gCYAAEA/wDPAAEAmwAMAwIAewB9AEYDAgBEAH4AhgMCABIAMAAEAAMAAQABAAUAAQAEANAAAQCbAIgDCQAQABEAEgAwAFsAXABjAGQAgAAKAAMAAQABAAUAAQAEAIoDAQAPAIwDAQAdAJADAQBUAJIDAQBVANEAAQCbAKsBAQDlAI4DAgBIAEkA0wICAOYA5wAFAAMAAQABAAUAAQAEANIAAQCbAJQDAwAAAAcADgCWAwYABgATABQAFQAaACYABQADAAEAAQAFAAEABADTAAEAmwCYAwMAAAAHAA4AmgMGAAYAEwAUABUAGgAmAAQAAwABAAEABQABAAQA1AABAJsAnAMJAAcAGAAZAB0AHgAfACAAIQAiAAQAAwABAAEABQABAAQA1QABAJsAngMJABAAEQASADAAWwBcAGMAZACAAAoAAwABAAEABQABAAQAHAMBAAcAXgMBACMAogMBABgA1gABAJsAAQEBADMBDAEBADIBVAEBALMAoAMDAAYAHQAfAAQAAwABAAEABQABAAQA1wABAJsApAMJABAAEQASADAAWwBcAGMAZACAAAUAAwABAAEABQABAAQAqAMBAHwA2AABAJsApgMIABAAEQASADAARAB7AH0AfgAFAAMAAQABAAUAAQAEAIYCAQB8ANkAAQCbAHwCCAAQABEAEgAwAEQAewB9AH4ACQADAAEAAQAFAAEABAAOAwEAfACXAAEA/gCYAAEA/wDaAAEAmwAMAwIAewB9AEYDAgBEAH4AqgMCABIAMAAHAAMAAQABAAUAAQAEAKwDAQAoAK4DAQBaAJEAAQAfAdsAAQCbALADBgCUAJUAlgCXAJgAmQAFAAMAAQABAAUAAQAEANwAAQCbALIBAwAAAAcADgCwAQYABgATABQAFQAaACYABgADAAEAAQAFAAEABACeAgEAhwDdAAEAmwDfAAEAFAGcAgcAhQCGAIgAiQCKAIsAjAAJAAMAAQABAAUAAQAEAA4DAQB8AJcAAQD+AJgAAQD/AN4AAQCbAAwDAgB7AH0ARgMCAEQAfgCyAwIAEgAwAAUAAwABAAEABQABAAQAJgMBAHwA3wABAJsAIgMIABAAEQASADAARAB7AH0AfgAGAAMAAQABAAUAAQAEAJ4CAQCHAMsAAQAUAeAAAQCbAJwCBwCFAIYAiACJAIoAiwCMAAoAAwABAAEABQABAAQAKAIBAB0AtAMBAAYAuAMBABEA4AABANgA4QABAJsAgwIBAAYBLgICAEgASQC2AwIABwAOAAUAAwABAAEABQABAAQA4gABAJsAugMDAAAABwAOALwDBgAGABMAFAAVABoAJgAFAAMAAQABAAUAAQAEAOMAAQCbAL4DAwAAAAcADgDAAwYABgATABQAFQAaACYABQADAAEAAQAFAAEABADkAAEAmwDCAwMAAAAHAA4AxAMGAAYAEwAUABUAGgAmAAcAAwABAAEABQABAAQArgMBAFoAxgMBACgAkQABAB8B5QABAJsAsAMGAJQAlQCWAJcAmACZAAoAAwABAAEABQABAAQAKAIBAB0AtAMBAAYAyAMBABEA4AABANgA5gABAJsAgwIBAAYBLgICAEgASQC2AwIABwAOAAUAAwABAAEABQABAAQA5wABAJsAygMDAAAABwAOAMwDBgAGABMAFAAVABoAJgAFAAMAAQABAAUAAQAEAOgAAQCbAM4DAwAAAAcADgDQAwYABgATABQAFQAaACYABQADAAEAAQAFAAEABADpAAEAmwDSAwMAAAAHAA4A1AMGAAYAEwAUABUAGgAmAAUAAwABAAEABQABAAQA6gABAJsA1gMEAAYAHQBIAEkA2AMFAAcACAAOAA8ALwAEAAMAAQABAAUAAQAEAOsAAQCbANoDCQAQABEAEgAwAFsAXABjAGQAgAAGAAMAAQABAAUAAQAEAJ4CAQCHAMcAAQAUAewAAQCbAJwCBwCFAIYAiACJAIoAiwCMAAQAAwABAAEABQABAAQA7QABAJsA3AMJABAAEQASADAAWwBcAGMAZACAAAoAAwABAAEABQABAAQAigMBAA8AjAMBAB0AkAMBAFQAkgMBAFUA7gABAJsAqwEBAOUAjgMCAEgASQBaAgIA5gDnAAoAAwABAAEABQABAAQAjAMBAB0AkAMBAFQAkgMBAFUA3gMBABEA7wABAJsAqwEBAOUAswEBAOYAjgMCAEgASQAKAAMAAQABAAUAAQAEAIwDAQAdAJADAQBUAJIDAQBVAOADAQARAPAAAQCbAKsBAQDlADACAQDmAI4DAgBIAEkACQADAAEAAQAFAAEABADiAwEABwDxAAEAmwAgAQEANAExAQEANQF2AQEAtwDkAwIAGAAwAOYDAgAkACUACQADAAEAAQAFAAEABADiAwEABwDyAAEAmwAeAQEANQEgAQEANAF2AQEAtwDmAwIAJAAlAOgDAgAYADAABAADAAEAAQAFAAEABADzAAEAmwDqAwgABwAZAB0AHgAfACAAIQAiAAkAAwABAAEABQABAAQAKAIBAB0AtAMBAAYA4AABANgA9AABAJsA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AQABAAUAAQAEALUBAQCbAP4FAwAHABgAGQAEAAMAAQABAAUAAQAEALYBAQCbAAAGAwAGAAcADgAEAAMAAQABAAUAAQAEALcBAQCbAAIGAwAQABEAWgAGAAMAAQABAAUAAQAEAAQGAQBPAAYGAQBaANEAAQDoALgBAQCbAAYAAwABAAEABQABAAQAVAIBABEACAYBABAAuQEBAJsA2gEBAD4BBgADAAEAAQAFAAEABADoAgEAEQAKBgEAEAC6AQEAmwDdAQEAQAEEAAMAAQABAAUAAQAEALsBAQCbAAwGAwAGAAcADgAEAAMAAQABAAUAAQAEALwBAQCbAA4GAwASADAAWgAEAAMAAQABAAUAAQAEAL0BAQCbAG4FAwAGAAcADgAEAAMAAQABAAUAAQAEAL4BAQCbABAGAwAIAA4ADwAEAAMAAQABAAUAAQAEAL8BAQCbABIGAwAGAAcADgAEAAMAAQABAAUAAQAEAMABAQCbABQGAwAQABEAGAAGAAMAAQABAAUAAQAEABYGAQAQABgGAQAYAMEBAQCbAN8BAQA4AQUAAwABAAEABQABAAQAGgYBABAAHQYBABEAwgECAJsANwEFAFgFAQABAF4FAQAEAB8GAQACACEGAQADAMMBAgCbACYBBQADAAEAAQAFAAEABAAmBgEAEQDEAQEAmwAkBgIACAAOAAYAAwABAAEABQABAAQAJgYBABEAKAYBABAAxQEBAJsA4QEBACkBBQADAAEAAQAFAAEABAAqBgEAEAAtBgEAEQDGAQIAmwAoAQUAAwABAAEABQABAAQAMQYBABEAxwEBAJsALwYCAAYADgAGAAMAAQABAAUAAQAEADEGAQARADMGAQAQAMgBAQCbAOUBAQAnAQQAAwABAAEABQABAAQAyQEBAJsANQYDAAYABwAOAAUAAwABAAEABQABAAQANwYBABAAOgYBABEAygECAJsAKgEEAAMAAQABAAUAAQAEAMsBAQCbADwGAwAGAAcADgAFAAMAAQABAAUAAQAEAEAGAQARAMwBAQCbAD4GAgANAA4ABAADAAEAAQAFAAEABADNAQEAmwBCBgMABgAHAA4ABQADAAEAAQAFAAEABADOAQEAmwCRAgEA7gBEBgIAYwBkAAQAAwABAAEABQABAAQAzwEBAJsARgYDABIAMABaAAQAAwABAAEABQABAAQA0AEBAJsASAYDABIAMABQAAYAAwABAAEABQABAAQABAQBABEASgYBABAA0QEBAJsA7gEBADwBBQADAAEAAQAFAAEABABSAQEA7gDSAQEAmwBEBgIAYwBkAAUAAwABAAEABQABAAQAawEBAO4A0wEBAJsARAYCAGMAZAAFAAMAAQABAAUAAQAEAE4GAQBZANQBAQCbAEwGAgASADAABQADAAEAAQAFAAEABADVAQEAmwDkAQEA7gBQBgIAYwBkAAYAAwABAAEABQABAAQAcAUBABEAUgYBABAA1gEBAJsA6QEBAD0BBAADAAEAAQAFAAEABADXAQEAmwBUBgMABgAHAA4ABgADAAEAAQAFAAEABAAoBQEAEQBWBgEAEADYAQEAmwDxAQEAOQEEAAMAAQABAAUAAQAEANkBAQCbAFgGAwASADAAWgAFAAMAAQABAAUAAQAEAE4EAQARAFoGAQAQANoBAgCbAD4BBgADAAEAAQAFAAEABACYBAEAEQBdBgEAEADbAQEAmwD+AQEAOgEGAAMAAQABAAUAAQAEAF8GAQAQAGEGAQARANYBAQA9AdwBAQCbAAUAAwABAAEABQABAAQAhAMBABEAYwYBABAA3QECAJsAQAEEAAMAAQABAAUAAQAEAN4BAQCbAGYGAwAQABEAGAAFAAMAAQABAAUAAQAEAGgGAQAQAGsGAQAYAN8BAgCbADgBBQADAAEAAQAFAAEABABtBgEAEQDgAQEAmwAkBgIACAAOAAUAAwABAAEABQABAAQAbwYBABAAcgYBABEA4QECAJsAKQEGAAMAAQABAAUAAQAEAJwEAQARAHQGAQAQAOIBAQCbAA0CAQA7AQQAAwABAAEABQABAAQA4wEBAJsATgUDAAYABwAOAAQAAwABAAEABQABAAQA5AEBAJsAugUDAAYABwAOAAUAAwABAAEABQABAAQAdgYBABAAeQYBABEA5QECAJsAJwEGAAMAAQABAAUAAQAEANcEAQAIAFIFAQAOAOYBAQCbAEACAQCdAAYAAwABAAEABQABAAQAewYBAEQAfQYBAFoAfwYBAJMA5wEBAJsABgADAAEAAQAFAAEABACBBgEAEACDBgEAEQDoAQEAmwD2AQEALQEFAAMAAQABAAUAAQAEAIUGAQAQAIgGAQARAOkBAgCbAD0BBgADAAEAAQAFAAEABACKBgEAEACMBgEAEQDqAQEAmwD3AQEAKwEGAAMAAQABAAUAAQAEAMoCAQARAI4GAQAQAOsBAQCbAA8CAQA/AQYAAwABAAEABQABAAQAkAYBABAAkgYBABEA7AEBAJsA+wEBACwBBAADAAEAAQAFAAEABADtAQEAmwCUBgMAEgAwAFAABQADAAEAAQAFAAEABACWBgEAEACZBgEAEQDuAQIAmwA8AQQAAwABAAEABQABAAQA7wEBAJsAmwYDAAYABwAOAAYAAwABAAEABQABAAQAyAMBABEAnQYBABAA8AEBAJsAEwIBAEEBBQADAAEAAQAFAAEABACfBgEAEACiBgEAEQDxAQIAmwA5AQQAAwABAAEABQABAAQA8gEBAJsApAYDAAYABwAOAAQAAwABAAEABQABAAQA8wEBAJsApgYDABAAEQAYAAYAAwABAAEABQABAAQAqAYBABAAqgYBABEA2wEBADoB9AEBAJsABQADAAEAAQAFAAEABACuBgEAEQD1AQEAmwCsBgIADQAOAAYAAwABAAEABQABAAQArgYBABEAsAYBABAA9gEBAJsAAAIBAC0BBgADAAEAAQAFAAEABACaBQEAEQCyBgEAEAD3AQEAmwACAgEAKwEGAAMAAQABAAUAAQAEALQGAQAHALYGAQAYAPgBAQCbABgCAQC+AAYAAwABAAEABQABAAQAuAYBABAAugYBABEA+QEBAJsAGgIBADcBBgADAAEAAQAFAAEABAC8BgEAEAC+BgEAEQDiAQEAOwH6AQEAmwAGAAMAAQABAAUAAQAEADQFAQARAMAGAQAQAPsBAQCbAAMCAQAsAQQAAwABAAEABQABAAQA/AEBAJsAwgYDABIAMABQAAQAAwABAAEABQABAAQA/QEBAJsAxAYDAAYABwAOAAUAAwABAAEABQABAAQAxgYBABAAyQYBABEA/gECAJsAOgEFAAMAAQABAAUAAQAEAMsGAQARAP8BAQCbAKwGAgANAA4ABQADAAEAAQAFAAEABADNBgEAEADQBgEAEQAAAgIAmwAtAQQAAwABAAEABQABAAQAAQIBAJsA0gYDAAYABwAOAAUAAwABAAEABQABAAQA1AYBABAA1wYBABEAAgICAJsAKwEFAAMAAQABAAUAAQAEANkGAQAQANwGAQARAAMCAgCbACwBBgADAAEAAQAFAAEABAAEBQEACACYBQEADgAEAgEAmwBSAgEAngAGAAMAAQABAAUAAQAEAN4GAQAQAOAGAQARAOsBAQA/AQUCAQCbAAUAAwABAAEABQABAAQA5AYBABEABgIBAJsA4gYCAAgADgAGAAMAAQABAAUAAQAEAOYGAQAQAOgGAQARAKcBAQAoAQcCAQCbAAYAAwABAAEABQABAAQA6gYBABAA7AYBABEA8AEBAEEBCAIBAJsABQADAAEAAQAFAAEABADwBgEAEQAJAgEAmwDuBgIABgAOAAYAAwABAAEABQABAAQA8gYBABAA9AYBABEAqQEBACoBCgIBAJsABgBYBQEAAQBcBQEAAwBeBQEABAD2BgEAAgDDAQEAJgELAgEAmwAEAAMAAQABAAUAAQAEAAwCAQCbAIoCAwAGAAcADgAFAAMAAQABAAUAAQAEAPgGAQAQAPsGAQARAA0CAgCbADsBBQADAAEAAQAFAAEABAD/BgEARAAOAgEAmwD9BgIAEgAwAAUAAwABAAEABQABAAQAAQcBABAABAcBABEADwICAJsAPwEEAAMAAQABAAUAAQAEABACAQCbAAYHAwAGAAcADgAEAAMAAQABAAUAAQAEABECAQCbAAgHAwAGAAcADgAGAAMAAQABAAUAAQAEALgGAQAQAAoHAQARABICAQCbABQCAQA3AQUAAwABAAEABQABAAQADAcBABAADwcBABEAEwICAJsAQQEGAAMAAQABAAUAAQAEALgGAQAQABEHAQARAMIBAQA3ARQCAQCbAAQAAwABAAEABQABAAQAFQIBAJsAEwcDAAUADgB6AAQAAwABAAEABQABAAQAFgIBAJsAFQcDABAAEQAYAAYAAwABAAEABQABAAQA7AIBAFQA7gIBAFUA0AABAOIAFwIBAJsABgADAAEAAQAFAAEABAAWBgEAEAAXBwEAGADBAQEAOAEYAgEAmwAEAAMAAQABAAUAAQAEABkCAQCbABkHAwAGAAcADgAGAAMAAQABAAUAAQAEALgGAQAQABsHAQARAMIBAQA3ARoCAQCbAAQAAwABAAEABQABAAQAGwIBAJsAHQcDAAYABwAOAAUAAwABAAEABQABAAQAHwcBABEAHAIBAJsALwYCAAYADgAEAAMAAQABAAUAAQAEAB0CAQCbACEHAgASADAABAADAAEAAQAFAAEABAAeAgEAmwAjBwIAEgAwAAQAAwABAAEABQABAAQAHwIBAJsAJQcCAE8AWgAFAAMAAQABAAUAAQAEACcHAQAVACkHAQAaACACAQCbAAQAAwABAAEABQABAAQAIQIBAJsAeQYCABAAEQAEAAMAAQABAAUAAQAEACICAQCbACsHAgASADAABAADAAEAAQAFAAEABAAjAgEAmwCqAwIAEgAwAAUAAwABAAEABQABAAQAtAYBAAcAJAIBAJsAjwIBAL4ABAADAAEAAQAFAAEABAAlAgEAmwAtBwIAEgAwAAQAAwABAAEABQABAAQAJgIBAJsALwcCABIAMAAEAAMAAQABAAUAAQAEACcCAQCbADEHAgASADAABAADAAEAAQAFAAEABAAoAgEAmwAdBgIAEAARAAQAAwABAAEABQABAAQAKQIBAJsAMwcCABIAMAAEAAMAAQABAAUAAQAEACoCAQCbADUHAgASADAABAADAAEAAQAFAAEABAArAgEAmwA3BwIABgAHAAQAAwABAAEABQABAAQALAIBAJsAxgUCABAAEQAEAAMAAQABAAUAAQAEAC0CAQCbADkHAgASADAABAADAAEAAQAFAAEABAAuAgEAmwA7BwIAEgAwAAUAAwABAAEABQABAAQAPQcBABcA4wABALkALwIBAJsABAADAAEAAQAFAAEABAAwAgEAmwCZBgIAEAARAAQAAwABAAEABQABAAQAMQIBAJsAPwcCABIAMAAEAAMAAQABAAUAAQAEADICAQCbAEEHAgASADAABAADAAEAAQAFAAEABAAzAgEAmwCiBgIAEAARAAQAAwABAAEABQABAAQANAIBAJsALQYCABAAEQAFAAMAAQABAAUAAQAEAEMHAQBDAEUHAQBFADUCAQCbAAQAAwABAAEABQABAAQANgIBAJsARwcCABIAMAAEAAMAAQABAAUAAQAEADcCAQCbAEkHAgASADAABAADAAEAAQAFAAEABAA4AgEAmwBLBwIAEgAwAAQAAwABAAEABQABAAQAOQIBAJsATQcCABIAMAAEAAMAAQABAAUAAQAEADoCAQCbAE8HAgASADAABQADAAEAAQAFAAEABABRBwEATgBTBwEAUQA7AgEAmwAEAAMAAQABAAUAAQAEADwCAQCbACQGAgAIAA4ABAADAAEAAQAFAAEABAA9AgEAmwBVBwIAEgAwAAQAAwABAAEABQABAAQAPgIBAJsALwYCAAYADgAEAAMAAQABAAUAAQAEAD8CAQCbAFcHAgASADAABAADAAEAAQAFAAEABABAAgEAmwA6BgIAEAARAAUAAwABAAEABQABAAQAhAUBAH8AKgABAA0BQQIBAJsABAADAAEAAQAFAAEABABCAgEAmwBZBwIAEgAwAAQAAwABAAEABQABAAQAQwIBAJsAWwcCABIAMAAEAAMAAQABAAUAAQAEAEQCAQCbAMkGAgAQABEABAADAAEAAQAFAAEABABFAgEAmwCGAwIAEgAwAAQAAwABAAEABQABAAQARgIBAJsALAQCABIAMAAEAAMAAQABAAUAAQAEAEcCAQCbAF0HAgASADAABAADAAEAAQAFAAEABABIAgEAmwBfBwIAEgAwAAQAAwABAAEABQABAAQASQIBAJsAYQcCABIAMAAEAAMAAQABAAUAAQAEAEoCAQCbAGMHAgASADAABAADAAEAAQAFAAEABABLAgEAmwAABgIACAAOAAQAAwABAAEABQABAAQATAIBAJsAZQcCAAYADgAFAAMAAQABAAUAAQAEABYDAQAPAFIAAQC8AE0CAQCbAAQAAwABAAEABQABAAQATgIBAJsAZwcCAE8AWgAEAAMAAQABAAUAAQAEAE8CAQCbANAGAgAQABEABAADAAEAAQAFAAEABABQAgEAmwCyAwIAEgAwAAUAAwABAAEABQABAAQAdAUBABcA5wABALUAUQIBAJsABAADAAEAAQAFAAEABABSAgEAmwDXBgIAEAARAAQAAwABAAEABQABAAQAUwIBAJsAaQcCAAgADgAEAAMAAQABAAUAAQAEAFQCAQCbAGsHAgASADAABQADAAEAAQAFAAEABABtBwEAFwBXAAEAEAFVAgEAmwAEAAMAAQABAAUAAQAEAFYCAQCbANwGAgAQABEABAADAAEAAQAFAAEABABXAgEAmwBvBwIAEgAwAAQAAwABAAEABQABAAQAWAIBAJsAcQcCAAgADgAEAAMAAQABAAUAAQAEAFkCAQCbAKwGAgANAA4ABAADAAEAAQAFAAEABABaAgEAmwBzBwIAEgAwAAQAAwABAAEABQABAAQAWwIBAJsAdQcCABIAMAAEAAMAAQABAAUAAQAEAFwCAQCbAHcHAgASADAABAADAAEAAQAFAAEABABdAgEAmwB5BwIAEgAwAAQAAwABAAEABQABAAQAXgIBAJsAewcCABIAMAAEAAMAAQABAAUAAQAEAF8CAQCbAOgFAgAGAA4ABAADAAEAAQAFAAEABABgAgEAmwB9BwIAEgAwAAQAAwABAAEABQABAAQAYQIBAJsAfwcCABIAMAAFAAMAAQABAAUAAQAEAIEHAQAXACsAAQC5AGICAQCbAAQAAwABAAEABQABAAQAYwIBAJsAgwcCABIAMAAEAAMAAQABAAUAAQAEAGQCAQCbAIUHAgASADAABAADAAEAAQAFAAEABABlAgEAmwCHBwIAEgAwAAQAAwABAAEABQABAAQAZgIBAJsAiQcCABIAMAAEAAMAAQABAAUAAQAEAGcCAQCbAIsHAgAGAAcABAADAAEAAQAFAAEABABoAgEAmwCNBwIAEgAwAAQAAwABAAEABQABAAQAaQIBAJsAjwcCABIAMAAEAAMAAQABAAUAAQAEAGoCAQCbAJEHAgASADAABAADAAEAAQAFAAEABABrAgEAmwCIBgIAEAARAAQAAwABAAEABQABAAQAbAIBAJsAkwcCABIAMAAEAAMAAQABAAUAAQAEAG0CAQCbAJUHAgAQABEABAADAAEAAQAFAAEABABuAgEAmwCXBwIAEgAwAAUAAwABAAEABQABAAQAqgUBABcA6AABALAAbwIBAJsABAADAAEAAQAFAAEABABwAgEAmwCZBwIAEgAwAAQAAwABAAEABQABAAQAcQIBAJsABAcCABAAEQAEAAMAAQABAAUAAQAEAHICAQCbAJsHAgASADAABAADAAEAAQAFAAEABABzAgEAmwCdBwIAEgAwAAQAAwABAAEABQABAAQAdAIBAJsAnwcCABIAMAAEAAMAAQABAAUAAQAEAHUCAQCbAKEHAgASADAABAADAAEAAQAFAAEABAB2AgEAmwCjBwIAEgAwAAQAAwABAAEABQABAAQAdwIBAJsApQcCABIAMAAEAAMAAQABAAUAAQAEAHgCAQCbAKcHAgASADAABAADAAEAAQAFAAEABAB5AgEAmwBmBAIAEAARAAUAAwABAAEABQABAAQAqQcBABUAqwcBABoAegIBAJsABAADAAEAAQAFAAEABAB7AgEAmwCtBwIABwAOAAUAAwABAAEABQABAAQAPQcBABcA6QABALkAfAIBAJsABAADAAEAAQAFAAEABAB9AgEAmwCvBwIAEgAwAAUAAwABAAEABQABAAQAmAIBAHIAmgIBAHYAfgIBAJsABAADAAEAAQAFAAEABAB/AgEAmwCxBwIABgAHAAUAAwABAAEABQABAAQAswcBAA8ALgABALwAgAIBAJsABAADAAEAAQAFAAEABACBAgEAmwC1BwIAEgAwAAQAAwABAAEABQABAAQAggIBAJsAtwcCABIAMAAEAAMAAQABAAUAAQAEAIMCAQCbAA8HAgAQABEABQADAAEAAQAFAAEABAC5BwEAFQC7BwEAGgCEAgEAmwAEAAMAAQABAAUAAQAEAIUCAQCbAL0HAgASADAABABYBQEAAQBeBQEABACGAgEAmwC/BwIAAgADAAUAAwABAAEABQABAAQAbQcBABcAUQABABABhwIBAJsABQADAAEAAQAFAAEABABtBwEAFwCIAgEAmwC/AgEAEAEFAAMAAQABAAUAAQAEAMEHAQAXACMAAQC5AIkCAQCbAAUAAwABAAEABQABAAQAwwcBABcAPQABABABigIBAJsABQADAAEAAQAFAAEABABKBQEAfwAiAAEADQGLAgEAmwAFAAMAAQABAAUAAQAEAMMHAQAXAEMAAQAQAYwCAQCbAAQAAwABAAEABQABAAQAjQIBAJsAxQcCABIAMAAEAAMAAQABAAUAAQAEAI4CAQCbAMcHAgAQABgABAADAAEAAQAFAAEABACPAgEAmwBrBgIAEAAYAAQAAwABAAEABQABAAQAkAIBAJsAyQcCABIAMAAEAAMAAQABAAUAAQAEAJECAQCbALoFAgAIAA4ABAADAAEAAQAFAAEABACSAgEAmwA8BgIAdwB4AAQAAwABAAEABQABAAQAkwIBAJsAcgYCABAAEQAEAAMAAQABAAUAAQAEAJQCAQCbAMsHAgBPAFoABAADAAEAAQAFAAEABACVAgEAmwDNBwIACAAOAAQAAwABAAEABQABAAQAlgIBAJsAzwcCABIAMAAFAAMAAQABAAUAAQAEANEHAQA4ANMHAQA7AJcCAQCbAAUAAwABAAEABQABAAQAbQcBABcAmAIBAJsABgMBABABBAADAAEAAQAFAAEABACZAgEAmwD7BgIAEAARAAQAAwABAAEABQABAAQA1QcBADAAmgIBAJsABAADAAEAAQAFAAEABADXBwEATwCbAgEAmwAEAAMAAQABAAUAAQAEANkHAQBaAJwCAQCbAAQAAwABAAEABQABAAQA9gIBAFYAnQIBAJsABAADAAEAAQAFAAEABADbBwEAUACeAgEAmwAEAAMAAQABAAUAAQAEAN0HAQBQAJ8CAQCbAAQAAwABAAEABQABAAQA3wcBAC4AoAIBAJsABAADAAEAAQAFAAEABADhBwEAUAChAgEAmwAEAAMAAQABAAUAAQAEAOMHAQAvAKICAQCbAAQAAwABAAEABQABAAQA5QcBAFAAowIBAJsABAADAAEAAQAFAAEABABgAgEALwCkAgEAmwAEAAMAAQABAAUAAQAEAOcHAQBQAKUCAQCbAAQAAwABAAEABQABAAQA6QcBAFAApgIBAJsABAADAAEAAQAFAAEABADrBwEAWgCnAgEAmwAEAAMAAQABAAUAAQAEAO0HAQBaAKgCAQCbAAQAAwABAAEABQABAAQA7wcBABcAqQIBAJsABAADAAEAAQAFAAEABADxBwEAUACqAgEAmwAEAAMAAQABAAUAAQAEAPMHAQBaAKsCAQCbAAQAAwABAAEABQABAAQA9QcBABIArAIBAJsABAADAAEAAQAFAAEABAD3BwEAEgCtAgEAmwAEAAMAAQABAAUAAQAEAPkHAQASAK4CAQCbAAQAAwABAAEABQABAAQA+wcBABYArwIBAJsABAADAAEAAQAFAAEABAD9BwEAEgCwAgEAmwAEAAMAAQABAAUAAQAEAP8HAQAGALECAQCbAAQAAwABAAEABQABAAQA+AIBAFYAsgIBAJsABAADAAEAAQAFAAEABAABCAEAEgCzAgEAmwAEAAMAAQABAAUAAQAEAAMIAQBDALQCAQCbAAQAAwABAAEABQABAAQABQgBAC4AtQIBAJsABAADAAEAAQAFAAEABAAHCAEAMAC2AgEAmwAEAAMAAQABAAUAAQAEAAkIAQASALcCAQCbAAQAAwABAAEABQABAAQACwgBAIAAuAIBAJsABAADAAEAAQAFAAEABAANCAEAWgC5AgEAmwAEAAMAAQABAAUAAQAEANwCAQByALoCAQCbAAQAAwABAAEABQABAAQADwgBAFoAuwIBAJsABAADAAEAAQAFAAEABAARCAEAAgC8AgEAmwAEAAMAAQABAAUAAQAEABMIAQBaAL0CAQCbAAQAAwABAAEABQABAAQAFQgBABYAvgIBAJsABAADAAEAAQAFAAEABAAXCAEAggC/AgEAmwAEAAMAAQABAAUAAQAEABkIAQAXAMACAQCbAAQAAwABAAEABQABAAQAGwgBAFYAwQIBAJsABAADAAEAAQAFAAEABAAdCAEATwDCAgEAmwAEAAMAAQABAAUAAQAEAB8IAQBPAMMCAQCbAAQAAwABAAEABQABAAQAIQgBAFoAxAIBAJsABAADAAEAAQAFAAEABAAjCAEAEgDFAgEAmwAEAAMAAQABAAUAAQAEACUIAQBaAMYCAQCbAAQAAwABAAEABQABAAQAJwgBABgAxwIBAJsABAADAAEAAQAFAAEABAApCAEAWgDIAgEAmwAEAAMAAQABAAUAAQAEACsIAQA4AMkCAQCbAAQAAwABAAEABQABAAQALQgBAIAAygIBAJsABAADAAEAAQAFAAEABAAvCAEALwDLAgEAmwAEAAMAAQABAAUAAQAEADEIAQAvAMwCAQCbAAQAAwABAAEABQABAAQAMwgBAC8AzQIBAJsABAADAAEAAQAFAAEABAA1CAEAFwDOAgEAmwAEAAMAAQABAAUAAQAEADcIAQAHAM8CAQCbAAQAAwABAAEABQABAAQAOQgBAFAA0AIBAJsABAADAAEAAQAFAAEABAA7CAEAWgDRAgEAmwAEAAMAAQABAAUAAQAEAD0IAQASANICAQCbAAQAAwABAAEABQABAAQAPwgBAFAA0wIBAJsABAADAAEAAQAFAAEABAD6AgEAgADUAgEAmwAEAAMAAQABAAUAAQAEAEEIAQAwANUCAQCbAAQAAwABAAEABQABAAQAQwgBAFAA1gIBAJsABAADAAEAAQAFAAEABABFCAEAAADXAgEAmwAEAAMAAQABAAUAAQAEAEcIAQAVANgCAQCbAAQAAwABAAEABQABAAQASQgBADAA2QIBAJsABAADAAEAAQAFAAEABABLCAEAWgDaAgEAmwAEAAMAAQABAAUAAQAEAE0IAQAwANsCAQCbAAQAAwABAAEABQABAAQATwgBADAA3AIBAJsABAADAAEAAQAFAAEABABRCAEAMADdAgEAmwAEAAMAAQABAAUAAQAEAK4DAQBaAN4CAQCbAAQAAwABAAEABQABAAQAUwgBADAA3wIBAJsABAADAAEAAQAFAAEABABVCAEAQwDgAgEAmwAEAAMAAQABAAUAAQAEAFcIAQAwAOECAQCbAAQAAwABAAEABQABAAQAWQgBABIA4gIBAJsABAADAAEAAQAFAAEABABbCAEAMADjAgEAmwAEAAMAAQABAAUAAQAEAF0IAQASAOQCAQCbAAQAAwABAAEABQABAAQAXwgBABIA5QIBAJsABAADAAEAAQAFAAEABABhCAEAEgDmAgEAmwAEAAMAAQABAAUAAQAEAGMIAQAwAOcCAQCbAAQAAwABAAEABQABAAQAZQgBACgA6AIBAJsABAADAAEAAQAFAAEABABnCAEAWgDpAgEAmwAEAAMAAQABAAUAAQAEAGkIAQA4AOoCAQCbAAQAAwABAAEABQABAAQAawgBAC8A6wIBAJsABAADAAEAAQAFAAEABACWAgEAZQDsAgEAmwAEAAMAAQABAAUAAQAEAG0IAQBaAO0CAQCbAAQAAwABAAEABQABAAQAbwgBAC8A7gIBAJsABAADAAEAAQAFAAEABABxCAEAUADvAgEAmwAEAAMAAQABAAUAAQAEAHMIAQAwAPACAQCbAAQAAwABAAEABQABAAQAdQgBADAA8QIBAJsABAADAAEAAQAFAAEABAB3CAEATwDyAgEAmwAEAAMAAQABAAUAAQAEAHkIAQBaAPMCAQCbAAQAAwABAAEABQABAAQAewgBAAYA9AIBAJsABAADAAEAAQAFAAEABAB9CAEAVgD1AgEAmwAEAAMAAQABAAUAAQAEAH8IAQAHAPYCAQCbAAQAAwABAAEABQABAAQAgQgBADAA9wIBAJsABAADAAEAAQAFAAEABACDCAEALgD4AgEAmwAEAAMAAQABAAUAAQAEAIUIAQAvAPkCAQCbAAQAAwABAAEABQABAAQAhwgBAC8A+gIBAJsABAADAAEAAQAFAAEABACJCAEAUAD7AgEAmwAEAAMAAQABAAUAAQAEAIsIAQA8APwCAQCbAAQAAwABAAEABQABAAQAjQgBADwA/QIBAJsABAADAAEAAQAFAAEABACPCAEALwD+AgEAmwAEAAMAAQABAAUAAQAEAGICAQAvAP8CAQCbAAQAAwABAAEABQABAAQAkQgBAC8AAAMBAJsABAADAAEAAQAFAAEABACTCAEALgABAwEAmwAEAAMAAQABAAUAAQAEAJUIAQAuAAIDAQCbAAQAAwABAAEABQABAAQAlwgBABIAAwMBAJsABAADAAEAAQAFAAEABACZCAEALwAEAwEAmwAEAAMAAQABAAUAAQAEAJsIAQCAAAUDAQCbAAQAAwABAAEABQABAAQAnQgBAIIABgMBAJsABAADAAEAAQAFAAEABACfCAEAEgAHAwEAmwAEAAMAAQABAAUAAQAEAMIFAQASAAgDAQCbAAQAAwABAAEABQABAAQAoQgBABIACQMBAJsABAADAAEAAQAFAAEABACjCAEAEgAKAwEAmwAEAAMAAQABAAUAAQAEAKUIAQAXAAsDAQCbAAQAAwABAAEABQABAAQApwgBAC8ADAMBAJsABAADAAEAAQAFAAEABACpCAEALgANAwEAmwABAKsIAQAAAAEArQgBAAAAAAAAAAAARwAAAI4AAADUAAAAGgEAAFwBAACdAQAA3AEAABsCAABaAgAAmQIAANgCAAAXAwAAVgMAAJQDAADSAwAAEAQAAE4EAACMBAAAygQAAAgFAABGBQAAhAUAAMIFAAAABgAAPgYAAHwGAAC6BgAA+AYAADYHAAB0BwAAsgcAAPAHAAAuCAAAbAgAAKoIAADoCAAAJgkAAGQJAACiCQAA4AkAAB4KAABcCgAAmgoAANgKAAAWCwAAUwsAAJALAADNCwAACgwAAEcMAACEDAAAwQwAAP4MAAA7DQAAeA0AALUNAADyDQAALw4AAGwOAACpDgAA5g4AACMPAABgDwAAnQ8AANoPAAAXEAAAVBAAAJEQAADOEAAAOREAAJ8RAAACEgAAYBIAALsSAAAWEwAAcRMAAMwTAAAnFAAAghQAAN0UAAA4FQAAkxUAAO4VAABGFgAAnhYAAPYWAABOFwAAphcAAP4XAABUGAAAqhgAAOkYAAAMGQAALxkAAFIZAACCGQAApBkAANQZAAD/GQAAJBoAAFEaAAB+GgAAqxoAANgaAAAPGwAANBsAAGgbAACaGwAAxhsAAPIbAAAiHAAAUhwAAH8cAACkHAAAyhwAAPAcAAAUHQAAPh0AAG4dAACeHQAAyx0AAPgdAAAiHgAATB4AAHYeAACgHgAAyh4AAPMeAAAYHwAANh8AAFQfAAB1HwAAkh8AAK8fAADIHwAA5x8AAAAgAAAhIAAAQiAAAGMgAAB+IAAAnyAAALggAADRIAAA8iAAABAhAAAmIQAARCEAAGIhAACAIQAAniEAALwhAADaIQAA+CEAABwiAAAxIgAARiIAAF0iAAB0IgAAiyIAAKAiAADBIgAA1iIAAO0iAAAEIwAAHSMAADgjAABPIwAAZCMAAHkjAACOIwAAoyMAALgjAADNIwAA4iMAAPcjAAAOJAAAIyQAADokAABZJAAAbiQAAI0kAACiJAAAwyQAANokAADxJAAABiUAABslAAA8JQAAUSUAAGglAAB/JQAAniUAALklAADQJQAA6SUAAAgmAAAfJgAAOCYAAFkmAABwJgAAhyYAAJ4mAAC5JgAA2iYAAPEmAAAIJwAAHycAADYnAABLJwAAZCcAAHknAACaJwAAuicAANonAAD4JwAAFigAACooAABIKAAAXCgAAHAoAACQKAAApCgAAMIoAADaKAAA8CgAAAYpAAAeKQAAPikAAGApAACCKQAAnSkAALIpAADLKQAA5ikAAAEqAAAcKgAANyoAAFQqAABvKgAAgioAAJUqAACsKgAAvyoAANQqAADvKgAACCsAACcrAABCKwAAVSsAAHIrAACPKwAArCsAAL8rAADUKwAA5ysAAPorAAAPLAAAKCwAADosAABSLAAAbCwAAIAsAACcLAAAtiwAAMgsAADaLAAA8iwAAAQtAAAWLQAALC0AAEYtAABiLQAAei0AAJItAACkLQAAvi0AANAtAADqLQAAAi4AABwuAAAuLgAARi4AAGAuAAByLgAAhi4AAJouAAC0LgAAyy4AAOAuAAD1LgAACi8AAB8vAAA0LwAASS8AAF4vAABzLwAAiC8AAJ0vAAC0LwAAyS8AAN4vAADvLwAABjAAABswAAAwMAAARTAAAFwwAABxMAAAgjAAAJMwAACqMAAAvTAAANYwAADpMAAA/jAAAA8xAAAkMQAAOzEAAFAxAABjMQAAfDEAAI0xAACeMQAAtTEAAMYxAADdMQAA9DEAAAsyAAAkMgAANzIAAFAyAABlMgAAejIAAI8yAACmMgAAvTIAANQyAADpMgAA+jIAABAzAAAgMwAAMjMAAEgzAABYMwAAbjMAAIAzAACWMwAApjMAALgzAADOMwAA4DMAAPQzAAAINAAAHDQAACw0AAA8NAAAUjQAAGg0AAB4NAAAiDQAAJo0AACqNAAAujQAAM40AADeNAAA7jQAAAQ1AAAYNQAAKDUAADg1AABONQAAZDUAAHo1AACONQAAojUAALY1AADKNQAA2jUAAO41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AQBtAAIAbwADAHIAAwB1AAMAeAACAHoAAgB8AAEAfQADAIAAAgCCAAIAhAADAIcAAQCIAAIAigADAI0AAQCOAAEAjwABAJAAAQCRAAIAkwACAJUAAgCXAAMAmgADAJ0AAwCgAAQApAACAKYAAgCoAAMAqwACAK0AAgCvAAQAswACALUAAgC3AAMAugACALwAAwC/AAMAwgACAMQAAwDHAAMAygACAMwABAAAAAAAAAAAAAAAAAAxAAEAMgAAABgAAABBAAAAPwAAAB0AAAABAAAAFwABADUAAgE2AAEADQACAQ8AAQAxAAIAMgABACIAAAAUAAEAPwAAADAAAQASAAEAJAABAD8AAAAYAAEAFQAAAD8AAQAVAAAALgABABMAAQAdAAAAHQAAAB0AAQEiAAAAQAACAAEAAAA9AAEAOQAAADgAAAA5AAABDQAAACMAAAAvAAIAIwAAACoAAQAvAAIAOgACACUAAgAiAAIAAgACADYAAgA1AAIBDwACAA0AAgEKAAIAAwACABQAAQAzAAIAPAACAEIAAAA/AAAAQAABACkAAQAqAAAAFQAAADQAAAA1AAIADAACACcAAAAHAAEAHQABABMAAgAdAAAAHQABAR0AAAEdAAEBLgAAAEAAAQA1AAEAOAAAATgAAQE4AAABOQABATcAAAA5AAABOQABATcAAQE5AAABJgAAABEAAAAOAAAAJgABAQ0AAQENAAABDQABATUAAwE2AAIADQADAQ8AAgAKAAEAMAADAAMAAQAKAAMACAABADsAAgA/AAAAFQAAABwAAgA/AAEAFAAAABsAAAAoAAAAFAAAAD4AAwAUAAAAKgACAEAAAwAUAAAAFgABAEAAAwAUAAAAMAADADMAAQAtAAEAPwAAABsAAQA/AAAAOAAEATcAAgE4AAABOQABATcAAAE3AAEBEQAAAREAAQEOAAAAEQABASYAAgEQAAAAJgAAASYAAQEOAAAAEAACASYAAQEhAAEANgADADUAAwAwAAMABgAEAAoAAgAKAAEAMAAEAAcABAALAAIABQADABQAAAAsAAQAGwABAC0AAgA/AAAADAACABIABAAnAAAADgAAABAAAwERAAEBJgACARAAAAEQAAEBLgAAAEAAAgAGAAMACgABADAABQALAAEAMAAEAAcAAQALAAQADAACABIABAAZAAUAJwAAABEAAgE/AAAAPgABAD8AAAAiAAEAKwAAADAAAwAJAAQAEgAGAAQABAASAAYAGgADAAsAAQAiAAUAPwAEAAsAAQAwAAUACwABAB8ABQA/AAQAEQADAT4AAQA/AAAAIgABADAAAwAHAAgACwAEAB4ABgAgAAIAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAIwBeAF8AYABhAGIAYQBiAGUAZgBnAGgAaQBqAGsAbABtAG4AbwBwAHEAcgBzAHQAdQB2AHcAeAB5AHoAewB8AH0AfgB/AIAAgQCCAIMAhACFAIYAhwCIAIkAigCLAIwAjQCOAI8AkACRAJIAkwCUAJUAlgCXAJgAmQCaAJsAnACdAJ4AnwCgAKEAogCjAKQApQCmAKcAqACpAKoAqwCsAK0ArgCvALAAsQCyALMAtAC1ALYAtwC4ALkAugC7ALwAvQC+AL8AwADBAMIAwwDEAMUAxgDHAMgAyQDKAMsAzADNAM4AzwDQANEA0gDTANQA1QDWANcA2ADZANoA2wDcAN0A3gDfAOAA4QDiAOMA5ADlAOYA5wDoAOkA6gDrAOwA7QDuAO8A8ADxAPIA8wD0APUA9gD3APgA+QD6APsA/AD9AP4A/wAAAQEBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYARkBGgEbARwBHQEeAR8BIAEhASIBIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEwATEBMgEzATQBNQE2ATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEICAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAA8AAAAAAA8AAAAAAA8AAAAAAA8AAAAAAA4AAAAAAA4AAAAAAAwAAAAAAAwAAAAAAA4AAAAAAAwAAAAAAAEAAAAAAAEAAAAAAA4AAAAAAA4AAAAAAA4AAAAAAAEAAAAAAA4AAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAwAAAAAAAwAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAwAAAAAAAwAAAAAAAcAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAAAIAAAAAABIAAAAAAAYAAAAAAAYAAAAAAAYAAAAAAEICAAAAAAIAAAAAAEICAAAAAEICAAAAABAAAAAAAEICAAAAAAYAAAAAAEICAAAAAAYAAAAAAAMAAAAAABAAAAAAAEICAAAAAEICAAAAAEICAAAAAEICAAAAABMAAAAAABMAAAAAABMAAAAAAAoAAAAAAEICAAAAAEICAAAAAAYAAAAAAAYAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAsAAAAAAAYAAAAAAAYAAAAAAAYAAAAAAAYAAAAAAAQAAAAAAAQAAAAAAEICAAAAAEICAAAAAEICAAAAAEICAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAcAAAAAAAQAAAAAAEICAAAAAEICAAAAAAQAAAAAAAQAAAAAAAgAAAAAAAQAAAAAAEICAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAkAAAAAAEICAAAAAAgAAAAAAAgAAAAAAEICAAAAAEICAAAAAEICAAAAAAQAAAAAABYAAAAAAAgAAAAAAEICAAAAAEICAAAAAAcAAAAAAAcAAAAAAAcAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAABgAAAAAAAEAAAAAAEICAAAAAEICAAAAAAgAAAAAAEICAAAAAAgAAAAAAAYAAAAAAEICAAAAAEICAAAAAAQAAAAAAAgAAAAAABYAAAAAAAgAAAAAAEICAAAAAEICAAAAAEICAAAAAAEAAAAAAEICAAAAAAYAAAAAAEICAAAAAEICAAAAAAYAAAAAAAsAAAAAAEICAAAAAEICAAAAAEICAAAAAAEAAAAAAAsAAAAAAEICAAAAAEICAAAAAEICAAAAAAsAAAAAAAgAAAAAAAYAAAAAAAgAAAAAAAYAAAAAAAYAAAAAAAYAAAAAAAYAAAAAAAYAAAAAAAQAAAAAAAsAAAAAAAQAAAAAAAcAAAAAAAcAAAAAAAgAAAAAAEICAAAAAAEAAAAAAAsAAAAAAAsAAAAAAAEAAAAAAAYAAAAAABUAAAAAABUAAAAAABYAAAAAAAAAAAAAAAQAAAAAAAcAAAAAABYAAAAAAAcAAAAAAAQAAAAAAAYAAAAAAAcAAAAAABgAAAAAAAEAAAAAABYAAAAAAAEAAAAAAAAAAAAAABYAAAAAABYAAAAAAAAAAAAAAAcAAAAAABgAAAAAABYAAAAAABYAAAAAABEAAAAAAAEAAAAAAAEAAAAAABgAAAAAABgAAAAAAAAAAAAAAAQAAAAAAAgAAAAAAAYAAAAAAAgAAAAAAAYAAAAAAAQAAAAAAAcAAAAAAA0AAAAAAAgAAAAAAAAAAAAAAAgAAAAAAA0AAAAAAAYAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAgAAAAAAAQAAAAAAAgAAAAAABQAAAAAAAYAAAAAABQAAAAAAAgAAAAAAAQAAAAAAAQAAAAAAAgAAAAAAAYAAAAAABYAAAAAAAQAAAAAAAEAAAAAAA0AAAAAAA0AAAAAAA0AAAAAAA0AAAAAAA0AAAAAAA0AAAAAAA0AAAAAAAAAAAAAAA0AAAAAAA0AAAAAAAEAAAAAAA0AAAAAAA0AAAAAAAAAAAAAAAQAAAAAAA0AAAAAAA0AAAAAAA0AAAAAAAEAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAYAAAAAAAAAAAAAABYAAAAAAA0AAAAAAAAAAAAAAAQAAAAAAAQAAAAAAA0AAAAAAAQAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAgAAAAAABYAAAAAAAgAAAAAAA0AAAAAAA0AAAAAAA0AAAAAAAEAAAAAAAQAAAAAAAQAAAAAAA0AAAAAAAYAAAAAAAAAAAAAAA0AAAAAAA0AAAAAAAEAAAAAAAAAAAAAAB0AAAAAAA0AAAAAAAEAAAAAAAYAAAAAAAAAAAAAAAEAAAAAAA0AAAAAAA0AAAAAAAQAAAAAAAQAAAAAAAEAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAQAAAAAAA0AAAAAAAAAAAAAAAQAAAAAAAEAAAAAAAYAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAQAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAA0AAAAAAA0AAAAAAA0AAAAAAAEAAAAAAA0AAAAAAA0AAAAAABYAAAAAAAEAAAAAABgAAAAAAB4AAAAAAAEAAAAAAA0AAAAAAA0AAAAAAAEAAAAAAAQAAAAAAAQAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAA0AAAAAAA0AAAAAAAAAAAAAAAEAAAAAAAEAAAAAAA0AAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAA0AAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAEAAAAAAA0AAAAAAAEAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0AAAAAAAEAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAA0AAAAAAAAAAAAAAA0AAAAAAAQAAAAAAA0AAAAAAAcAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAcAAAAAAAYAAAAAAAcAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAA0AAAAAAAAAAAAAAAEAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAQAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAB0AAAAAAA0AAAAAAAAAAAAAAEICAAAAAAAAAAAAAA0AAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAA0AAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAEAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAA0AAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAB0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAYAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAP//AAAAAP//AAAAAAAAAQACAAMABAADAAQABwAIAAkACgALAAgACAAIAAkACQAKAAgACwAJAAkAFgAXABYAFwAaABsAGwAaAB4AHgAgACEAIgAjACQAJQAmACcAJAApACIAIwAsAC0ALgAvADAAJQAyADMANAAhADYANwAgADkAOgA7ADwAPQA+AD8AQABBAEIAQwAmACQAJgA+ADIAMwA0ADYANwA5ADoAOwA8AD0ALgA/AEAAQQBCAEMAJgBZACwAJAAvAC0AMABfAGAAYQBiAGMAZABjAGYAZwBkAGkAagBnAGYAbQBuAG8AcABxAHIAcwBzAHUAdgB3AHgAeQB6AHsAfAB9AH4AfwCAAIEAggCDAIQAhQCGAIcAiACJAIoAiwCMAI0AjgCPAJAAkQCSAJMAlACVAJYAlwCYAJkAmgB9AIMAnQCeAJ8AoAChAKIAowCkAKUApgCnAKgAqQCkAKsAegCtAK4ArwCwALEAsgCzALQAtQC2ALcAuAC5ALoAuwC8AL0AvgC/AMAAwQDCAMMAxADFAMYAxwDIAMkAygDLACYAzQDOAM8A0ADRANIA0wDUANUA1gDXANgA2QDaANsAJADdAN4A3wDgAOEA4gDjAOQA2wDmAOcA6ADpAOoA6wDsAO0A7gDvAPAA8QDyAPMA9AD1APYA9wD4APkA+gD7APwA/QD+AP8A/wABAQIBAwEEAQUBBgEHAQgBCQEKAQsBDAENAQ4BDwEQAREBEgETARQBFQEWARcBGAEZARoBGwEcAR0BHgEfASABIQEiASMBJAElASYBJwEoASkBKgErASwBLQEuAS8BMAExATABMwE0ATUBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgBaQFqAWsBbAFtAW4BbwFwAXEBcgFzAXQBdQF2AXcBeAF5AXoBewF8AX0BfgF/AW4BgQGCAYMBhAGFAYYBhwGIAYkBigGLAYwBjQGOAY8BkAGRAZIBkwGUAZUBlgGXAZgBmQGaAZsBnAGdAZ4BnwGgAaEBogGjAaQBpQGmAacBqAGpAaoBqwGsAa0BrgGvAbABsQGyAbMBtAG1AbYBtwG4AbkBugG7AbwBvQG+Ab8BwAHBAcIBwwHEAcUBxgHHAcgByQHKAcsBzAHNAc4BzwHQAdEB0gHTAdQB1QHWAdcB2AHZAdoB2wHcAd0B3gHfAeAB4QHiAeMB5AHlAeYB5wHoAekB6gHrAewB7QHuAe8B8AHxAfIB8wH0AfUB9gH3AfgB+QH6AfsB/AH9Af4B/wEAAgECAgIDAgQCBQIGAgcCCAIJAgoCCwJ6AA0CDgIPAhACyQH5ARMCFAIVAhYCFwIYAv0BFALNARwCHQIeAh8CIAIhAiICIwIkAiUCJgInAigCKQIqAisCLAItAi4CLwIwAjECMgIzAjQCNQI2AjcCOAI5AjoCOwI8Aj0CPgI/AkACQQJCAkMCRAJFAkYCRwJIAkkCSgJLAkwCTQJOAk8CUAJRAlICUwJUAlUCVgJXAlgCWQJaAlsCXAJdAl4CXwJgAmECYgJjAmQCZQJmAmcCaAJpAmoCawJsAm0CbgJvAnACcQJyAnMCdAJ1AnYCdwJ4AnkCegJ7AnwCfQJ+An8CTQKBAoICgwKEAoUChgKHAogCYgKHAkECVQKNAo4CjwKQApECkgKTApQCUwKWApcCiAKZApoCmwKcAp0CngKfAqACoQKiAqMCpAKlAqYCpwKoAqkCqgKrAqwCrQKuAq8CsAKxArICswK0ArUCtgK3ArgCuQK6ArsCvAK9Ar4CvwLAAsECwgLDAsQCxQLGAscCyALJAsoCywLMAs0CzgLPAtAC0QLFAtMC1ALVAtYC1wLYAtkC2gLVAtwC3QLeAt8C4ALdArACtgKsAq0CrgLcAugC6QLqAusC7ALtAs0C7wLZApoC8gLzArEC9QL2At8CtQLLAswC+wL8AvwC/gKkAv4CAQOgAgMD6wLKAr8CtwIIAwkDAwMLA6ICAQMOAw8DfQB7AHByb3BlcnR5AGVudGl0eQBudW1iZXJfY2hlY2thYmxlX2VxdWFsaXR5AGdlb21ldHJ5AGNvcHkAYm9keQBmcmVxdWVuY3kAanNvbl9hcnJheQBhY3Rpb25fbm9uX2Jsb2NraW5nX2RlbGF5AGFjdGlvbl9ibG9ja2luZ19kZWxheQBxdWFudGl0eV9zdWZmaXgAZHVyYXRpb25fc3VmZml4AGRpc3RhbmNlX3N1ZmZpeABhY3Rpb25fZ290b19pbmRleABhY3Rpb25faW5kZXgAc2hvdwBuc2V3AGNvbW1lbnRfdGV4dABhY3Rpb25fY2FtZXJhX2ZhZGVfb3V0AHdlc3QAZWFzdABtYWdlZ2FtZXNjcmlwdABhY3Rpb25fc2V0X3NjcmlwdABhY3Rpb25fcnVuX3NjcmlwdABhY3Rpb25fdW5wYXVzZV9zY3JpcHQAYWN0aW9uX3BhdXNlX3NjcmlwdABfcm9vdABzY3JpcHRfc2xvdABhY3Rpb25fc2F2ZV9zbG90AGFjdGlvbl9lcmFzZV9zbG90AGFjdGlvbl9sb2FkX3Nsb3QAcGxheV9jb3VudABlbnRpdHlfcHJvcGVydHlfaW50AGFjdGlvbl9zZXRfaW50AGFyZ3VtZW50AGRvY3VtZW50AGNvbnN0YW50X2Fzc2lnbm1lbnQAYWxpZ25tZW50AGJsb2NrX2NvbW1lbnQAbGluZV9jb21tZW50AGFjdGlvbl9yZXR1cm5fc3RhdGVtZW50AGFjdGlvbl9icmVha19zdGF0ZW1lbnQAYWN0aW9uX2NvbnRpbnVlX3N0YXRlbWVudABkZWZhdWx0AF9pbnRfdW5pdABfc2ltcGxlX2Jvb2xfdW5pdAB3YWl0AHBvcnRyYWl0AGxpZ2h0AGJvcmRlcl90aWxlc2V0AGFkZF9kaWFsb2dfc2V0dGluZ3NfdGFyZ2V0AGRpcmVjdGlvbl90YXJnZXQAYWN0aW9uX3NldF9zZXJpYWxfY29ubmVjdABqc29uX29iamVjdABvbl9pbnRlcmFjdABjb25jYXQAYWN0aW9uX3NldF9hbWJpZ3VvdXMAaW50ZXJzZWN0cwBwbHVzX21pbnVzX2VxdWFscwBhY3Rpb25fb3BfZXF1YWxzAHJocwBsaHMAYWRkX3NlcmlhbF9kaWFsb2dfc2V0dGluZ3MAYWRkX2RpYWxvZ19zZXR0aW5ncwBhY3Rpb25fcGx1c19taW51c19lcXVhbHNfYWJsZXMAYWN0aW9uX3NldF9hbGlhcwBhY3Rpb25fZGVsZXRlX2FsaWFzAGhleF9lZGl0b3IAYXNzaWdubWVudF9vcGVyYXRvcgBvdmVyX3RpbWVfb3BlcmF0b3IAY29sb3IAZm9yAGpzb25fbmFtZV92YWx1ZV9wYWlyAGluaXRpYWxpemVyAHBsYXllcgBvdmVyAGZvcmV2ZXIAaW5jcmVtZW50ZXIAc2VyaWFsX2RpYWxvZ19wYXJhbWV0ZXIAaW5uZXIAZW50aXR5X2lkZW50aWZpZXIAZ2VvbWV0cnlfaWRlbnRpZmllcgBlbnRpdHlfb3JfbWFwX2lkZW50aWZpZXIAZGlhbG9nX2lkZW50aWZpZXIAY29vcmRpbmF0ZV9pZGVudGlmaWVyAG1vdmFibGVfaWRlbnRpZmllcgBqc29uX251bWJlcgB3cmFwAGFjdGlvbl9sb2FkX21hcABnb3RvAGNvcHlfbWFjcm8AZGVidWdfbWFjcm8AaW5jbHVkZV9tYWNybwByYW5kX21hY3JvAGRvAGJ1dHRvbgBqc29uAGJvb2xfY29tcGFyaXNvbgBzZW1pY29sb24Ac2VyaWFsX2RpYWxvZ19vcHRpb24AYWN0aW9uX3NldF9wb3NpdGlvbgBzY3JpcHRfZGVmaW5pdGlvbgBsYWJlbF9kZWZpbml0aW9uAHNlcmlhbF9kaWFsb2dfZGVmaW5pdGlvbgBfc2ltcGxlX2NvbmRpdGlvbgBlbnRpdHlfZGlyZWN0aW9uAGFjdGlvbl9zZXRfZGlyZWN0aW9uAGR1cmF0aW9uAGFjdGlvbl9wbGF5X2VudGl0eV9hbmltYXRpb24AY3VycmVudF9hbmltYXRpb24AYm9vbF91bmFyeV9leHByZXNzaW9uAGludF9iaW5hcnlfZXhwcmVzc2lvbgBib29sX2JpbmFyeV9leHByZXNzaW9uAF9pbnRfZXhwcmVzc2lvbgBfYm9vbF9leHByZXNzaW9uAHF1YW50aXR5X2V4cGFuc2lvbgBjb2xvcl9leHBhbnNpb24AZW50aXR5X2lkZW50aWZpZXJfZXhwYW5zaW9uAGFtYmlndW91c19pZGVudGlmaWVyX2V4cGFuc2lvbgBlbnRpdHlfb3JfbWFwX2lkZW50aWZpZXJfZXhwYW5zaW9uAGNvb3JkaW5hdGVfaWRlbnRpZmllcl9leHBhbnNpb24AbW92YWJsZV9pZGVudGlmaWVyX2V4cGFuc2lvbgBudW1iZXJfZXhwYW5zaW9uAGR1cmF0aW9uX2V4cGFuc2lvbgBpbnRfZXhwcmVzc2lvbl9leHBhbnNpb24AYm9vbF9leHByZXNzaW9uX2V4cGFuc2lvbgBzdHJpbmdfZXhwYW5zaW9uAGludF9zZXRhYmxlX2V4cGFuc2lvbgBib29sX3NldGFibGVfZXhwYW5zaW9uAGRpc3RhbmNlX2V4cGFuc2lvbgBiYXJld29yZF9leHBhbnNpb24Ab3JpZ2luAGlmX2NoYWluAGFjdGlvbl9jYW1lcmFfZmFkZV9pbgBvcGVuAHRoZW4AX3NjcmlwdF9pdGVtAF9qc29uX2l0ZW0AX2FjdGlvbl9pdGVtAGhleF9jb250cm9sAGxpZ2h0c19jb250cm9sAHBsYXllcl9jb250cm9sAHNlcmlhbF9jb250cm9sAGFjdGlvbl9zZXRfYm9vbABudWxsAGFjdGlvbl9zZXRfY29tbWFuZF9mYWlsAGFjdGlvbl9nb3RvX2xhYmVsAGpzb25fbGl0ZXJhbABvbl9sb29rAHNjcmlwdF9ibG9jawBmb3JfYmxvY2sAX3NlcmlhbF9kaWFsb2dfYmxvY2sAbG9vcGluZ19ibG9jawBpZl9ibG9jawBlbHNlX2Jsb2NrAGRvX3doaWxlX2Jsb2NrAG9uX3RpY2sAc291dGgAbm9ydGgAbGVuZ3RoAGVudGl0eV9wYXRoAGRlYnVnAGFjdGlvbl9zZXRfY29tbWFuZF9hcmcAYWN0aW9uX2RlbGV0ZV9jb21tYW5kX2FyZwBhY3Rpb25fc2hvd19kaWFsb2cAYWN0aW9uX3Nob3dfc2VyaWFsX2RpYWxvZwBhY3Rpb25fY29uY2F0X3NlcmlhbF9kaWFsb2cAYWN0aW9uX2Nsb3NlX3NlcmlhbF9kaWFsb2cAYWN0aW9uX2Nsb3NlX2RpYWxvZwBlbnRpdHlfcHJvcGVydHlfc3RyaW5nAGFjdGlvbl9zZXRfZW50aXR5X3N0cmluZwBpbnRfZ3JvdXBpbmcAYm9vbF9ncm91cGluZwBmbGFnAHNlbGYAaWYAc2F2ZQB0cnVlAHZhbHVlAGVtb3RlAGRlbGV0ZQBhY3Rpb25fc2V0X3dhcnBfc3RhdGUAY29vcmRpbmF0ZQB1bnBhdXNlAGNsb3NlAGVsc2UAZmFsc2UAZXJhc2UAb3B0aW9uX3R5cGUAcG9seWdvbl90eXBlAHByaW1hcnlfaWRfdHlwZQBhY3Rpb25fbW92ZV9vdmVyX3RpbWUAYW5pbWF0aW9uX2ZyYW1lAHNjcmlwdF9uYW1lAHNlcmlhbF9kaWFsb2dfbmFtZQBmaWxlTmFtZQB3aGlsZQBpZl9zaW5nbGUAbW92YWJsZQBpbnRfc2V0YWJsZQBib29sX3NldGFibGUAaW50X2dldGFibGUAYm9vbF9nZXRhYmxlAHN0cmluZ19jaGVja2FibGUAdmFyaWFibGUAYWN0aW9uX2NhbWVyYV9zaGFrZQBzZXJpYWxfbWVzc2FnZQBzdHJhZmUAYW1wbGl0dWRlAGluY2x1ZGUAZGVidWdfbW9kZQBoZXhfZGlhbG9nX21vZGUAdW5oaWRlAGZhZGUAaGV4X2NsaXBib2FyZABlbmQAb3BlcmFuZABhY3Rpb25fc2V0X2NvbW1hbmQAYWN0aW9uX2RlbGV0ZV9jb21tYW5kAGFjdGlvbl91bmhpZGVfY29tbWFuZABhY3Rpb25faGlkZV9jb21tYW5kAHNldF9lbnRpdHlfc3RyaW5nX2ZpZWxkAHByaW1hcnlfaWQAc2Vjb25kYXJ5X2lkAHByZXNzZWQAY2xvc2VkAGdsaXRjaGVkAGFkZABsb2FkAGNhbWVyYQBfAF0AWwBRVUFOVElUWQBFUVVBTElUWQBDT05TVEFOVABDT0xPUgBOVU1CRVIAQ09NUEFSSVNPTgBEVVJBVElPTgBCT09MAFFVT1RFRF9TVFJJTkcARElTVEFOQ0UAQkFSRVdPUkQATVVMX0RJVl9NT0QAQU5EAEFERF9TVUIALT4APz0APj0APT0APD0ALz0ALT0AKz0AKj0AJT0AIT0APAA6AHNlcmlhbF9kaWFsb2dfcmVwZWF0MgBqc29uX2FycmF5X3JlcGVhdDEAY29tbWVudF90ZXh0X3JlcGVhdDEAZG9jdW1lbnRfcmVwZWF0MQBhZGRfZGlhbG9nX3NldHRpbmdzX3RhcmdldF9yZXBlYXQxAGpzb25fb2JqZWN0X3JlcGVhdDEAYWRkX3NlcmlhbF9kaWFsb2dfc2V0dGluZ3NfcmVwZWF0MQBhZGRfZGlhbG9nX3NldHRpbmdzX3JlcGVhdDEAcXVhbnRpdHlfZXhwYW5zaW9uX3JlcGVhdDEAY29sb3JfZXhwYW5zaW9uX3JlcGVhdDEAZW50aXR5X2lkZW50aWZpZXJfZXhwYW5zaW9uX3JlcGVhdDEAYW1iaWd1b3VzX2lkZW50aWZpZXJfZXhwYW5zaW9uX3JlcGVhdDEAZW50aXR5X29yX21hcF9pZGVudGlmaWVyX2V4cGFuc2lvbl9yZXBlYXQxAGNvb3JkaW5hdGVfaWRlbnRpZmllcl9leHBhbnNpb25fcmVwZWF0MQBtb3ZhYmxlX2lkZW50aWZpZXJfZXhwYW5zaW9uX3JlcGVhdDEAbnVtYmVyX2V4cGFuc2lvbl9yZXBlYXQxAGR1cmF0aW9uX2V4cGFuc2lvbl9yZXBlYXQxAGludF9leHByZXNzaW9uX2V4cGFuc2lvbl9yZXBlYXQxAGJvb2xfZXhwcmVzc2lvbl9leHBhbnNpb25fcmVwZWF0MQBzdHJpbmdfZXhwYW5zaW9uX3JlcGVhdDEAaW50X3NldGFibGVfZXhwYW5zaW9uX3JlcGVhdDEAYm9vbF9zZXRhYmxlX2V4cGFuc2lvbl9yZXBlYXQxAGRpc3RhbmNlX2V4cGFuc2lvbl9yZXBlYXQxAGJhcmV3b3JkX2V4cGFuc2lvbl9yZXBlYXQxAGlmX2NoYWluX3JlcGVhdDEAc2NyaXB0X2Jsb2NrX3JlcGVhdDEAX2RpYWxvZ19ibG9ja19yZXBlYXQxAGxvb3BpbmdfYmxvY2tfcmVwZWF0MQBzZXJpYWxfZGlhbG9nX3JlcGVhdDEAY29tbWVudF90ZXh0X3Rva2VuMQBRVUFOVElUWV90b2tlbjEAKi8ALQAsACsALyoAKQAoACUAIwAhAAAAAAAAAAAAAAAAAAABAAMAAAAAAAUAAAAAAAEAAAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAAAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAMAAAAAAAUAAAAJAAsAAAAAAAAAAAAAAAAADQAAAAAAAAAAAA8AEQATAAAAAAAAAAAAFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANcC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AAACAAAAAAAAAAECQwEAAAAAAADJAQABAAACAAAAAAAAAAECQwEAAAAAAACAAgABAAACAAAAAAAAAAECQwEAAAAAAAABAwABAAACAAAAAAAAAAECQwEAAAAAAAACAwABAAACAAAAAAAAAAECQwEAAAAAAAD4AgABAAACAAAAAAAAAAECQwEAAAAAAAAJAwABAAACAAAAAAAAAAECQwEAAAAAAAB0AgABAAACAAAAAAAAAAECQwEAAAAAAAB6AgABAAACAAAAAAAAAAECQwEAAAAAAADJAgABAAACAAAAAAAAAAECQwEAAAAAAACXAgABAAACAAAAAAAAAAECQwEAAAAAAADqAgABAAACAAAAAAAAAAECQwEAAAAAAAAjAQABAAACAAAAAAAAAAECQwEAAAAAAAAWAQABAAACAAAAAAAAAAECQwEAAAAAAABFAQABAAACAAAAAAAAAAECQwEAAAAAAAA6AQABAAACAAAAAAAAAAECQwEAAAAAAAAgAgABAAACAAAAAAAAAAECQwEAAAAAAADYAgABAAACAAAAAAAAAAECQwEAAAAAAAA1AgABAAACAAAAAAAAAAECQwEAAAAAAABGAQABAAACAAAAAAAAAAECQwEAAAAAAABHAQABAAACAAAAAAAAAAECQwEAAAAAAAC0AgABAAACAAAAAAAAAAECQwEAAAAAAADgAgABAAACAAAAAAAAAAECQwEAAAAAAAB9AAABAAACAAAAAAAAAAECQwEAAAAAAAAcAQABAAACAAAAAAAAAAECQwEAAAAAAAADAQABAAACAAAAAAAAAAECQwEAAAAAAACdAQABAAACAAAAAAAAAAECQwEAAAAAAADaAgABAAACAAAAAAAAAAECQwEAAAAAAACvAQABAAACAAAAAAAAAAECQwEAAAAAAABOAQABAAACAAAAAAAAAAECQwEAAAAAAACwAQABAAACAAAAAAAAAAECQwEAAAAAAAB0AAABAAACAAAAAAAAAAECQwEAAAAAAAAEAwABAAACAAAAAAAAAAECQwEAAAAAAACYAgABAAACAAAAAAAAAAECQwEAAAAAAAAMAwABAAACAAAAAAAAAAECQwEAAAAAAACnAgABAAABAAAAAAAAAAAA5QAAAAAAAQEAAAAAAAAAAP0AAAAAAAEBAAAAAAAAAAAYAQAAAAABAQAAAAAAAAAAdQAAAAAAAQEAAAAAAAAAADcAAAAAAAEAAAAAAAAAAADJAQAAAAABAAAAAAAAAAAAgAIAAAAAAQAAAAAAAAAAAAEDAAAAAAEAAAAAAAAAAAACAwAAAAABAAAAAAAAAAAA+AIAAAAAAQAAAAAAAAAAAAkDAAAAAAEAAAAAAAAAAAB0AgAAAAABAAAAAAAAAAAAegIAAAAAAQAAAAAAAAAAAMkCAAAAAAEAAAAAAAAAAACXAgAAAAABAAAAAAAAAAAA6gIAAAAAAQAAAAAAAAAAACMBAAAAAAEAAAAAAAAAAAAWAQAAAAABAAAAAAAAAAAARQEAAAAAAQAAAAAAAAAAADoBAAAAAAEAAAAAAAAAAAAgAgAAAAABAAAAAAAAAAAA2AIAAAAAAQAAAAAAAAAAADUCAAAAAAEAAAAAAAAAAABGAQAAAAABAAAAAAAAAAAARwEAAAAAAQAAAAAAAAAAALQCAAAAAAEAAAAAAAAAAADgAgAAAAABAAAAAAAAAAAAfQAAAAAAAQAAAAAAAAAAABwBAAAAAAEAAAAAAAAAAAADAQAAAAABAAAAAAAAAAAAnQEAAAAAAQAAAAAAAAAAANoCAAAAAAEAAAAAAAAAAACvAQAAAAABAAAAAAAAAAAATgEAAAAAAQAAAAAAAAAAALABAAAAAAEAAAAAAAAAAAB0AAAAAAABAAAAAAAAAAAABAMAAAAAAQAAAAAAAAAAAJgCAAAAAAEAAAAAAAAAAAAMAwAAAAABAAAAAAAAAAAApwIAAAAAAQEAAAAAAAAAAEgAAAAAAAEBAAAAAAAAAABMAAAAAAABAQAAAAAAAAAAMgAAAAAAAgAAAAAAAAABAjYBAAAAAAAA2wAAAQAAAgEAAAAAAAABAjYBAAAAAAAA/QAAAQAAAgEAAAAAAAABAjYBAAAAAAAAGAEAAQAAAgEAAAAAAAABAjYBAAAAAAAAdQAAAQAAAQEAAAAAAAABAjYBAAAAAAIAAAAAAAAAAQI2AQAAAAAAAMkBAAEAAAIAAAAAAAAAAQI2AQAAAAAAAE0CAAEAAAIAAAAAAAAAAQI2AQAAAAAAAA0DAAEAAAIAAAAAAAAAAQI2AQAAAAAAAKACAAEAAAIAAAAAAAAAAQI2AQAAAAAAALUCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAHQCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAHoCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAMkCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAJcCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAOoCAAEAAAIAAAAAAAAAAQI2AQAAAAAAACMBAAEAAAIAAAAAAAAAAQI2AQAAAAAAABYBAAEAAAIAAAAAAAAAAQI2AQAAAAAAAEUBAAEAAAIAAAAAAAAAAQI2AQAAAAAAADoBAAEAAAIAAAAAAAAAAQI2AQAAAAAAACACAAEAAAIAAAAAAAAAAQI2AQAAAAAAANgCAAEAAAIAAAAAAAAAAQI2AQAAAAAAADUCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAEYBAAEAAAIAAAAAAAAAAQI2AQAAAAAAAEcBAAEAAAIAAAAAAAAAAQI2AQAAAAAAALQCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAOACAAEAAAIAAAAAAAAAAQI2AQAAAAAAAH0AAAEAAAIAAAAAAAAAAQI2AQAAAAAAABwBAAEAAAIAAAAAAAAAAQI2AQAAAAAAAAMBAAEAAAIAAAAAAAAAAQI2AQAAAAAAAJ0BAAEAAAIAAAAAAAAAAQI2AQAAAAAAANoCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAK8BAAEAAAIAAAAAAAAAAQI2AQAAAAAAAE4BAAEAAAIAAAAAAAAAAQI2AQAAAAAAALABAAEAAAIAAAAAAAAAAQI2AQAAAAAAAHMAAAEAAAIAAAAAAAAAAQI2AQAAAAAAAOsCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAIgCAAEAAAIAAAAAAAAAAQI2AQAAAAAAAKICAAEAAAIAAAAAAAAAAQI2AQAAAAAAAKcCAAEAAAEAAAAAAAAAAADbAAAAAAABAQAAAAAAAAAAzAAAAAAAAQAAAAAAAAAAAE0CAAAAAAEAAAAAAAAAAAANAwAAAAABAAAAAAAAAAAAoAIAAAAAAQAAAAAAAAAAALUCAAAAAAEAAAAAAAAAAABzAAAAAAABAAAAAAAAAAAA6wIAAAAAAQAAAAAAAAAAAIgCAAAAAAEAAAAAAAAAAACiAgAAAAABAQAAAAAAAAAA3AAAAAAAAQEAAAAAAAAAAEsAAAAAAAEBAAAAAAAAAABQAAAAAAABAQAAAAAAAAAAJgAAAAAAAQEAAAAAAAAAAEYAAAAAAAEBAAAAAAAAAABYAAAAAAABAQAAAAAAAAAAWwAAAAAAAQEAAAAAAAAAACgAAAAAAAEBAAAAAAAAAAA2AAAAAAABAQAAAAAAAAAARAAAAAAAAQEAAAAAAAAAADwAAAAAAAEBAAAAAAAAAABFAAAAAAABAQAAAAAAAAAAJAAAAAAAAQAAAAAAAAAAAP0AAAAAAAEAAAAAAAAAAQIMAQAAFAABAQAAAAAAAAECDAEAABQAAQAAAAAAAAAAAG4BAAAAAAEAAAAAAAAAAQEMAQAABQABAQAAAAAAAAEBDAEAAAUAAQAAAAAAAAAAAIABAAAAAAEAAAAAAAAAAQJCAQAAMQABAQAAAAAAAAECQgEAADEAAgAAAAAAAAABAkIBAAAxAAAAiwIAAQAAAgAAAAAAAAABAkIBAAAxAAAAQQIAAQAAAQAAAAAAAAABBLwAAAAAAAEBAAAAAAAAAQS8AAAAAAABAAAAAAAAAAEDvAAAAAAAAQEAAAAAAAABA7wAAAAAAAEAAAAAAAAAAQJCAQAALwABAQAAAAAAAAECQgEAAC8AAQAAAAAAAAABBQ0BAABbAAEBAAAAAAAAAQUNAQAAWwABAAAAAAAAAAEDuQAAAAAAAQEAAAAAAAABA7kAAAAAAAEAAAAAAAAAAQK8AAAAAAABAQAAAAAAAAECvAAAAAAAAQAAAAAAAAABArkAAAAAAAEBAAAAAAAAAQK5AAAAAAABAAAAAAAAAAECQwEAAAAAAQAAAAAAAAABAUMBAAAAAAEBAAAAAAAAAQFDAQAAAAABAAAAAAAAAAEBugAAAAAAAQEAAAAAAAABAboAAAAAAAEAAAAAAAAAAQLDAAAACwABAQAAAAAAAAECwwAAAAsAAQAAAAAAAAABArsAAAAAAAEBAAAAAAAAAQK7AAAAAAABAAAAAAAAAAECugAAAAAAAQEAAAAAAAABAroAAAAAAAEAAAAAAAAAAQIMAQAAEwABAQAAAAAAAAECDAEAABMAAQAAAAAAAAABAhABAAAAAAEBAAAAAAAAAQIQAQAAAAABAAAAAAAAAAECDgEAAC4AAQEAAAAAAAABAg4BAAAuAAEAAAAAAAAAAQMMAQAAMAABAQAAAAAAAAEDDAEAADAAAQAAAAAAAAABBMIAAAAAAAEBAAAAAAAAAQTCAAAAAAABAAAAAAAAAAEDEAEAAAAAAQEAAAAA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xAIAAAAAAQEAAAAAAAAAAIwCAAAAAAEBAAAAAAAAAADuAgAAAAABAQAAAAAAAAAA/wAAAAAAAQEAAAAAAAAAABkCAAAAAAEBAAAAAAAAAQSkAAAAAAABAQAAAAAAAAAAMAEAAAAAAQEAAAAAAAAAADIBAAAAAAEBAAAAAAAAAABjAAAAAAABAQAAAAAAAAAAZQAAAAAAAQEAAAAAAAAAAPkCAAAAAAEBAAAAAAAAAAD6AgAAAAABAQAAAAAAAAAAZwAAAAAAAQEAAAAAAAAAAGQAAAAAAAEBAAAAAAAAAAD9AgAAAAABAQAAAAAAAAAA/gIAAAAAAQEAAAAAAAAAABkAAAAAAAEBAAAAAAAAAAAnAAAAAAABAQAAAAAAAAAAawAAAAAAAQEAAAAAAAAAALAAAAAAAAEBAAAAAAAAAAAWAAAAAAABAQAAAAAAAAAAywIAAAAAAQEAAAAAAAABA5sAAAAAAAEBAAAAAAAAAQKbAAAAAAAAAAAAAAAAAAABAAEAAAEAAAAAAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAAAAAEBAAEBAAEAAAEAAAEAAAEBAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEBAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEBAAEBAAEBAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEBAAEBAAEBAAEBAAEBAAEBAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEAAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAABAAEBAAABAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAABAAEBAAABAAEBAAEBAAEBAAEBAAEBAAEBAAABAAABAAEBAAEBAAEBAAEBAAABAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhADUEIgAXACMAJwQkAD8CJQC8BCYAGgAoADYEKQA3BCoAuAQrAF4ELAAIBC0AvwQvALoEOgAsBDsACgQ8AIkEPQCDBD4AhwQ/ACcAWwAHBF0ACQRfACUEYQCJAGIAQQFjADgAZACiAGUASQBmADoAZwDBAGgAowBpAOsAagDYAWwAPABtAD4AbgBmAG8AZAFwAD8AcgBQAHMA/gN0AP4AdQBlAXcAQgB4AMsEeQDOBHsAEgR8ADoCfQATBAAAAAAhADQEIgAXACQAPwIlACEAKQA3BCoAHwArACMALAAIBC0AJQAvABwAOgAsBDsACgQ9AIIEPwAnAFsABwRdAAkEYQA5A2IAMQNjAF4CZAC3AmUAXwNmADIDZwB3A2gAuAJpAOgCagCzA2wAAQNtAGUCcABkAnIAaAJzAGACdQBUA3cAYQJ9ABMEAAAAAAAAAAAhADQEIgAXACQAPwIoADYELQA7Ai8AGwBbAAcEXQAJBGIA5ANjAD0DZADPAmUAfwJmAHYCbgCCA28A6wJwAEMDcwDlAnQArQN1AJMDdwB1AiEANAQiABcAJAA/AigANgQvABsAYgDkA2MAPQNkAM8CZQBgA2YAdgJvAOsCcABDA3MA5gJ0AK0DdQCTAwAAAAAhACAAIgAXACMAPAIkAD8CKQA3BCwACAQtACsALwAbADsACgQ8AIkEPQAmAD4AhwRJAHcBWwAHBF0ACQRhAFABYgBCAWMAOQBkAMgAZQBXAWYAXABnALoBaQByAWwAOwBtAD0AbgBnAG8AHgJwAFQBcgDXAHMA2QB0AAkBdwBhAHgAAAR5AN8AewASBH0AEwQhACAAIgAXACMAPAIkAD8CKQA3BCwACAQtACsALwAbADsACgQ8AIkEPQAmAD4AhwRJAHcBWwAHBF0ACQRhAFABYgBCAWMAOQBkAMgAZQBXAWYAXABnALoBaQByAWwAOwBtAD0AbgBnAG8AHgJwAFQBcgDXAHMA2QB0AAkBdwBhAHkA3wB7ABIEfQATBAAAAAAhACgAIgAXACMAJgQlALwEJgAaACkANwQqALgEKwBeBCwACAQtAL4ELwC6BDsACgQ9AIQEPwAnAFsABwRdAAkEXwAlBGEAdAFjAFMBZAALAWUASgBmAKABZwDAAGkAhwFtAFgAbgBlAG8AewFwAGMAcwDqAHQACgF3AOEAeADLBHkAzQR8ADoCfQATBAAAAAAhACgAIgAXACQAPwIlALsEJgAaACkANwQqALcEKwBdBCwACAQtAL0ELwC5BDsACgQ9ACkAWwAHBF0ACQRhADkDYgAwA2MAXAJkALcCZQBfA2YAMgNnAHcDaAC4AmkA6AJqALMDbAABA20AZQJwAGQCcgBoAnMAYAJ1AFQDdwBhAnwAOgJ9ABMEAAAAAAAAAAAhACgAJAA/AiYAGgApADcELAAIBC0AOwIvABsAOwAKBD0AKQBbAAcEXQAJBGMAVgFkAIsBZQBLAGYAcwBuAIwBbwDuAHAAVQFzANoAdAD/AHUArQF3AGAAfAA6AgAAAAAiABcAIwA8AiQAPwItADsCLwAbAGIAKgNjADwDZAB2A2YAdwJnAKsDbQBxAm8A7AJyANwCdAD9AnUAkwN3AP4CeQDfAgAAAAAAAAAAAAAAACIAFwAkAD8CJQAhACoAIgArACMALQAkAC8AHAA9AIIEPwAnAFsABwRhAG8DZAAMA24AfAJwAHsCdAD0AwAAAAAiABcAJAA/AigANgQtADsCLwAbAFsABwRdAAkEZQBgA3AAQwNzAN0CAAAAAAAA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";
  const treeSitterMagegamescript$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: treeSitterMagegamescript
  }, Symbol.toStringTag, { value: "Module" }));
  exports.parseProject = parseProject;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
});
//# sourceMappingURL=mgs-lib.umd.js.map
