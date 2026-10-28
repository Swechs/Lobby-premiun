# Kurulum, yayın ve QR

## 1. Çalışır yerel sürüm

Node.js 24+, `node standalone/setup-admin.mjs`, ardından `node standalone/server.mjs`. Varsayılan port 4317; yalnızca loopback dinlenir. Menüye giriş gerekmez; yönetim gerçek parola ve sunucu oturumuyla korunur. Bu sürüm hiçbir npm paketi kurmadan çalışır.

## 2. Node sunucusunda kalıcı HTTPS yayını

Bir Node 24 sunucusu veya kalıcı disk bağlanabilen konteyner barındırıcısı gerekir. Aşağıdaki isimler ortam değişkenidir; hiçbir yer tutucu adres gerçek yayın adresi değildir.

| Değişken | Değer |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` (yalnızca barındırma ağı/proxy arkasında) |
| `PORT` | Barındırıcının verdiği port, Docker için `8080` |
| `PUBLIC_ORIGIN` | Kullanıcının seçtiği gerçek HTTPS menü origin’i; sonunda `/` olmadan |
| `LOBBY_DATA_DIR` | Kalıcı diskin uygulama içindeki dizini |
| `ADMIN_PASSWORD_HASH` | İsteğe bağlı gizli JSON: `salt` ve `hash`; düz parola değildir |

Projeyi yükleyin ve kalıcı diski bağlayın. Aynı kalıcı dizinle `node standalone/setup-admin.mjs` çalıştırarak yönetici parolanızı kendiniz belirleyin; bu işlem `admin.json` içine yalnızca scrypt özeti yazar. Sonra sunucuyu `node standalone/server.mjs` ile başlatın. Dockerfile sağlanmıştır; `PUBLIC_ORIGIN` ve kalıcı disk yapılandırması yapılmadan üretim için başlatmayın.

HTTPS’i ters proxy veya barındırıcının TLS katmanıyla sonlandırın. Uygulamayı doğrudan düz HTTP ile internete açmayın. `PUBLIC_ORIGIN` gerçek adresle birebir eşleşmelidir; Origin kontrolü farklı adresten gelen yönetim işlemlerini reddeder. Yönetici çerezi üretimde Secure, HttpOnly ve SameSite=Strict olur. HTTPS bağlantısı sabit kalmalıdır.

Parola/oturum verisini, SQLite dosyalarını veya çalışma dizinini statik dosya sunucusuna koymayın. Uygulama yalnızca izin verilen tasarım dosyalarını servis eder. `LOBBY_DATA_DIR` klasörünü sunucu durmuşken yedekleyin; uygulama çalışırken WAL dosyalarını bağımsız kopyalayarak yedek oluşturmayın. Başlangıç ve güncel JSON dışa aktarmaları yönetim panelinde bulunur.

## 3. Sites yoluyla yayın

Mevcut Sites proje kimliği `.openai/hosting.json` içindedir. Yeni Site oluşturmadan mevcut projeyi kullanın. D1 bağlama adı `DB`, R2 kullanılmıyor. Şema `db/schema.ts`, başlangıç SQL’i `drizzle/0000_lobby_menu.sql` içinde. Veri aktarımı SQL migrasyonundan ayrıdır; ilk menü isteğinde tek seferlik, üzerine yazmayan aktarım yapılır.

Ağ erişimi olan ortamda proje bağımlılıklarını kilit dosyasından kurun. Sites yönergelerindeki installer/build/source helper akışını kullanın; bağımsız geliştirme için `npm ci`, `npm run build`, `npm run dev` komutları sağlanmıştır. Mevcut migration geçmişini tekrar üretmeyin; ileride şema değiştirildiğinde yeni migration ekleyin.

Sunucu gizli ortam değeri `ADMIN_EMAILS` yetkili hesabın e-postası olmalıdır. Sites girişi kimliği doğrular; her yönetim isteğinde sunucudaki izin listesi ayrıca denetlenir. Yerel Sites geliştirme girişi yalnızca geliştirme ortamında `seedy@sites.test` hesabını taklit eder; üretim girişi değildir. Test için bu e-posta sadece yerel `.dev.vars` içine yazılabilir. İzin listesine herkesi veya joker karakter eklemeyin.

Site yeni oluşturulduğu için henüz özel/başlangıç durumundadır. Kullanıcının bu briefte istediği hesap gerektirmeyen genel menü yayını için ziyaretçi erişimi herkese açık hale getirilmelidir; yönetim izni bundan ayrı tutulmalıdır. Kaynak deposuna aktarım, sürüm kaydetme ve dağıtım başarıyla tamamlanmadan adresi yayınlanmış kabul etmeyin.

## 4. Yayın kabul kontrolü

- Gerçek HTTPS adresini oturum kapalı bir tarayıcıda açın; menü hesabız görünmeli.
- 320, 375, 768 ve 1440 px genişliklerde yatay taşma ve uzun ürün adlarını kontrol edin.
- Klavyeyle arama, kategoriler penceresi, odak sırası ve Escape ile kapanmayı kontrol edin.
- `ÇİLEKLİ`, `SICAK`, `KUŞBURNU`, açıklamadaki kelimeler ve boş sonuç aramalarını deneyin.
- 9 tatlı ve 3 sandviç fiyatının boş olduğunu doğrulayın.
- Oturum kapalıyken yönetim API’lerinin 403 döndüğünü doğrulayın; başka hesaba izin verilmediğini kontrol edin.
- Yetkili girişten sonra test fiyatını kuruşlu değiştirin; ayrı ziyaretçi oturumunda ve sunucu yeniden başladıktan sonra kontrol edin. Test fiyatını kaynağa geri döndürün. Fiyat temizlemeyi ayrıca deneyin.
- Dolu fiyatları, adları, açıklamaları ve kategori notunu dışa aktarılan JSON’la kontrol edin.

## 5. QR dosyaları

Nihai URL bilinmediği için QR dosyası üretilmedi. Geçici, özel, yerel veya tahmini URL’yi basmayın.

Python bulunan ortamda yalnızca üretim aşamasında:

```sh
python -m pip install "qrcode[pil]"
python scripts/generate-qr.py --confirmed-public-url GERCEK_HTTPS_MENU_ADRESI
```

`GERCEK_HTTPS_MENU_ADRESI` yer tutucudur, olduğu gibi kullanmayın. Script HTTPS yanıtını kontrol eder; `qr/lobby-menu-qr.svg` ve `qr/lobby-menu-qr.png` oluşturur. Dört modüllük sessiz kenar ve modül başına 40 piksel korunur. Dosyalar aynı sabit URL’ye gider. Menü fiyatları değişirken QR değişmez.

Basımdan önce en az bir gerçek telefonda hem Wi-Fi hem mobil veriyle okutun; menünün giriş olmadan açıldığını kontrol edin. Tarayıcı/masaüstü çözümleme testi gerçek telefon testinin yerine geçmez.
