#! /usr/bin/env python3

import os
import sys
import json

# NOTE: checks to run can be added here
checks = [
    {
        'check_name': 'interact script',
        'property_name': 'on_interact'
    },
    {
        'check_name': 'look script',
        'property_name': 'on_look'
    }
]

def debug_to_stderr(*args, **kwargs):
    DEBUG = True
    # DEBUG = False

    print(*args, **kwargs, file=sys.stderr)


def extract_entities(map_file):
    map_data = json.load(map_file)
    entities_layers = [layer for layer in map_data['layers'] if layer['type'] == 'objectgroup']
    
    # NOTE: any entities inside layer groups will be ignored

    entities = []
    for entities_layer in entities_layers:
        entities.extend(entities_layer['objects'])

    return sorted(entities, key=lambda entity: entity['name']) # TODO sorted too much performance hit?


mgs_dir = os.path.join(os.getcwd(), 'scenario_source_files/mgs')
mgs_files = []
for root, folder, files in os.walk(mgs_dir): # relative to this script living in SD_CARD/mage
    for file in files:
        if file.endswith('.mgs'):
            mgs_files.append(os.path.join(root, file))

def find_script_definition(script_name):
    for mgs_file_path in mgs_files:
        res = False
        with open(mgs_file_path, 'r') as mgs_file:
            return script_name in mgs_file.read()
        
            # for line in mgs_file:
            #     if script_name in line:
            #         return True


def check_entity(entity):
    # generate informative messages on what's missing
    failed_checks_messages = []

    for check in checks:
        script_name = ''
        found_script_definition = False
        
        if 'properties' in entity:
            for property in entity['properties']:
                if property['name'] == check['property_name']:
                    script_name = property['value']
                    if (find_script_definition(script_name)):
                        found_script_definition = True
        
        if found_script_definition:
            return # no output needed
        
        entity_name = entity['name'] or '(NO NAME ENTITY)'
        entity_id = entity['id']
        fail_message = check['check_name']
        if script_name: # a script name is present in map data but never defined in mgs folder
            fail_message += f' (map file promised \'{script_name}\') '
        else: # script name is not even present
            fail_message += ' (map file has no binding)'

        failed_checks_messages.append(fail_message)

    # print out the messages
    if not failed_checks_messages:
        return # no output needed
    
    global num_entities
    num_entities += 1
    
    print(f'    {entity_name} (#{entity_id}) needs:')
    for fail_message in failed_checks_messages:
        print(f'        {fail_message}')





### main work

# get all map files
map_dir = os.path.join(os.getcwd(), 'scenario_source_files/maps') # relative to this script living in SD_CARD/mage

blacklisted_files = ['map-16px_dungeon.json', 'map-action_testing_01.json', 'map-action_testing_02.json', 'map-bakery.json', 'map-bling-dc801.json', 'map-bling-digi-mage.json', 'map-bling-qr.json', 'map-bling-zero.json', 'map-bobsclub.json', 'map-credits.json', 'map-credits2.json', 'map-demo.json', 'map-dialog_codec.json', 'map-dialog_moon.json', 'map-family.json', 'map-flying-toasters.json', 'map-greenhouse.json', 'map-lodge.json', 'map-magehouse-birthday.json', 'map-magehouse.json', 'map-main.json', 'map-main2.json', 'map-main_menu.json', 'map-mini_dungeon.json', 'map-oldcouplehouse.json', 'map-secretroom.json', 'map-test.json', 'map-testbig.json', 'map-town.json', 'map-warp_zone.json', 'map-woprhouse.json']
# TODO use a predicate function instead? e.g. positive string match 'ch2'

map_dir_contents = [os.path.join(map_dir, f) for f in sorted(os.listdir(map_dir)) if f not in blacklisted_files]
map_file_paths = [f for f in map_dir_contents if os.path.isfile(os.path.join(map_dir, f))]

# extract entities out of each file
num_entities = 0

for map_file_path in map_file_paths:
    map_file_basename = os.path.basename(map_file_path)

    with open(map_file_path, 'r') as map_file:
        map_file_entities = extract_entities(map_file)

    print(f'{len(map_file_entities):<3} entities in {map_file_basename}')

    for entity in map_file_entities:
        check_entity(entity)
    
    print()

print('')
print(f'Found issues with {num_entities} total entities')
