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

## Statik yayın / Vercel

```sh
node scripts/build-website.mjs
```

Yayın dosyaları `vercel-preview/public/` içine üretilir; Vercel ayarı `vercel-preview/vercel.json` içindedir. Apache uyumlu `.htaccess` de hazırlanır.

**Mevcut Vercel yayını statik ana site ve menüdür.** Korumalı yönetim sunucusu Vercel'e dağıtılmış değildir. Statik çıktı yönetici değişikliklerini kendiliğinden almaz. Kalıcı yönetim için Node 24 ve kalıcı disk sunan hosting kullanılmalıdır.

Hosting aktarımı: [docs/WEB_SITE_KURULUM.md](docs/WEB_SITE_KURULUM.md). Güncel yayın ve doğrulama notları: [docs/ANA_SITE_TESLIM.md](docs/ANA_SITE_TESLIM.md).

Gerçek alan adı henüz bağlanmadı. Basılacak QR, son genel menü URL'si kesinleşip doğrulandıktan sonra `scripts/generate-qr.py` ile SVG ve PNG olarak üretilebilir. Gerçek telefonla QR okuma testi henüz yapılmadı.

## Menü kaynağı ve doğrulama

Tek menü kaynağı `source/LOBBY_PREMIUM_ANA_MENU.md`; dosyanın başlığı değiştirilmedi. İlk veri `data/initial-menu.json` içinde bulunur.

- 23 kategori, 158 ürün.
- 9 tatlı ve 3 kruvasan sandviç: toplam 12 `null` fiyat.
- Burgerler ve Hemingway yok.
- Kaynakla ürün adı, açıklama ve dolu fiyat karşılaştırması: 0 fark.
- Türkçe karakterlere uygun arama, kategori gezinmesi ve boş fiyat gösterimi.

```sh
node scripts/test-all.mjs
```

Son doğrulama: **22 test başarılı** — 13 kaynak/veri kontrolü ve 9 Node sunucusu/yetkilendirme/yönlendirme kontrolü. Canlı statik sitede ayrıca mobil görünüm ve gezinme kontrol edildi; gerçek telefon ve kapsamlı ekran okuyucu testi henüz yapılmadı.

Başlangıç verisini bilerek yeniden üretmek için `node scripts/import-menu.mjs` kullanılabilir. Bu işlem mevcut veritabanını değiştirmez. Canlı yönetici verisini ilk kaynakla değiştirmeyin; güncel veriyi yönetimden dışa aktararak koruyun.

`ONIZLEME.html` ayrıca çevrimdışı menü önizlemesidir; kalıcı yönetimin yerine geçmez.

## Marka ve görseller

Tipografik marka kullanılır; özgün monogram yeniden çizilmedi. Ana sayfada lisanslı bir atmosfer fotoğrafı bulunur; gerçek LOBBY mekânı/müşterileri olarak sunulmaz. Kaynak: [docs/GORSEL_KAYNAKLARI.md](docs/GORSEL_KAYNAKLARI.md). Dijital menüde ürün fotoğrafı eklenmedi.

Doğrulanmış adres, telefon, çalışma saatleri, sosyal hesaplar ve gerçek mekân fotoğrafları henüz sağlanmadığı için uydurulmadı.

## Diğer kaynaklar

`app/`, `db/`, `worker/`, `vite.config.ts` ve `.openai/hosting.json` önceki Sites/Vinext uyarlamasını da içerir. Bu uyarlamanın paket kurulumu ve derlemesi bu ortamda doğrulanamadı; mevcut yayın bu framework üzerinden çalışmıyor. Node uygulaması `standalone/` altında, güncel ana sayfa ise `website/` altındadır. İki çalışma biçimi farklı veri kaynakları kullanır; otomatik eşitlenmez.