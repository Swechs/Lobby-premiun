# LOBBY ana site ve dijital menü

Ana site `/`, dijital menü `/menü` adresindedir. `/menu` İngilizce karakterli kısa yoludur. Satın alınacak alan adı henüz yapılandırılmadı; tüm site bağlantıları göreli hazırlanmıştır. Kullanıcının örnek alan adı yayımlanmış veya satın alınmış kabul edilmemiştir.

## İçerik ve tasarım

Kırık beyaz, krem, adaçayı ve mat altın paleti; serif başlıklar; mobil gezinme ve kaynak menüye giden kategori kartları. Ana sayfadaki seçkiler doğrulanmış menüden alınır. Özgün logo verilmediğinden tipografik marka kullanılır. Ana sayfadaki kemer çizimi dekoratif bir grafik çalışmasıdır; mekân fotoğrafı olarak sunulmaz. Yeni ürün, müşteri yorumu, ödül, kampanya veya işletme istatistiği eklenmemiştir.

Gerçek mekân fotoğrafları, kesin adres, iletişim bilgileri, sosyal hesaplar ve çalışma saatleri henüz sağlanmadı. Bu alanlarda sahte bilgi veya işlevsiz iletişim düğmesi yoktur. Bilgiler doğrulanınca ziyaret/iletişim bölümü eklenebilir.

## Statik hosting

`node scripts/build-website.mjs` komutu `vercel-preview/public/` klasörünü üretir. Bu klasörün içeriğini hostingin ana yayın klasörüne yükleyin. `index.html`, `menü.html`, `favicon.svg`, `404.html`, `assets/` ve `.htaccess` birlikte korunmalıdır.

Apache hosting için `.htaccess` hazırdır; UTF-8 dosya adları ve mod_rewrite desteği gerekir. Nginx veya farklı bir sunucuda `/menü` ve `/menu` isteklerini `menü.html` dosyasına yönlendirin. HTTPS'i etkinleştirin. Kesin alan adı alındıktan sonra canonical, sitemap ve alan adı ayarları tamamlanmalıdır.

Statik hosting ana site ve menüyü sunar. Kalıcı fiyat düzenlemesi için uygulama sunucusu ve kalıcı veri gerekir; statik dosya yüklemesi yönetim sunucusunun yerine geçmez.

## Node uygulaması

Mevcut `standalone/server.mjs` ana siteyi `/`, kalıcı veritabanındaki menüyü `/menü`, yönetim panelini `/admin` altında sunar. ASCII `/menu`, `/menü` adresine yönlenir. Türkçe URL'nin kodlanmış biçimi de desteklenir. Yönetim kimlik doğrulaması ve veritabanı korunmuştur.

Node.js 24 ve kalıcı disk gerekir. `node standalone/setup-admin.mjs`, ardından `node standalone/server.mjs`. Yerel adres terminalde yazdırılır. Üretim yapılandırması için `docs/YAYIN.md` içindeki Node adımlarını kullanın.

## Vercel önizlemesi

Mevcut `lobby-premium-menu-preview` projesi kullanılır; yeni proje veya alan adı oluşturulmaz. Herkese açık erişim korunur. `vercel-preview/vercel.json` yalnızca `public` klasörünü yayınlar. `.vercel`, `deployment.json`, yönetici oturumları ve yerel veritabanı yayın dosyası değildir.
