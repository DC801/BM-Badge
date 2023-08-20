#!/usr/bin/env python3

# Generate sine table as a C array
# of cm_Int16 for badge game

# Do actual generation of 16-bit signed values
def gen_sine_values(size: int) -> [int]:
    import math
    delta = 2 * math.pi / size
    INT16_MAX = 32767
    return [int(INT16_MAX * math.sin(delta * i)) for i in range(size)]

def c_array_row(row: [int]) -> str:
    return ','.join([hex(i) for i in row])

def main():
    import argparse
    parser = argparse.ArgumentParser(
            description='Tool to generate sine tables of a given size for wave generation')
    parser.add_argument('size', type=int)
    args = parser.parse_args()
    values = gen_sine_values(args.size)
    ROW_WIDTH = 16
    i = 0
    for i in range(0, len(values), ROW_WIDTH):
        print(c_array_row(values[i:i+ROW_WIDTH]) + ',')

if __name__ == '__main__':
    main()
