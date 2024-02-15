#! /usr/bin/env python3

import os
import sys
import json

'''
TODO

gameengine prettier mage_command_control.cpp:185
- commandResponseBuffer += "\"" + subject + "\" is not a valid entity name.\n";

ask Mary for a pattern for "TODO" script definitions
- <m> true names
- newline then space at end?

move look scripts not in the look scripts file? e.g. see ch2-castle-34.mgs
- (also naming of script look-ch2-castle-34 but it's really for the pantry?)

generating script names
---
nice indenting to be able to paste into maps
what to do with a no-name entity?
check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)

find out where the code for look command is. does it string match the actual entity name or is there somewhere else the mapping is specified?
find out if it's ok for entities to have no name in map files
find out if nativlang stipulates mgs files are ASCII encoded? most all scenario files here seems to be ASCII. maybe just from the VSCode most everyone uses

programmaticaly detect entities that don't need scripts? if not just a static blacklist so they're not in the output
generate script names and/or scripts for us when finding issues?
use a predicate function for blacklisted_files? e.g. positive string match 'ch2'
allow checks to be functions for more advanced checking framework? overall CI/CD conversation
use nativlang parser JSON output to check for script definition rather than string searching mgs files (script could be referenced rather than defined, resulting in false negative for issues)
'''

# NOTE: checks to run can be added here
checks = [
    {
        'check_name': 'interact script',
        'property_name': 'on_interact',
        'script_prefix': 'interact-ch2'
    },
    {
        'check_name': 'look script',
        'property_name': 'on_look',
        'script_prefix': 'look-ch2'
    }
]

def debug_to_stderr(*args, **kwargs):
    '''print, but to stderr. DEBUG variable disables this for the whole script when False'''

    DEBUG = True
    # DEBUG = False

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

    return sorted(entities, key=lambda entity: entity['name']) # TODO sorted too much performance hit?


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
        with open(mgs_file_path, encoding='utf-8') as mgs_file:
            if script_name in mgs_file.read():
                return True

    return False


def check_entity(entity):
    '''return hierarchically indented string which is a human-readable report of
    the issues with the given entity when running the checks specified at the top of the script'''

    # return early and do nothing if the entity is some type other than a tile (has no 'gid' field)
    if 'gid' not in entity:
        return ''

    # generate informative messages on what's missing
    failed_check_messages = []

    for check in checks:
        script_name = ''
        found_script_definition = False
        
        for property in entity.get('properties', {}):
            if property['name'] == check['property_name']:
                script_name = property['value']
                if find_script_definition(script_name):
                    found_script_definition = True
                break # no need to check further properties for this particular check
        
        if found_script_definition:
            continue # no output needed for this check. found_script_definition being true implies script_name is also set
        
        fail_message = check['check_name'] # the check's name serves as the beginning of the fail message
        if script_name: # a script name is present in map data but never defined in mgs folder
            global num_undefined_scripts
            num_undefined_scripts += 1
            fail_message += f' (map file gives \'{script_name}\' but no definition)'

        failed_check_messages.append(fail_message)

    # combine the messages into one string
    if not failed_check_messages:
        return '' # no output needed - entity passed every check. don't add to the message to be printed or increment counts
    
    global num_problem_entities
    num_problem_entities += 1

    entity_name = entity['name']
    if not entity_name:
        entity_name = 'NO-NAME ENTITY'
        global num_no_name_entities
        num_no_name_entities += 1
    
    result = f'    {entity_name} (#{entity["id"]}) needs:\n'
    for failed_check_message in failed_check_messages:
        result += f'        {failed_check_message}\n'

    debug_to_stderr(generate_script_names(entity))
    debug_to_stderr(generate_script_definitions(entity))

    return result


def generate_script_names(entity):
    'return properties field that can be placed into a map file to fix missing script names'
    
    entity_name = entity.get('name', 'NO-NAME')
    script_specifications = []

    for check in checks:
        script_specifications.append(f'''{{
            "name":"{check['property_name']}",
            "type":"string",
            "value":"{check['script_prefix']}-{entity_name.lower()}"
        }}''')

    newline = '\n' # format strings don't like newlines inside of expressions
    return f'''"properties":[
        {newline.join(script_specifications)}
    ],'''


def generate_script_definitions(entity):
    'return no-op mgs (natlang) placeholder script that can be placed into an mgs file to fix missing script definitions'

    entity_name = entity.get('name', 'NO-NAME')
    script_definitions = []

    for check in checks:
        # script_definitions.append(
        #     f'''{check['script_prefix']}-{entity_name.lower()} {{
	    #         show dialog {{
        # 		    PLAYER "TODO"
	    #         }}
        #     }}''')

        script_definitions.append(
            f'''{check['script_prefix']}-{entity_name.lower()} {{
                show serial dialog spacer;
                show serial dialog {{
                    "You looked at <m>%TODO%</>."
                    "TODO: {entity_name.upper()} on_look text\\n "
		        }}
            }}''')

    return '\n\n'.join(script_definitions)
    





### main work

# get all map files
blacklisted_files = ['map-16px_dungeon.json', 'map-action_testing_01.json', 'map-action_testing_02.json', 'map-bakery.json', 'map-bling-dc801.json', 'map-bling-digi-mage.json', 'map-bling-qr.json', 'map-bling-zero.json', 'map-bobsclub.json', 'map-credits.json', 'map-credits2.json', 'map-demo.json', 'map-dialog_codec.json', 'map-dialog_moon.json', 'map-family.json', 'map-flying-toasters.json', 'map-greenhouse.json', 'map-lodge.json', 'map-magehouse-birthday.json', 'map-magehouse.json', 'map-main.json', 'map-main2.json', 'map-main_menu.json', 'map-mini_dungeon.json', 'map-oldcouplehouse.json', 'map-secretroom.json', 'map-test.json', 'map-testbig.json', 'map-town.json', 'map-warp_zone.json', 'map-woprhouse.json']

this_script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
map_dir = os.path.join(this_script_dir, 'scenario_source_files/maps')
map_dir_contents = [os.path.join(map_dir, f) for f in sorted(os.listdir(map_dir)) if f not in blacklisted_files]
map_file_paths = [f for f in map_dir_contents if os.path.isfile(f)]

# extract entities out of each file
num_problem_maps = 0
num_problem_entities = 0
num_no_name_entities = 0
num_undefined_scripts = 0

for map_file_path in map_file_paths:
    map_file_basename = os.path.basename(map_file_path)

    with open(map_file_path, encoding='utf-8') as map_file:
        map_file_entities = extract_entities(map_file)

    map_problem_message = ''

    # report issues found with each entity
    for entity in map_file_entities:
        map_problem_message += check_entity(entity)

    if not map_problem_message:
        continue # no output needed for the entire map, don't print map filename or increment counts

    num_problem_maps += 1
    print(map_file_basename)
    print(map_problem_message)
    

print(f'Found issues with {num_problem_entities} total entities in {num_problem_maps} total maps')
print(f'Found {num_undefined_scripts} total scripts that never got defined')
print(f'Found {num_no_name_entities} total entities with no name')
