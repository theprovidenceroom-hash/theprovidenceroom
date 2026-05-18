from PIL import Image

in_path = '/Users/sunilsharma/.gemini/antigravity/brain/ce362f98-a61b-4476-8427-07f47725fb99/youtube_logo_providence_star_1779084482970.png'
out_png = 'logo.png'
out_ico = 'favicon.ico'

# Open and resize for web usage to keep the site fast
img = Image.open(in_path)
img = img.resize((128, 128), Image.Resampling.LANCZOS)
img.save(out_png)

# Create an ICO file with multiple sizes
img.save(out_ico, format='ICO', sizes=[(16,16), (32,32), (64,64), (128,128)])

print("Favicon created!")
