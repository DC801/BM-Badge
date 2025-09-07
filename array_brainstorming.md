## Arrays?

- Not part of map struct, as the map encoding would have to be redone/altered, and that might be hard; better to make it an Action and do management at runtime
- 256 arrays total? OK
- 256 ints max (ints are `u16` so can be 65-thousand-and-whatever-it–was)
- Commands/aliases are per map, but these would be per game session instead?
- Not saved in the save file, so will need to re-initialize when unsure whether they already exist (that's fine)
- When to uninitialize them? Can has map on_unload? (Doesn't that mean changing the struct anyway?)
	- Would have to be run when a new map is loaded, when the old map is RE-loaded, and when debug mode is entered
- Will always be variable size, so no create-at-size-N; will start with nothing and grow/shrink. Will be allocated with a few extra slots to grow into, then can move to a new allocation once full, like normal
- Index of `-1` (or `-n`) is last item (or nth from end)
	- This means I can't use `-1` as the index if indexing with an int variable, since those are always positive; will have to use that 65k value (prob will make it a compile-time constant in `header.mgs`?) Might work well because the array index is only a `u8` if there can only be 255 items per array
	- Or maybe, when getting the last item, I'll never need an int variable anyway?
- We have no objects or methods or even functions, but since these actions are all "methods" on the "array" we can still use standard `.method()` syntax to make it clear what thing is being operated upon.
	- Might find other uses of dot syntax if I'm not careful... entity fields? O.o `player.x` sure, maybe, but not `entity "Bob".x` >:/
		- Do I want to make this `player.x` and `entity(Bob).x` instead? What's the worst thing that could happen? Does this solve a couple other problems actually? Does this look terrible in context? This can't collide with fn names because they can't be keywords anway, right? (You could always do "entity"() if you wanted to do that)
		- Could I lose the double quotes and just put the word in the place? e.g. `entity(Aunt Zippy)`
		- Should it actually be more like `entity[Bob]` since it's kind of like a lookup inside an array-like thing? Does this make people thing our newborn arrays are more like objects, with complex internal structures? (`entity[Bob].current_animation = 0` vs `player_positions[0] = 0`) Maybe this is going in a bad direction.
		- Defer!
- Methods with a "return" value can use the same `__RETURN_` patterns as fn/script "returns"
	- Thus will be an `IntGetable`, so they can participate in int expressions (WOO)
	- Might literally make them `FnCallReturnValue` -- minimize plumbing required. (Might not need *any* plumbing, actually)
	- If not putting the "return" value into a variable (e.g. if just removing it from the array) then can ignore the `__RETURN_` value (though will still want to put 0 in there afterward, like normal fns that don't return anything)

### Syntax

- `ARRAY_NEW`: Create by name
	- Asking for a new one by name will overwrite any existing array by that name. Thus, should use same pattern as `command _ = ...` and `alias _ = ...` since their overwriting behavior is similar
	- Q. Initialized values?
		- Real? `array arrayName = [1,2,3,4]` is what the encoder sees?
			- NO! Complex args in the bytecode only works with COPY_SCRIPT find-and-replace because it's done pre-bytecode, and with lights because they're a single bit in (what I'm assuming is) a `u32`; cannot possibly store any useful quantity of array values in the action itself
		- Fake? `array arrayName = [1,2,3,4]` could be sugar for:
			- `array arrayName;`
			- `array.push(1);`
			- `array.push(2);`
			- `array.push(3);`
			- `array.push(4);`
			- Thus, could do vars easily: `array arrayName = [1,2,3,four]`
- `ARRAY_DELETE`: Destroy by name
	- `delete array arrayName;`
- `ARRAY_PUSH_VARIABLE`/`ARRAY_PUSH_VALUE`: Push
	- RETURNS: length of array
	- `arrayName.push(100);`
	- `arrayName.push(varName);`
- `ARRAY_LEFT_PUSH_VARIABLE`/`ARRAY_LEFT_PUSH_VALUE`: PushLeft
	- RETURNS: length of array
	- .pushLeft or .push_left? I guess I've been using underscores for things like warp_state, thus we'll use .push_left
	- `arrayName.push_left(100);`
	- `arrayName.push_left(varName);`
- `ARRAY_POP_VARIABLE`/`ARRAY_POP_VALUE`: Pop
	- RETURNS: value removed
	- `arrayName.pop();`
	- `destinationVar = arrayName.pop();`
	- `entity y = arrayName.pop() * 30;`
- `ARRAY_LEFT_POP_VARIABLE`/`ARRAY_LEFT_POP_VALUE`: PopLeft
	- RETURNS: value removed
	- `arrayName.pop_left();`
	- `destinationVar = arrayName.pop_left();`
	- `entity y = arrayName.pop_left() * 30;`
- `GET_ARRAY_LENGTH`: Get length (RETURN)
	- RETURNS: length of array
	- Make it look like a method call and not a property:
	- `arrayName.length()`
	- `varName = arrayName.length();`
- `COPY_ARRAY_VALUE`: Copy value at fixed index from/into variable
	- RETURNS: value at that value index
	- `varName = arrayName[100];`
	- `arrayName[100] = varName;`
- `COPY_ARRAY_VALUE` Copy value at variable index from/into Variable
	- RETURNS: value at that variable index
	- `varName = arrayName[indexVar];`
	- `arrayName[indexVar] = varName;`
- `REVERSE_ARRAY`: Reverse
	- Prob reverse in place
	- `arrayName.reverse();`
- `SORT_ARRAY`: Sort (up/down)
	- Prob sort in place
	- It's numbers, so there's only two sorts that make sense
	- Two methods?
		- `arrayName.sortAsc();`
		- `arrayName.sortDesc();`
	- Or just use sort and reverse if you want a reverse sort? (I like this one)
		- `arrayName.sort();`
		- `arrayName.reverse();`
- `ARRAY_SLICE`: Slice into new Array (fixed indices)
	- Gonna be:
		`ARRAY_SLICE`
		`ARRAY_SLICE_TWICE`
		`ARRAY_SLICE_BY_VARIABLE`
		`ARRAY_SLICE_TWICE_BY_VARIABLE`
	- TODO: different versions for number/string indices?
	- `subslice = origArray.slice(5, -1);` // two args
	- `onlyTheEnd = origArray.slice(4);` // one arg
	- `copiedArray = origArray.slice();` // zero args
	- Q. Do you have to make the destination array first? If so, mathlang can do that itself behind the scenes.
- Slice into new Array (variable indices)
	- `arrayName = array2.slice(index1, index2);`
	- If mixed fixed/variable indices, use the double var version and put the known value in a temporary
	- `arrayName = array2.slice(index1, 100);`
- Concat
	- Real? Mathlang sugar?
	- Put combo into new array or more like append-in-place?
	- `arrayName.push(...array2)` spread operators aren't real in our lang, and they're very specific to each language anyway
	- `array1 = array2..array3`? concat operators aren't very standardized either
	- `array1.push(array2)` to resemble `array1.push([1,2,3,4])` (current favorite)
		- Makes it clear that array1 is being modified, whereas there's always that question with `.concat()`
	- Q. `.push(1,2,3,4)` or `.push([1,2,3,4])`?
		- The latter, because a variable number of args isn't something we have, but "spread values" (which looks like an array) is something we do have in Actions
	- Q. But concat shouldn't modify in place, should it?
- Splice?
	- Probably should be done in-engine; that would be harder to fake vs some of this other stuff.
	- Just do whatever JS does IDK
	- Though since we can't pass complex values as args, we would either need to pass in the reference to an array to insert (if any; none is allowed) or we'll need to have a separate array method to insert values. Q. Which scenario is better?
- ForEach
	- NO! We can use a `for` loop and use the indices if we need...
	- NO WAIT WE COULD TOTALLY DO THIS ON THE LANGUAGE LEVEL -- just can't have named functions go inside OR COULD WE? HOLY COW WE CAN
- Map
	- DITTO
- Zipper
	- SURE WHY NOT
	- `i` is the smaller array, and makes a temporary mini array for [array1[i], array2[i]] to operate upon. (How does this look in the args?)
	- Q: Args can't be swapped out with array lookups, just numbers, strings, and bools. How to do the swap in this case? Just pass the literal values? That might be possible with the existing system, but might need some special handling.
	- DON'T IMPLEMENT THIS UNLESS YOU NEED IT
- Windows
	- I LOVE THIS I WANT THIS IN JS GIMME IT
	- Similarly implemented into the above, but instead of a pair of literal values, maybe just give the array name itself. Q. Should zipper do that, too?
	- The given array length would be the size of the window (n)
	- DON'T IMPLEMENT THIS UNLESS YOU NEED IT
- Fold/reduce
	- ALL THE THINGS
	- DON'T IMPLEMENT THIS UNLESS YOU NEED IT REMEMEBER YOU HAVE TO MAKE A GAME, TOO

### Ambiguities

When making a new one or deleting one, should mimic command/alias syntax. But what about other times?

- `arrayName[0] = 8;` is clearly an array access on the LHS, no need to prefix LHS with `array`.
- `arrayName = arrayName.slice()` is clearly an array access on the LHS since the RHS is an array method call. This was the nearest thing to an ambiguous situation.
- This is not like  `varName = varName`, which could be an int expression or a bool expression.

I think we good.

### Daisy chaining

What about things like `arr.sort().map(multByTen).reverse()`?

```js
// Could become
arr.sort();
arr.map(multByTen);
arr.reverse();
// easily enough.
```

### For each / map

- Okay, how would we actually do this?

```js
array arr = [4,2,1,7,5]
	.sort()
	.map(($n, $i, $a) {
		$n *= 10; // can't do this; that just changes the temporary
		// but then, you wouldn't be doing that in a for_each in real life, either -- oh, wait, let's make it a map actually
		$a[$i] *= 10; // would probably work but it's getting a bit gross now
		// in any case, if inside a `.map()` this should be done with `return` anyway....
		// HOLY CRAP IS THIS A LAMBDA? DID I JUST INVENT THOSE?
		// THEY CAN JUST USE AN AUTO-IDENTIFIER NAME!! I WANTED SCRIPT LITERALS ANYWAY!! OMG
		return $n * 10; // can do this already, largely
		// though you could still do $a[$i] if you wanted to, just like IRL
		// Might be nice to have $a so you could get $a.length() or do other things, just like IRL
		// WE'RE JUST LIKE IN IRL!
	})
	.reverse();
// so arr would be [70, 50, 40, 20, 10]
```

Okay, for real now:
```js
array arr = [4,2,1,7,5]
	.sort()
	.map(($n) { return $n * 10; })
	.reverse();

// INTERMEDIATE SHAPE:

array arr = []; // just have bare `array arr;` or this? The former looked funny...
arr.push(4);
arr.push(2);
arr.push(1);
arr.push(7);
arr.push(5);
arr.sort();
// AUTO MAP
fn autoGeneratedLambda ($n, $i, $a) { return $n * 10; }
// (^^ at this point you'd register the lambda in the file)
array arr2 = [];
temp1 = arr.length();
// I wanna use `i` for debug readability's sake, but best to not assume it's avaiable.
// After all, this method call might be in a for loop or something.
for (temp2 = 0; temp2 < temp1; temp2 += 1) {
	temp3 = arr[temp2];
	temp4 = autoGeneratedLambda(temp3, temp2, arr);
	arr.push(temp4);
}
arr = arr2.slice();
delete array arr2;
// AUTO MAP OVER
arr.reverse();
```

### Expressions in args?

```js
// So given
fn asdf ($a, $b) { tempvar1 = $a + $b; }
_ {
	wait 1;
	tempvar2 = asdf(20, 4 + player x);
	wait 2;
}

// So what I'd do is is
_ {
	wait 1;
	// <asdf>
	// can put it inside the copy-in-place?
	// wouldn't matter in practice but would keep it all in-house
	__TEMP_0 = 4 + player x;
	tempvar1 = 20 + __TEMP_0;
	// </asdf>
	wait 2;
}
// long version:
_ {
	wait 1;
	// <asdf>
	__TEMP_0 = 4;
	__TEMP_1 = player x;
	__TEMP_0 += __TEMP_1;
	tempvar1 = 20;
	tempvar1 += __TEMP_0;
	// </asdf>
	wait 2;
}

This will work!
```

## To get this to work

- [x] Lambda fns
- [?] Identifier swaps as constants
-  Expressions in constants? They are compile-time constants explicitly, so no.
- [ ] Expressions as args: see above. This should be okay.

### Where can which array bits go?

| method     | args       | returns | modifies | root  | array def | int exp |      
|------------|------------|---------|----------|-------|-----------|---------|
| for_each   | fn/lambda  | n/a     |          | yes   |           |         |
| map        | fn/lambda  | array   |          | maybe | yes       |         |
| sort       |            | array   | yes      | yes   | yes       |         |
| slice      | 0-2 ints   | array   |          | maybe | yes       |         |
| reverse    |            | array   | yes      | yes   | yes       |         |
| [index]    | int        | int     |          |       |           | yes     |
| length     |            | int     |          |       |           | yes     |
| pop        |            | int     | yes      | yes   |           | yes     |
| push       | 1+ ints    | int     | yes      | yes   |           | yes     |
| left_pop   |            | int     | yes      | yes   |           | yes     |
| left_push  | 1+ ints    | int     | yes      | yes   |           | yes     |


```js
// RETURN VALUES
arrName.pop(); // -> number
arrName.push(1); // -> number (new array length)
arrName.left_pop(); // -> number
arrName.left_push(1); // -> number (new array length)
arrName.length(); // -> number
arrName[1]; // -> number
arrName.reverse(); // -> Array
arrName.slice(); // -> Array
arrName.sort(); // -> Array
arrName.map(); // -> Array
arrName.for_each(); // -> NOTHING

// DELETE ARRAY
delete array arrName;

// NEW ARRAY BY NAME / WHOLE ARRAY ASSIGNMENT
array arrName = []; // ok
array arrName = [1,2,3]; // ok
array arrName = arr.pop(); // NOT ALLOWED
array arrName = arr.push(1); // NOT ALLOWED
array arrName = arr.left_pop(); // NOT ALLOWED
array arrName = arr.left_push(1); // NOT ALLOWED
array arrName = arr.length(); // NOT ALLOWED
array arrName = arr[0]; // NOT ALLOWED
array arrName = arr.reverse(); // ok
array arrName = arr.slice(); // ok
array arrName = arr.sort(); // ok
array arrName = arr.map(); // ok
array arrName = arr.for_each(); // NOT_ALLOWED

// INT EXPRESSION
player x = arrName.pop(); // -> ok
player x = arrName.push(1); // -> ok
player x = arrName.left_pop(); // -> ok
player x = arrName.left_push(1); // -> ok
player x = arrName.length(); // -> ok
player x = arrName[1]; // -> ok
player x = arrName.reverse(); // -> NOT ALLOWED
player x = arrName.slice(); // -> NOT ALLOWED
player x = arrName.sort(); // -> NOT ALLOWED
player x = arrName.map(); // -> NOT ALLOWED
player x = arrName.for_each(); // -> ALLOWED

// TOP LEVEL
arrName.pop(); // -> ok
arrName.push(1); // -> ok
arrName.left_pop(); // -> ok
arrName.left_push(1); // -> ok
arrName.length(); // -> NOT ALLOWED
arrName[1]; // -> NOT ALLOWED
arrName.reverse(); // -> NOT ALLOWED
arrName.slice(); // -> NOT ALLOWED
arrName.sort(); // -> ok
arrName.map(); // -> NOT ALLOWED?
arrName.for_each(); // -> ok


```

## All Int Variables In Use

### General

- "CALLBACK",
- "__RETURN_",
- "__TEMP_0",
- "__TEMP_1",
- "another_count",
- "ch2_pretoot_door_attempts",
- "ch2_alfonso_library_count",
- "ch2_hamstertalk",
- "ch2_in_room",
- "ch2_mousegame_catchcount",
- "ch2_rattle_count",
- "ch2_samson_count",
- "ch2_storyflag_round",
- "ch2_toot_level",
- "ch2_ws_flags_tally",
- "ch2_ws_turn_status",
- "ch2_ws_turn_value",
- "checked_value",
- "cli_variable",
- "column",
- "curr_plate",
- "curr_player_queue",
- "curr_self_queue",
- "current_chapter",
- "cursor_grip_height",
- "cursor_hinge_height",
- "cursor_pos",
- "cursor_value",
- "entity_type_id",
- "goat_count",
- "goosefact",
- "hanoi_move_count",
- "hint_tracking",
- "hinteger",
- "i",
- "j",
- "mage29-skippydoodle",
- "mouse_cell",
- "mousegame_lights",
- "my_diff_x",
- "my_diff_y",
- "my_old_x",
- "my_old_y",
- "offset_self_x",
- "offset_self_y",
- "plate1",
- "plate2",
- "plate3",
- "playersave_dir",
- "playersave_room",
- "playersave_x",
- "playersave_y",
- "row",
- "simon_player_move",
- "simon_round",
- "slot_number",
- "tempvar",
- "tempvar2",
- "tempvar3",
- "tempvar4"

### Pretending to be Arrays

- "array1_1",
- "array1_2",
- "array1_3",
- "array1_4",
- "array1_5",
- "array1_6",
- "array1_7",
- "array1_length",
- "array2_1",
- "array2_2",
- "array2_3",
- "array2_4",
- "array2_5",
- "array2_6",
- "array2_7",
- "array2_length",
- "array3_1",
- "array3_2",
- "array3_3",
- "array3_4",
- "array3_5",
- "array3_6",
- "array3_7",
- "array3_length",
- "queue_x0",
- "queue_x1",
- "queue_x2",
- "queue_x3",
- "queue_x4",
- "queue_x5",
- "queue_x6",
- "queue_x7",
- "queue_x8",
- "queue_x9",
- "queue_y0",
- "queue_y1",
- "queue_y2",
- "queue_y3",
- "queue_y4",
- "queue_y5",
- "queue_y6",
- "queue_y7",
- "queue_y8",
- "queue_y9",
- "simon_pos1",
- "simon_pos2",
- "simon_pos3",
- "simon_pos4",
- "simon_pos5",
- "simon_pos6",
- "simon_pos7",
- "simon_pos_curr",
