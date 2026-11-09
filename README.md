# LOBBY PREMIUM LOUNGE — Web sitesi ve QR menü

Öğrenci kafesi ana sayfası, doğrulanmış Türkçe dijital menü ve kalıcı veri kullanan korumalı yönetim uygulaması.

- Ana site: https://lobby-premium-menu-preview.vercel.app
- Dijital menü: https://lobby-premium-menu-preview.vercel.app/men%C3%BC
- Depo: https://github.com/Swechs/Lobby-premiun

Ana sayfa okey, kart oyunları, yemek ve arkadaş buluşmaları odağındadır. Güncel tasarım `website/` altında geliştirilir.

## Çalıştırma — Node.js 24

Bu çalışma biçimi ek npm paketi kurmadan çalışır:

```sh
node standalone/server.mjs
```

Windows'ta `BASLAT.cmd` de kullanılabilir. Varsayılan yerel adres `http://127.0.0.1:4317` olur.

| Yol | İşlev |
| --- | --- |
| `/` | Ana web sitesi |
| `/menü` | Ziyaretçi menüsü |
| `/menu` | `/menü` yönlendirmesi |
| `/admin` | Yönetici girişi ve içerik düzenleme |

Yerel adres yalnızca uygulamanın çalıştığı bilgisayarda açılır; genel yayın adresi değildir.

## Yönetim ve kalıcı veri

Yönetici parolasını sunucuda tanımlayın:

```sh
node standalone/setup-admin.mjs
```

Windows'ta `YONETICI_PAROLASI.cmd` kullanılabilir. Parola maskelenir ve yalnızca scrypt özeti saklanır. Parola tanımlanmadan menü açılır; yönetim oturumu açılamaz.

Kategori bilgileri, ürün adları/açıklamaları, sıralama ve fiyatlar düzenlenebilir. Kaydetmeden önce alan bazlı değişiklik önizlemesi gösterilir. Fiyat temizlemek `null` kaydeder; kuruş hassasiyeti iki basamağa kadar korunur. Sürüm kontrolü eşzamanlı değişikliklerin birbirini ezmesini önler.

Kalıcı veri varsayılan olarak `.sites-runtime/standalone/menu.sqlite` içinde tutulur. `LOBBY_DATA_DIR` ile kalıcı disk konumu değiştirilebilir. İlk veri aktarımı yalnızca boş veritabanında gerçekleşir. Sunucu yeniden başlatıldığında yönetici değişiklikleri korunur.

Başlangıç verisi ve güncel veri yönetim ekranından ayrı JSON dosyaları olarak dışa aktarılır. Sabit kimlikler ve kaynak kategorisi/satırı bilgileri korunur. Yönetici parolası, ortam dosyaları ve gerçek veritabanı Git deposuna dahil değildir.

## Vercel yayını ve yönetim paneli

- Yönetim paneli [Vercel üzerindeki `/admin` adresinde](https://lobby-premium-menu-preview.vercel.app/admin) çalışır. İlk yönetici parolası tek kullanımlık kurulum bağlantısıyla belirlenir.
- `node scripts/build-panel.mjs` Vercel için sunucu fonksiyonunu ve statik varlıkları `.sites-runtime/vercel-panel/` altında hazırlar. `node scripts/test-panel.mjs` önceki derleme çıktısı üzerinden erişim, kayıt ve çakışma akışlarını doğrular.
- Vercel projesinde özel Blob deposu ve `LOBBY_ADMIN_SETUP_SHA` ortam değişkeni gerekir. Depo, menü değişikliklerini ve yönetici oturumlarını ayrı dosyalarda saklar.

### Başka bir hosting üzerinden menü

```sh
node scripts/build-website.mjs --live-menu
```

Üretilen `vercel-preview/public/menü.html` dosyasını mevcut hostingdeki menü dosyasının yerine yükleyin. `lobbypremiumcafe.com` ve `www.lobbypremiumcafe.com` üzerindeki sayfa, güncel menüyü Vercel API'sinden okur. API bağlantısı kesildiğinde gömülü menü gösterilir. `--live-menu` verilmeden üretilen çıktı çevrimdışı çalışır.

Hosting aktarımı: [docs/WEB_SITE_KURULUM.md](docs/WEB_SITE_KURULUM.md). Güncel yayın ve doğrulama notları: [docs/ANA_SITE_TESLIM.md](docs/ANA_SITE_TESLIM.md).

Gerçek alan adı henüz bağlanmadı. Basılacak QR, son genel menü URL'si kesinleşip doğrulandıktan sonra `scripts/generate-qr.py` ile SVG ve PNG olarak üretilebilir. Gerçek telefonla QR okuma testi henüz yapılmadı.

## Menü kaynağı ve doğrulama

Tek menü kaynağı `source/LOBBY_PREMIUM_ANA_MENU.md`; dosyanın başlığı değiştirilmedi. İlk veri `data/initial-menu.json` içinde bulunur.

- 25 kategori, 173 ürün.
- Dokuz tatlının fiyatı girildi. Waffle çeşitleri, Filtre Kahve ve Churchill için fiyat alanları boş.
- Burgerler ve Hemingway yok.
- Kaynakla ürün adı, açıklama ve dolu fiyat karşılaştırması: 0 fark.
- Türkçe karakterlere uygun arama, kategori gezinmesi ve boş fiyat gösterimi.

```sh
node scripts/test-all.mjs
```

Son doğrulama: **24 test başarılı** — 15 kaynak/veri kontrolü ve 9 Node sunucusu/yetkilendirme/yönlendirme kontrolü. Vercel panelinin oturum ve kayıt akışları ayrıca test edildi. Gerçek telefon ve kapsamlı ekran okuyucu testi henüz yapılmadı.

Başlangıç verisini bilerek yeniden üretmek için `node scripts/import-menu.mjs` kullanılabilir. Bu işlem mevcut veritabanını değiştirmez. Canlı yönetici verisini ilk kaynakla değiştirmeyin; güncel veriyi yönetimden dışa aktararak koruyun.

`ONIZLEME.html` ayrıca çevrimdışı menü önizlemesidir; kalıcı yönetimin yerine geçmez.

## Marka ve görseller

Tipografik marka kullanılır; özgün monogram yeniden çizilmedi. Ana sayfada lisanslı bir atmosfer fotoğrafı bulunur; gerçek LOBBY mekânı/müşterileri olarak sunulmaz. Kaynak: [docs/GORSEL_KAYNAKLARI.md](docs/GORSEL_KAYNAKLARI.md). Dijital menüde ürün fotoğrafı eklenmedi.

Doğrulanmış adres, telefon, çalışma saatleri, sosyal hesaplar ve gerçek mekân fotoğrafları henüz sağlanmadığı için uydurulmadı.

## Diğer kaynaklar

`app/`, `db/`, `worker/`, `vite.config.ts` ve `.openai/hosting.json` önceki Sites/Vinext uyarlamasını içerir. Yerel Node uygulaması `standalone/`, Vercel paneli ve güncel ana sayfa `website/` altındadır. Yerel SQLite ve Vercel menü deposu ayrı veri kaynaklarıdır.
