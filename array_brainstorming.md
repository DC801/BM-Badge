## Arrays?

- Not part of map struct, as the map encoding would have to be redone/altered, and that might be hard; better to make it an Action and do management at runtime
- 256 arrays total? OK
- 256 ints max (ints are `u16` so can be 65-thousand-and-whatever-it–was)
- Commands/aliases are per map, but these would be per game session instead?
- Not saved in the save file, so will need to re-initialize when unsure whether they already exist (that's fine)
- Will always be variable size, so no create-at-size-N; will start with nothing and grow/shrink. Will be allocated with a few extra slots to grow into, then can move to a new allocation once full, like normal
- Index of `-1` (or `-n`) is last item (or nth from end)
	- This means I can't use `-1` as the index if indexing with an int variable, since those are always positive; will have to use that 65k value (prob will make it a compile-time constant in `header.mgs`?) Might work well because the array index is only a `u8`
- We have no objects or methods or even functions, but since these actions are all "methods" on the "array" we can still use standard `.method()` syntax to make it clear what thing is being operated upon. (Might find other uses of dot syntax if I'm not careful... entity fields? O.o `player.x` sure, maybe, but not `entity "Bob".x` >:/ )
- Methods with a "return" value can use the same `__RETURN_` patterns as fn/script "returns"
	- Thus will be an `IntGetable`, so they can participate in int expressions (WOO)
	- Might literally make them `FnCallReturnValue` -- minimize plumbing required. (Might not need *any* plumbing, actually)
	- If not putting the "return" value into a variable (e.g. if just removing it from the array) then can ignore the `__RETURN_` value (though will still want to put 0 in there afterward, like normal)

### "Methods"

- Create by name
	- Asking for a new one by name will overwrite any existing array by that name. Thus, should use same pattern as `command _ = ...` and `alias _ = ...` since their overwriting behavior is similar
	- Q. Initialized values?
		- Real? `array arrayName = [1,2,3,4]` is what the encoder sees?
			- NO! Complex args in the bytecode only works with COPY_SCRIPT find-and-replace because it's done pre-bytecode, and with lights because they're a single bit in (I'm assuming) a `u32`; cannot possibly store any useful quantity of these in the action itself
		- Fake? `array arrayName = [1,2,3,4]` could be sugar for:
			- `array arrayName;`
			- `array.push(1);`
			- `array.push(2);`
			- `array.push(3);`
			- `array.push(4);`
			- Thus, could do vars easily: `array arrayName = [1,2,3,four]`
- Destroy by name
	- `delete array arrayName;`
- Push fixed value or variable name
	- `arrayName.push(100);`
	- `arrayName.push(varName);`
- PushLeft fixed value or variable value
	- .pushLeft or .push_left? I guess I've been using underscores for things like warp_state, thus we'll use .push_left
	- `arrayName.push_left(100);`
	- `arrayName.push_left(varName);`
- Pop (RETURN)
	- `arrayName.pop();`
	- `destinationVar = arrayName.pop();`
	- `entity y = arrayName.pop() * 30;`
- PopLeft (RETURN)
	- `arrayName.pop_left();`
	- `destinationVar = arrayName.pop_left();`
	- `entity y = arrayName.pop_left() * 30;`
- Get length (RETURN)
	- Make it look like a method call and not a property:
	- `arrayName.length()`
	- `varName = arrayName.length();`
- Copy value at fixed index from/into variable (RETURN)
	- `varName = arrayName[100];`
	- `arrayName[100] = varName;`
- Copy value at variable index from/into Variable (RETURN)
	- `varName = arrayName[indexVar];`
	- `arrayName[indexVar] = varName;`
- Reverse
	- Prob reverse in place
	- `arrayName.reverse();`
- Sort (up/down)
	- Prob sort in place
	- It's numbers, so there's only two sorts that make sense
	- Two methods?
		- `arrayName.sortAsc();`
		- `arrayName.sortDesc();`
	- Or just use sort and reverse if you want a reverse sort? (I like this one)
		- `arrayName.sort();`
		- `arrayName.reverse();`
- Slice into new Array (fixed indices)
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
	- Q. `.push(1,2,3,4)` or `.push([1,2,3,4])`?
		- The latter, because a variable number of args isn't something we have, but the "spread operation" (which looks like an array) is something we do have other places
- Splice?
	- Probably should be real; that would be harder to fake vs some of this other stuff.
	- Just do whatever JS does IDK
- ForEach
	- NO! We can use a `for` loop and use the indices if we need...
	- NO WAIT WE COULD TOTALLY DO THIS ON THE LANGUAGE LEVEL -- just can't have named functions go inside OR COULD WE? HOLY COW WE CAN
- Map
	- DITTO
- Zipper
	- SURE WHY NOT
- Windows
	- I LOVE THIS I WANT THIS IN JS GIMME IT
- Fold/reduce
	- ALL THE THINGS

### Not real things

#### Daisy chaining

- What about things like `arr.sort().map(multByTen).reverse()`
	- Could become
		- `arr.sort();`
		- `arr.map(multByTen);`
		- `arr.reverse();`
	- easily enough.

#### For each / map

- Okay, how would we actually do this?

```
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
```
array arr = [4,2,1,7,5]
	.sort()
	.map(($n) { return $n * 10; })
	.reverse();

// INTERMEDIATE SHAPE:

array arr;
arr.push(4);
arr.push(2);
arr.push(1);
arr.push(7);
arr.push(5);
arr.sort();
// MAP
fn autoGeneratedLambda ($n, $i, $a) { return $n * 10; }
// (^^ at this point you'd add the lambda to the fn lists)
array arr2;
temp1 = arr.length();
for (temp2 = 0; temp2 < temp1; temp2 += 1) {
	temp3 = arr[temp2];
	temp4 = autoGeneratedLambda(temp3, temp2, arr);
	arr.push(temp4);
}
arr = arr2.slice();
delete array arr2;
// MAP OVER
arr.reverse();
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
