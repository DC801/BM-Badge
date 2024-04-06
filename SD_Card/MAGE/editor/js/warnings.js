// this is where you add new checks for the warnings system
// ("Additional reports about the build") in the GUI
// a check function returns null if no problem is found with an entity,
// and a string warning message if there is a problem
var warningChecks = {
	checkInteractScript: function(compositeEntity) {
		return checkMapEntityPropertyPresent(compositeEntity, 'on_interact');
	},
	checkLookScript: function(compositeEntity) {
		return checkMapEntityPropertyPresent(compositeEntity, 'on_look');
	},
	checkNamePresent: function(compositeEntity) {
		if (
			compositeEntity.name === undefined
			|| compositeEntity.name === null
			|| ! (compositeEntity.name.replace(/\s/g, '').length)
		) {
			return `${compositeEntity.name || "NO NAME"} (id ${compositeEntity.id}) needs a name in the map file`;
		} else {
			return null; // no problem found
		}
	}
};

// this is where you add new fix generator functions for the warning system,
// using the same keys as in warningChecks above; a check there does not necessarily
// need to have a fix generator. a fix generator returns an array of zero or more fixes
var warningFixGenerators = {
	checkInteractScript: function(...TODO) {
		return ['fix 1', 'fix 2'];
	}
};

// utilities for making warning check functions
var checkMapEntityPropertyPresent = function(compositeEntity, propertyToCheck, checkPlayerEntity = false) {
	if (
		! checkPlayerEntity
		&& compositeEntity.properties
		&& compositeEntity.properties.some(function(property) {
			return (property.name === 'is_player') && (property.value === true);
		})
	) {
		return null; // no problem found because this is the player, who we're skipping
	}
	
	if (
		compositeEntity.properties
		&& compositeEntity.properties.some(function(property) {
			return property.name === propertyToCheck;
		}
	)) {
		return null; // no problem found
	} else {
		return `${compositeEntity.name || "NO NAME"} (id ${compositeEntity.id}) needs a ${propertyToCheck} script`;
	}
};
