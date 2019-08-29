import pygame, struct, sys, os

pygame.init()

LEFT = 1
RIGHT = 3

size = [1280, 960]

MAP_OFFX = 160
MAP_OFFY = 56

TILE_SIZE=12
TILES=10
SPACE=13

BLACK = (  0,   0,   0)
WHITE = (255, 255, 255)
GREY = (128, 128, 128)
RED = (255,0,0)

screen = pygame.display.set_mode(size)
canvas = pygame.Surface((320, 240))

pygame.display.set_caption("DC801 HCRN level maker")
tileset = pygame.image.load('tile12.png')
objectset = pygame.image.load('objects.png')
clock = pygame.time.Clock()

font = pygame.font.Font('freesansbold.ttf', 18) 

class Room:
	def __init__(self,num):
		self.idx = num
		self.data = [[SPACE for x in range(TILES)] for y in range(TILES)]
		self.flags=0
		self.objects=[(0,0,0,0), (0,0,0,0), (0,0,0,0), (0,0,0,0), (0,0,0,0), (0,0,0,0), (0,0,0,0), (0,0,0,0)]

curidx =0
at = (1,12)
rooms= {at:Room(curidx)}
curidx = curidx+1

quit = False
selected = 0

objmap = [0,0,0,0,0,0,0,0, 2,2,2,2,2,2,8,2, 0,0,9,0,0,0,8,9, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0]


#load from file
if os.path.isfile('level2.dat'):
	with open('level2.dat', 'rb') as f:
		s, v, cc, p1, p2, p3 = struct.unpack('4s2B2x3Bx', f.read(12))
		if s != b'HCRN':
			print("Invalid level file!", s)
			sys.exit(1)
		curidx = cc
		i=0
		while True:
			raw = f.read(12)
			if len(raw) != 12:
				break
			n, flags, ax, ay = struct.unpack('4sI2b2x', raw)
			r = Room(i)
			r.flags = flags
			for x in range(TILES):
				for y in range(TILES):
					r.data[x][y] = ord(f.read(1))
			for j in range(8):
				t, flags, x, y = struct.unpack('BBBB', f.read(4))
				r.objects[j] = (t,x,y,flags) 
			rooms[(ax,ay)] = r
			i+=1

def getneighbors(loc):
	return bytearray((rooms.get((loc[0],loc[1]-1),Room(0)).idx , rooms.get((loc[0],loc[1]+1),Room(0)).idx, rooms.get((loc[0]-1,loc[1]),Room(0)).idx, rooms.get((loc[0]+1,loc[1]),Room(0)).idx))

