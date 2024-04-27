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
			return `${entityNameOrNoName(compositeEntity.name) } (id ${compositeEntity.id}) needs a name in the map file`;
		} else {
			return null; // no problem found
		}
	}
};

// this is where you add new fix generator functions for the warning system,
// using the same keys as in warningChecks above; a check there does not necessarily
// need to have a fix generator. a fix generator returns an array of zero or more fixes
var warningFixGenerators = {
	checkInteractScript: function(compositeEntity) {
		var cleanEntityName = entityNameForScripts(entityNameOrNoName(compositeEntity.name));
		return {
			parameters: { // a parameter `scriptName` will be treated specially by editor-warnings.js
				scriptName: hyphenateSeveralPieces(['interact', SCRIPT_NAME_CHAPTER_INFIX, cleanEntityName]),
				testingParam: 'TODO remove me in warnings.js',
			},
			getFixes: function ({ scriptName }) {
				var scriptNameFix =
					`                 "properties":[\n` +
					`                        {\n` +
					`                         "name":"on_interact",\n` +
					`                         "type":"string",\n` +
					`                         "value":"${scriptName}"\n` +
					`                        }],\n`;
				var scriptDefinitionFix =
					`${scriptName} {\n` +
					`\tshow dialog {\n` +
					`\t\tPLAYER "TODO on_interact ${cleanEntityName}"\n` +
					`\t}\n` +
					`}\n`;
				return [scriptNameFix, scriptDefinitionFix];
			}
		};
	},
	checkLookScript: function (compositeEntity) {
		var cleanEntityName = entityNameForScripts(entityNameOrNoName(compositeEntity.name));
		return {
			parameters: { // a parameter `scriptName` will be treated specially by editor-warnings.js
				scriptName: hyphenateSeveralPieces(['look', SCRIPT_NAME_CHAPTER_INFIX, cleanEntityName]),
			},
			getFixes: function ({ scriptName }) {
				var scriptNameFix =
					`                 "properties":[\n` +
					`                        {\n` +
					`                         "name":"on_look",\n` +
					`                         "type":"string",\n` +
					`                         "value":"${scriptName}"\n` +
					`                        }],\n`;
				var scriptDefinitionFix =
					`${scriptName} {\n` +
					`\tshow serial dialog spacer;\n` +
					`\tshow serial dialog {\n` +
					`\t\t"You looked at <m>%SELF%</>."\n` +
					`\t\t"\\tTODO on_look ${cleanEntityName} (remember to add 'the' for objects)"\n` +
					`\t}\n` +
					`}\n`;
				return [scriptNameFix, scriptDefinitionFix];
			}
		};
	}
};


// for adding "-ch2-" infix to script names in generated fixes
// change occasionally
var SCRIPT_NAME_CHAPTER_INFIX = 'ch2';

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
		return `${entityNameOrNoName(compositeEntity.name)} (id ${compositeEntity.id}) needs an ${propertyToCheck} script`;
	}
};

var entityNameOrNoName = function(entityName) {
	return entityName || 'NO NAME';
};

var entityNameForScripts = function(entityName) {
	return entityName.toLowerCase().replace(/[\s-]/g, '_');
};

var hyphenateSeveralPieces = function(pieces) {
	return pieces.filter(function(piece) {
		return piece.replace(/\s/g, '').length;
	}).join('-');
};
