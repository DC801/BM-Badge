#!/usr/bin/python

import sys, os
from PIL import Image


def con(inf, of):
   print(inf, "->", of)
   im = Image.open(inf)
   if im.mode == "RGB":
       pixelSize = 3
   elif im.mode == "RGBA":
       pixelSize = 4
   else:
     print ('not supported pixel mode: "%s"' % (im.mode))
     return

   pixels = im.tostring()
   pixels2 = ""
   pixels3 = []
   for i in range(0, len(pixels) - 1, pixelSize):
       pixels2 += chr(ord(pixels[i + 2]) >> 3 | (ord(pixels[i + 1]) << 3 & 0xe0))
       pixels2 += chr(ord(pixels[i]) & 0xf8 | (ord(pixels[i + 1]) >> 5 & 0x07))
       pixels3.append( ((ord(pixels[i])>>3)<<11) | ((ord(pixels[i+1])>>2)<<5) | (ord(pixels[i+2])>>3))
   with open(of, "a") as out:
      print os.path.basename(of).split('.')[0]
      out.write("const uint16_t %s_raw[] = {"%(os.path.basename(inf).split('.')[0]))
      for i in range(len(pixels3)):
        if (i%16)==0:
          out.write("\n\t")
        out.write("0x%04X, "%(pixels3[i]))
      out.write("\n\t};\n\n")

if len(sys.argv) == 3:
    # print "\nReading: " + sys.argv[1]
    con(sys.argv[1], sys.argv[2])
else:
    print "Usage: png2fb.py infile outfile"
    sys.exit(1)

