#! /usr/bin/env python3

import os
import sys
import json

'''
TODO

prioritize web build? lets us export a txt for full report and as many as we want for fixes while keeping to a short summary for CLI build (ask...)

how will look work for multiple entities of the same or similar names (eg bread, torch)

check for script definitions in JSON files as well as MGS files (there are a couple)

gameengine prettier mage_command_control.cpp:185
- commandResponseBuffer += "\"" + subject + "\" is not a valid entity name.\n";

ask Mary for a pattern for "TODO" script definitions
- <m> true names
- newline then space at end?

move look scripts not in the look scripts file? e.g. see ch2-castle-34.mgs
- (also naming of script look-ch2-castle-34 but it's really for the pantry?)

find out where the code for look command is. does it string match the actual entity name or is there somewhere else the mapping is specified?

use a predicate function for blacklisted_files? e.g. positive string match 'ch2'

generating script names
---
nice indenting to be able to paste into maps
what to do with a no-name entity?
check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)
'''

# NOTE: checks to run can be added here
# write a function consuming an entity as from the map files and returning None if good or a string message if bad (X in "Bob needs X")

def check_interact_script(entity):
    property_name = 'on_interact'

    script_name = ''
    found_script_definition = False
    
    for property in entity.get('properties', {}):
        if property['name'] == property_name:
            script_name = property['value']
            if find_script_definition(script_name):
                found_script_definition = True
            break # no need to search for the right property object more after finding it once
    
    if found_script_definition:
        return None # no problem found for this check. note found_script_definition being true implies script_name is also set

    result = f'a {property_name} script'

    if script_name: # a script name is present in map data but never defined in mgs folder
        global num_undefined_scripts
        num_undefined_scripts += 1

        result += f' (UNDEFINED: script \'{script_name}\' expected from the map file is never defined)'
    
    return result


def check_look_script(entity):
    property_name = 'on_look'

    script_name = ''
    found_script_definition = False
    
    for property in entity.get('properties', {}):
        if property['name'] == property_name:
            script_name = property['value']
            if find_script_definition(script_name):
                found_script_definition = True
            break # no need to search for the right property object more after finding it once
    
    if found_script_definition:
        return None # no problem found for this check. note found_script_definition being true implies script_name is also set

    result = f'a {property_name} script'

    if script_name: # a script name is present in map data but never defined in mgs folder
        global num_undefined_scripts
        num_undefined_scripts += 1

        result += f' (UNDEFINED: name \'{script_name}\' given in map is never defined)'
    
    return result


def check_name_present(entity):
    entity_name = ''.join(filter(lambda x: not x.isspace(), entity['name'])) # remove whitespace to see if there's anything left
    if entity_name:
        return None
    else:
        return 'a name in the map file'


# end area for adding checks

checks = [check_interact_script, check_look_script, check_name_present]
check_failure_count = {check.__name__ : 0 for check in checks}


this_script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
num_undefined_scripts = 0


def debug_to_stderr(*args, **kwargs):
    '''print, but to stderr. DEBUG variable disables this for the whole script when False'''

    DEBUG = True
    DEBUG = False

    if not DEBUG:
        return

    print(*args, **kwargs, file=sys.stderr)


def extract_entities(map_file):
    '''return array of entities for a given map file. ignore layer groups.
    combine entities of different objectgroup layers into one array'''
    
    map_data = json.load(map_file)
    entities_layers = [layer for layer in map_data['layers'] if layer['type'] == 'objectgroup']
    
    # NOTE: any entities inside layer groups will be ignored

    entities = []
    for entities_layer in entities_layers:
        entities.extend(entities_layer['objects'])

    return sorted(entities, key=lambda entity: entity['name'])


mgs_files = []
def find_script_definition(script_name):
    '''return bool of whether the given script name exists in an mgs file anywhere under the mgs folder'''

    # setup to run once
    if not mgs_files:
        for root, _, files in os.walk(os.path.join(this_script_dir, 'scenario_source_files/mgs')):
            for file in files:
                if file.endswith('.mgs'):
                    mgs_files.append(os.path.join(root, file))

    # find a script definition
    for mgs_file_path in mgs_files:
        with open(mgs_file_path) as mgs_file:
            if script_name in mgs_file.read():
                return True

    return False


