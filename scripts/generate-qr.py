"""Generate QR files only after the final public deployment URL is known."""
import argparse
import ipaddress
import pathlib
import urllib.parse
import urllib.request
import qrcode
import qrcode.image.svg
parser=argparse.ArgumentParser()
parser.add_argument('--confirmed-public-url',required=True)
parser.add_argument('--output',default='qr')
args=parser.parse_args()
url=args.confirmed_public_url
parts=urllib.parse.urlparse(url)
host=(parts.hostname or '').lower()
if parts.scheme!='https' or not host or parts.username or parts.password or host=='localhost' or host.endswith(('.local','.test','.example','.invalid')):
    raise SystemExit('Gerçek, yayındaki HTTPS menü adresini girin.')
try:
    address=ipaddress.ip_address(host)
except ValueError:
    address=None
if address and not address.is_global:
    raise SystemExit('Yerel veya özel IP için basılabilir QR üretilmez.')
with urllib.request.urlopen(url,timeout=20) as response:
    if response.status!=200 or '/signin' in response.geturl():
        raise SystemExit('Herkese açık menü doğrulanamadı.')
qr=qrcode.QRCode(version=None,error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=40,border=4)
qr.add_data(url);qr.make(fit=True)
output=pathlib.Path(args.output);output.mkdir(parents=True,exist_ok=True)
qr.make_image(fill_color='black',back_color='white').save(output/'lobby-menu-qr.png')
qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(output/'lobby-menu-qr.svg')
(output/'url.txt').write_text(url+'\n',encoding='utf-8')
print('SVG ve yüksek çözünürlüklü PNG oluşturuldu. Basımdan önce gerçek telefonla test edin.')
