#! /usr/bin/env python3

import os
import sys
import json

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

    return entities


### main work

# get all map files
cwd = os.getcwd()
map_dir = os.path.join(cwd, 'scenario_source_files/maps') # relative to this script living in SD_CARD/mage

blacklisted_files = ['map-16px_dungeon.json', 'map-action_testing_01.json', 'map-action_testing_02.json', 'map-bakery.json', 'map-bling-dc801.json', 'map-bling-digi-mage.json', 'map-bling-qr.json', 'map-bling-zero.json', 'map-bobsclub.json', 'map-credits.json', 'map-credits2.json', 'map-demo.json', 'map-dialog_codec.json', 'map-dialog_moon.json', 'map-family.json', 'map-flying-toasters.json', 'map-greenhouse.json', 'map-lodge.json', 'map-magehouse-birthday.json', 'map-magehouse.json', 'map-main.json', 'map-main2.json', 'map-main_menu.json', 'map-mini_dungeon.json', 'map-oldcouplehouse.json', 'map-secretroom.json', 'map-test.json', 'map-testbig.json', 'map-town.json', 'map-warp_zone.json', 'map-woprhouse.json']
# TODO use a predicate function instead? e.g. positive string match 'ch2'
map_dir_contents = [os.path.join(map_dir, f) for f in sorted(os.listdir(map_dir)) if f not in blacklisted_files]

map_file_paths = [f for f in map_dir_contents if os.path.isfile(os.path.join(map_dir, f))]

# extract entities out of map files
entities = {}

for map_file_path in map_file_paths:
    map_file_basename = os.path.basename(map_file_path)

    with open(map_file_path, 'r') as map_file:
        map_file_entities = extract_entities(map_file)
    
    print(f'{len(map_file_entities):<3} entities in {map_file_basename}')

    for entity in map_file_entities:
        entity_name = entity["name"] or '(NO NAME)'
        has_interact = False
        has_look = False

        properties = entity['properties'] if 'properties' in entity else {}
        for property in properties:
            if property['name'] == 'on_interact':
                has_interact = True
            elif property['name'] == 'on_look':
                has_look = True
        

        if has_interact and has_look:
            continue
        
        needs_message = 'needs: '
        if not has_interact:
            needs_message += 'interact '
        if not has_look:
            needs_message += 'look '
        
        print(f'\t{entity_name} {needs_message}')
    
    print()

