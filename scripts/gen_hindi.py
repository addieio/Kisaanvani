import os
from PIL import Image, ImageDraw, ImageFont

font_path = 'C:/Windows/Fonts/Nirmala.ttc'
font_title = ImageFont.truetype(font_path, 10)
font_sm = ImageFont.truetype(font_path, 9)

# Clean, concise words that fit comfortably on 128x64 display without overlap
words = [
    # Header Titles (Strictly <= 56px wide, <= 12px high)
    ('bm_krishi_agro', 'कृषि-एग्रो', font_title),
    ('bm_live_stats',  'मौसम DHT',  font_title),
    ('bm_poshak_npk',  'NPK पोषक',  font_title),
    ('bm_sinchai',     'सिंचाई पंप', font_title),
    ('bm_ai_title',    'एआई सहायक',  font_title),
    ('bm_duri_mapak',  'दूरी MPU',   font_title),

    # Body Labels & Badges
    ('bm_nami',        'नमी:',        font_title),
    ('bm_uchit',       'उचित',        font_sm),
    ('bm_sukhi',       'सूखी!',       font_sm),
    ('bm_ask_prompt',  'दबाएँ: बात करें', font_title),
    ('bm_slide_hint',  '10-20cm सरकाएं', font_sm),
    ('bm_reach_demo',  'पहुँच गए! लगाएं', font_sm),
    ('bm_resp_ok',     'नमी उत्तम है', font_sm),
    ('bm_resp_urea',   'यूरिया डालें', font_sm),
]

output_lines = []
output_lines.append("// =============================================================================")
output_lines.append("// Clean Compact Hindi Bitmaps (ESPHome-style Uncluttered Layout)")
output_lines.append("// Generated with strict boundaries: Width <= 56px, Height <= 12px for headers")
output_lines.append("// =============================================================================")
output_lines.append("#include <pgmspace.h>\n")

for name, text, fnt in words:
    bbox = fnt.getbbox(text)
    w = bbox[2] - bbox[0] + 1
    h = bbox[3] - bbox[1] + 1
    
    # Render with tight bounding box
    img = Image.new('1', (w, h), 0)
    draw = ImageDraw.Draw(img)
    draw.text((-bbox[0], -bbox[1]), text, font=fnt, fill=1)
    
    byte_w = (w + 7) // 8
    bytes_list = []
    for y in range(h):
        for bx in range(byte_w):
            b = 0
            for bit in range(8):
                px = bx * 8 + bit
                if px < w and img.getpixel((px, y)):
                    b |= (1 << (7 - bit))
            bytes_list.append(f"0x{b:02X}")
    
    output_lines.append(f"// \"{text}\" ({w}x{h})")
    output_lines.append(f"#define {name.upper()}_W {w}")
    output_lines.append(f"#define {name.upper()}_H {h}")
    output_lines.append(f"static const uint8_t {name}[] PROGMEM = {{")
    for i in range(0, len(bytes_list), 12):
        chunk = ", ".join(bytes_list[i:i+12])
        comma = "," if i + 12 < len(bytes_list) else ""
        output_lines.append(f"  {chunk}{comma}")
    output_lines.append("};\n")

# Pixel Icons: Robot, Droplet, Thermo, Wifi, Pump
icons = {
    'icon_robot_16x16': (16, 16, [
        0b0000000110000000,
        0b0000000110000000,
        0b0011111111111100,
        0b0100000000000010,
        0b0101110000111010,
        0b0101110000111010,
        0b0101110000111010,
        0b0100000000000010,
        0b0100111111110010,
        0b0101010101010010,
        0b0100000000000010,
        0b0011111111111100,
        0b0000010000100000,
        0b0000011111100000,
        0b0000111111110000,
        0b0000000000000000
    ]),
    'icon_droplet_8x8': (8, 8, [
        0b00011000,
        0b00111100,
        0b01111110,
        0b01111110,
        0b11111111,
        0b11111111,
        0b01111110,
        0b00111100
    ]),
    'icon_thermo_8x8': (8, 8, [
        0b00110000,
        0b00100000,
        0b00110000,
        0b00100000,
        0b01111000,
        0b01111000,
        0b00110000,
        0b00000000
    ]),
    'icon_wifi_8x7': (8, 7, [
        0b01111110,
        0b10000001,
        0b00111100,
        0b01000010,
        0b00011000,
        0b00000000,
        0b00011000
    ]),
    'icon_flag_8x8': (8, 8, [
        0b11111000,
        0b11110000,
        0b11111000,
        0b10000000,
        0b10000000,
        0b10000000,
        0b10000000,
        0b11111100
    ])
}

for iname, (iw, ih, rows) in icons.items():
    byte_w = (iw + 7) // 8
    bytes_list = []
    for row in rows:
        for b_idx in range(byte_w):
            shift = (byte_w - 1 - b_idx) * 8
            val = (row >> shift) & 0xFF
            bytes_list.append(f"0x{val:02X}")
    
    output_lines.append(f"// Icon: {iname} ({iw}x{ih})")
    output_lines.append(f"#define {iname.upper()}_W {iw}")
    output_lines.append(f"#define {iname.upper()}_H {ih}")
    output_lines.append(f"static const uint8_t {iname}[] PROGMEM = {{")
    for i in range(0, len(bytes_list), 12):
        chunk = ", ".join(bytes_list[i:i+12])
        comma = "," if i + 12 < len(bytes_list) else ""
        output_lines.append(f"  {chunk}{comma}")
    output_lines.append("};\n")

header_code = "\n".join(output_lines)

# Write to firmware/KrishiAgro_OLED_Standalone/hindi_bitmaps.h
target_path = r'c:\Users\adity\OneDrive\Documents\krishiagro\firmware\KrishiAgro_OLED_Standalone\hindi_bitmaps.h'
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(header_code)

print("hindi_bitmaps.h successfully updated!")