while not quit:
	for event in pygame.event.get():
		if event.type == pygame.QUIT:
			quit=True 
		if event.type == pygame.KEYDOWN:
			if event.key == pygame.K_ESCAPE or event.unicode == 'q':
				quit=True 
			if event.unicode =='s':
				with open('level2.dat', 'wb') as f:
					f.write(struct.pack('4s2B2x3Bx', b'HCRN', 1, curidx, 80, 80, 0))
					for loc, r in rooms.items():
						f.seek(12 + (TILES*TILES+44)*r.idx)
						f.write(struct.pack('4sI2b2x', bytes(getneighbors(loc)), r.flags, loc[0], loc[1]))
						for x in range(TILES):
							for y in range(TILES):
								f.write(chr(r.data[x][y]))
						for i in range(8):
							e = r.objects[i]
							f.write(struct.pack('BBBB', e[0], objmap[e[0]], e[1], e[2]))
			if event.unicode =='p':
				from PIL import Image
				tiles = Image.open('tile12.png')
				obs = Image.open('objects.png')
				bigm = Image.new('RGB', (768, 1920))
				for loc, r in rooms.items():
					for x in range(TILES):
						for y in range(TILES):
							ii = r.data[x][y]
							ix = (ii%12)*TILE_SIZE
							iy = (ii//12)*TILE_SIZE
							tt = tiles.crop((ix, iy, ix+TILE_SIZE, iy+TILE_SIZE))
							ix = loc[0]*120+x*TILE_SIZE
							iy = loc[1]*120+y*TILE_SIZE - (120*4)
							bigm.paste(tt, (ix, iy, ix+TILE_SIZE, iy+TILE_SIZE))
					for i in range(8):
						s = r.objects[i]
						sx = s[0]%8
						sy = s[0]//8
						ob = obs.crop((sx*16, sy*16, sx*16+16, sy*16+16))
						ix = loc[0]*120+s[1]
						iy = loc[1]*120+s[2] - (120*4)
						if s[0]:
							bigm.paste(ob, (ix, iy, ix+16, iy+16), ob)
				bigm.save("fullmap2.png")
				print("Full map saved")
						
			if (pygame.key.get_mods() & pygame.KMOD_SHIFT):
				if event.key == pygame.K_LEFT:
					at = (at[0]-1, at[1])
				if event.key == pygame.K_RIGHT:
					at = (at[0]+1, at[1])
				if event.key == pygame.K_UP:
					at = (at[0], at[1]-1)
				if event.key == pygame.K_DOWN:
					at = (at[0], at[1]+1)
				

		if (event.type == pygame.MOUSEBUTTONDOWN and event.button == LEFT) or (event.type == pygame.MOUSEMOTION and pygame.mouse.get_pressed()[0] and selected < 256):
			pos = pygame.mouse.get_pos()
			pos = (pos[0]//4, pos[1]//4)
			if pos[0] < 144 and pos[1] < 144:
				selected = (pos[1]//TILE_SIZE*12) + (pos[0]//TILE_SIZE)
			if pos[0] < 128 and pos[1] > 145 and pos[1] < 274:
				selected = ((pos[1]-146)//16*8) + (pos[0]//16) + 256
			if (pos[0]>MAP_OFFX) and (pos[1]>MAP_OFFY) and (pos[0]<MAP_OFFX+120) and (pos[1] < MAP_OFFY+120):
				tx = (pos[0]-MAP_OFFX)//TILE_SIZE
				ty = (pos[1]-MAP_OFFY)//TILE_SIZE
				if selected < 256:
					if not at in rooms:
						rooms[at]=Room(curidx)
						curidx = curidx+1
					rooms[at].data[tx][ty]=selected
				elif selected > 256:
					for i in range(8):
						if rooms[at].objects[i][0] == 0:
							 rooms[at].objects[i] = (selected-256, tx*TILE_SIZE, ty*TILE_SIZE, 0)
							 break
		elif (event.type == pygame.MOUSEBUTTONDOWN and event.button == RIGHT):
			pos = pygame.mouse.get_pos()
			pos = (pos[0]//4, pos[1]//4)
			if pos[0] >= MAP_OFFX and pos[0] < MAP_OFFX + TILE_SIZE * TILES and pos[1] >= MAP_OFFY + TILE_SIZE * 13 and pos[1] < MAP_OFFY + TILE_SIZE * 15:
				idx = (pos[0] - MAP_OFFX) // 16
				rooms[at].objects[idx] = (0,0,0,0)

	canvas.fill((0,0,0))
	canvas.fill((32,32,32), (144,0,320,240))
	canvas.fill((200,200,200), (0,0,144,144))

	canvas.blit(tileset, (0, 0))
	canvas.blit(objectset, (0, 146))
	pygame.draw.line(canvas, GREY, [144, 0], [144,240], 2)
	pygame.draw.line(canvas, GREY, [0, 144], [144,144], 2)
	pygame.draw.line(canvas, GREY, [0, 220], [128,220], 2)

	if selected < 144:
		sx = selected % 12
		sy = selected // 12
		pygame.draw.rect(canvas, WHITE, [sx*TILE_SIZE, sy*TILE_SIZE, TILE_SIZE, TILE_SIZE], 1)
	else:
		sx = selected % 8
		sy = (selected-184) // 8
		pygame.draw.rect(canvas, WHITE, [sx*16, sy*16 + 2, 16, 16], 1)

	if at in rooms:
		for x in range(10):
			for y in range(10):
				s = rooms[at].data[x][y]
				sx = s%12
				sy = s//12
				canvas.blit(tileset, (MAP_OFFX + (x*TILE_SIZE), MAP_OFFY + (y*TILE_SIZE)), (sx*TILE_SIZE, sy*TILE_SIZE, TILE_SIZE, TILE_SIZE))
		for i in range(8):
			s = rooms[at].objects[i]
			sx = s[0]%8
			sy = s[0]//8
			canvas.blit(objectset, (MAP_OFFX + (i*16), MAP_OFFY + (13*TILE_SIZE)), (sx*16, sy*16, 16, 16))
			if s[0]:
				canvas.blit(objectset, (MAP_OFFX + s[1], MAP_OFFY + s[2]), (sx*16, sy*16, 16, 16))
	else:
		canvas.fill((0,0,0), (MAP_OFFX, MAP_OFFY, TILE_SIZE*10,TILE_SIZE*10))
		for i in range(8):
			canvas.blit(objectset, (MAP_OFFX + (i*16), MAP_OFFY + (13*TILE_SIZE)), (0, 0, 16, 16))

	nat = (at[0]-1, at[1])
	if nat in rooms:
		for y in range(10):
			s = rooms[nat].data[9][y]
			sx = s%12
			sy = s//12
			canvas.blit(tileset, (MAP_OFFX - TILE_SIZE, MAP_OFFY + (y*TILE_SIZE)), (sx*TILE_SIZE, sy*TILE_SIZE, TILE_SIZE, TILE_SIZE))

	nat = (at[0]+1, at[1])
	if nat in rooms:
		for y in range(10):
			s = rooms[nat].data[0][y]
			sx = s%12
			sy = s//12
			canvas.blit(tileset, (MAP_OFFX + 10*TILE_SIZE, MAP_OFFY + (y*TILE_SIZE)), (sx*TILE_SIZE, sy*TILE_SIZE, TILE_SIZE, TILE_SIZE))

	nat = (at[0], at[1]-1)
	if nat in rooms:
		for x in range(10):
			s = rooms[nat].data[x][9]
			sx = s%12
			sy = s//12
			canvas.blit(tileset, (MAP_OFFX + (x*TILE_SIZE), MAP_OFFY  - TILE_SIZE), (sx*TILE_SIZE, sy*TILE_SIZE, TILE_SIZE, TILE_SIZE))

	nat = (at[0], at[1]+1)
	if nat in rooms:
		for x in range(10):
			s = rooms[nat].data[x][0]
			sx = s%12
			sy = s//12
			canvas.blit(tileset, (MAP_OFFX + (x*TILE_SIZE), MAP_OFFY + (10*TILE_SIZE)), (sx*TILE_SIZE, sy*TILE_SIZE, TILE_SIZE, TILE_SIZE))

	pygame.draw.rect(canvas, WHITE, [MAP_OFFX, MAP_OFFY, 120, 120], 1)

	pygame.transform.scale(canvas, size, screen)
	screen.fill((200,200,200), (1184,0,1280,192))
	for loc, r in rooms.items():
		for x in range(10):
			for y in range(10):
				if r.data[x][y] == 13:
					c = WHITE
				elif r.data[x][y] < 48:
					c = (0,0,60)
				elif r.data[x][y] < 96:
					c = (180,60,180)
				else:
					c = (120,120,240)
				screen.set_at((loc[0]*10+x+1184, loc[1]*10+y), c)
	pygame.draw.rect(screen, RED, [at[0]*10+1183, at[1]*10, 12, 12], 1)
	if at in rooms:
		text = font.render("Room: %d"%(rooms[at].idx), True, (255, 255, 255))
		screen.blit(text, (800, 10))
	pygame.display.update()
	clock.tick()
	#print(clock.get_fps())

pygame.quit()