def check_entity(entity):
    '''return report of the issues with the given entity considering all checks specified at the top of the script
    
    caller should be careful not to use any returned information if there are no items in the 'problems' array member of the result,
    as non-tile entities can cause members 'name' and 'id' of result to be empty strings'''

    # return early and do nothing if the entity is some type other than a tile
    if 'gid' not in entity:
        return {
            'problems': []
        }

    result = {
        'name': entity['name'],
        'id': entity['id'],
        'problems': []
    }

    for check in checks:
        problem = check(entity)

        if problem is not None:
            result['problems'].append(problem)
            check_failure_count[check.__name__] += 1

    if result['problems']:
        # TODO generate fixes
        # generate_script_names(entity)
        # generate_script_definitions(entity)
        pass

    return result


# def generate_script_names(entity):
#     'return properties field that can be placed into a map file to fix missing script names'
    
#     entity_name = entity.get('name', 'NO-NAME')
#     script_specifications = []

#     prefix = '' # TODO let checks handle generation themselves, or some function at least

#     for check in checks:
#         script_specifications.append(f'''{{
#             "name":"{check['property_name']}",
#             "type":"string",
#             "value":"{prefix}-{entity_name.lower()}"
#         }}''')

#     newline = '\n' # format strings don't like newlines inside of expressions
#     return f'''"properties":[
#         {newline.join(script_specifications)}
#     ],'''


# def generate_script_definitions(entity):
#     'return natlang placeholder script that can be placed into an mgs file to fix missing script definitions'

#     entity_name = entity.get('name', 'NO-NAME')
#     script_definitions = []

#     prefix = '' # TODO let checks handle generation themselves, or some function at least

#     for check in checks:
#         # script_definitions.append(
#         #     f'''{prefix}-{entity_name.lower()} {{
# 	    #         show dialog {{
#         # 		    PLAYER "TODO"
# 	    #         }}
#         #     }}''')

#         script_definitions.append(
#             f'''{prefix}-{entity_name.lower()} {{
#                 show serial dialog spacer;
#                 show serial dialog {{
#                     "You looked at <m>%TODO%</>."
#                     "TODO: {entity_name.upper()} on_look text\\n "
# 		        }}
#             }}''')

#     return '\n\n'.join(script_definitions)
    

def find_problems():
    '''return a representation of all entity problems found in the codebase, as dict from string for map file's path to (array of (dict returned by check_entity))'''

    result = {}

    # get all map files
    blacklisted_files = ['map-16px_dungeon.json', 'map-action_testing_01.json', 'map-action_testing_02.json', 'map-bakery.json', 'map-bling-dc801.json', 'map-bling-digi-mage.json', 'map-bling-qr.json', 'map-bling-zero.json', 'map-bobsclub.json', 'map-credits.json', 'map-credits2.json', 'map-demo.json', 'map-dialog_codec.json', 'map-dialog_moon.json', 'map-family.json', 'map-flying-toasters.json', 'map-greenhouse.json', 'map-lodge.json', 'map-magehouse-birthday.json', 'map-magehouse.json', 'map-main.json', 'map-main2.json', 'map-main_menu.json', 'map-mini_dungeon.json', 'map-oldcouplehouse.json', 'map-secretroom.json', 'map-test.json', 'map-testbig.json', 'map-town.json', 'map-warp_zone.json', 'map-woprhouse.json']
    map_dir = os.path.join(this_script_dir, 'scenario_source_files/maps')
    map_dir_contents = [os.path.join(map_dir, f) for f in sorted(os.listdir(map_dir)) if f not in blacklisted_files]
    map_file_paths = [f for f in map_dir_contents if os.path.isfile(f)]

    # populate global variable problems with the issues found
    for map_file_path in map_file_paths:
        with open(map_file_path) as map_file:
            map_file_entities = extract_entities(map_file)

        map_problems = []
        for entity in map_file_entities:
            entity_problems = check_entity(entity)
            if entity_problems['problems']:
                map_problems.append(entity_problems)

        if map_problems:
            result[map_file_path] = map_problems
    
    return result


# print out final report
problems = find_problems()
for map_file_path in sorted(problems.keys()):
    map_problems = problems[map_file_path]
    print(os.path.basename(map_file_path))

    for entity in map_problems:
        print(f'    {entity["name"] or "NO NAME"} (id {entity["id"]}) needs:')
        print('\n'.join([f'        {problem}' for problem in entity['problems']]))
    print()

for check in check_failure_count:
    print(f'Found {check_failure_count[check]} entities that failed check \'{check}\'')    
print(f'Found {num_undefined_scripts} total scripts never defined after being specified in map files')
print(f'Found issues with {sum(len(map_file) for map_file in problems.values())} total entities in {len(problems)} total maps')
