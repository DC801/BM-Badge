// this is where you add new check functions for the warnings system ("Additional reports about the build")

var warningChecks = {
	checkInteractScript: function(compositeEntity) {
		return checkMapEntityPropertyPresent(compositeEntity, 'on_interact');
	},
	checkLookScript: function(compositeEntity) {
		return checkMapEntityPropertyPresent(compositeEntity, 'on_look');
	},
	checkNamePresent: function(compositeEntity) {
		if (compositeEntity.name == undefined || compositeEntity.name == null || ! (compositeEntity.name.replace(/\s/g, '').length)) {
			return `${compositeEntity.name || "NO NAME"} (id ${compositeEntity.id}) needs a name in the map file`;
		} else {
			return null;
		}
	}
};

// utilities for making warning check functions
var checkMapEntityPropertyPresent = function(compositeEntity, propertyToCheck) {
	var scriptName = '';
	var foundScriptDefinition = false; // TODO

	if (! ('properties' in compositeEntity)) {
		return null;
	}

	for (var index in compositeEntity.properties) {
		var entityProperty = compositeEntity.properties[index];
		if (entityProperty.name == propertyToCheck) {
			scriptName = entityProperty.value;
			// if (findScriptDefinition(scriptName)) {
			// 	foundScriptDefinition = true;
			// } // TODO
			break; // no need to search for the right property object more after finding it
		}
	}

	if (foundScriptDefinition) {
		return null; // no problem found for this check
	} // note foundScriptDefinition being true implies scriptName is also set

	var result = `${compositeEntity.name || "NO NAME"} (id ${compositeEntity.id}) needs a ${propertyToCheck} script`;

	if (scriptName) { // a script name is present in map data but never defined in mgs folder
		// num_undefined_scripts += 1; // TODO
		result += ` (UNDEFINED: script \'${scriptName}\' expected from the map file is never defined)`;
	}

	return result;
};