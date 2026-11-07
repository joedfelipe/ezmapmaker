from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
size=1024
image=Image.new('RGBA',(size,size),(0,0,0,0))
mask=Image.new('L',(size,size),0)
ImageDraw.Draw(mask).rounded_rectangle((48,48,976,976),radius=210,fill=255)
gradient=Image.new('RGBA',(size,size))
p=gradient.load()
for y in range(size):
 for x in range(size):
  t=(x+y)/(2*(size-1))
  p[x,y]=(round(7*(1-t)),round(152*(1-t)+191*t),round(212*(1-t)+111*t),255)
image.paste(gradient,(0,0),mask)
draw=ImageDraw.Draw(image)
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',390)
draw.text((512,475),'Ez',font=font,fill='white',anchor='mm')
draw.line((275,725,748,725),fill=(225,255,238),width=20)
image.save('build/icon.png')
image.save('build/icon.icns')
image.save('build/icon.ico',sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
iconset=Path('build/icon.iconset');iconset.mkdir(exist_ok=True)
for n in (16,32,128,256,512):
 image.resize((n,n),Image.Resampling.LANCZOS).save(iconset/f'icon_{n}x{n}.png')
 image.resize((n*2,n*2),Image.Resampling.LANCZOS).save(iconset/f'icon_{n}x{n}@2x.png')
