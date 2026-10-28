> Ana site: https://lobby-premium-menu-preview.vercel.app
> Menü: https://lobby-premium-menu-preview.vercel.app/men%C3%BC
> Herkese açık, güncel web sitesi sürümü. Hosting aktarımı: docs/WEB_SITE_KURULUM.md; güncel doğrulama: docs/ANA_SITE_TESLIM.md.

# LOBBY PREMIUM LOUNGE — QR Menü

Türkçe mobil menü, kalıcı fiyat/içerik düzenleme, yetkili yönetim, değişiklik önizlemesi ve veri dışa aktarma.

## Hemen görüntüle

`ONIZLEME.html` dosyasını tarayıcıda açın. 23 kategori ve 158 ürünle çalışan çevrimdışı tasarım önizlemesidir; arama ve kategori gezinmesi çalışır. Bu dosyadaki fiyat değişiklikleri kalıcı yönetim yerine geçmez.

## Ek paket kurmadan çalıştırma

Node.js **24 veya üzeri** gerekir. Windows için:

1. `YONETICI_PAROLASI.cmd` dosyasını açın; en az 12 karakterli yönetici parolanızı iki kez girin. Parola ekranda maskelenir ve yalnızca scrypt özeti saklanır.
2. `BASLAT.cmd` dosyasını açın.
3. Yerel menü: `http://127.0.0.1:4317`
4. Yönetim: `http://127.0.0.1:4317/admin`

Diğer sistemlerde proje klasöründe:

```sh
node standalone/setup-admin.mjs
node standalone/server.mjs
```

Parola tanımlanmadan menü görüntülenebilir; yönetim oturumu açılamaz. `127.0.0.1` yalnızca uygulamanın çalıştığı bilgisayardır, genel yayın adresi değildir.

Kalıcı veriler varsayılan olarak `.sites-runtime/standalone/menu.sqlite` içinde tutulur. Başlangıç aktarımı yalnızca boş veritabanında çalışır; sunucu yeniden başlatılırken yönetici değişiklikleri üzerine yazılmaz. `LOBBY_DATA_DIR` ile kalıcı disk konumu değiştirilebilir. Bu klasörü ve parola dosyasını internete açık bir dizine koymayın.

## Yönetim kullanımı

Kategori seçin; kategori adı, açıklaması ve sırasını düzenleyin. Ürün fiyatını değiştirin veya yanındaki × düğmesiyle temizleyin. Ürünün adını, açıklamasını, kategorisini ve sırasını “İçerik ve sıralama” bölümünden düzenleyebilirsiniz. Düşük sıra değeri önce görünür; eşit sıra değerlerinde mevcut sıralama korunur.

“Değişiklikleri incele” alan bazlı eski/yeni değerleri gösterir. “Değişiklikleri kaydet” kalıcı kayıt yapar. Aynı sürümü iki oturum düzenlerse ikinci kayıt reddedilir; sayfayı yenileyerek güncel sürümü alın. Yenilemeden önce varsa kendi düzenlemelerinizi not edin.

Boş fiyat `null` olarak kaydedilir. Ziyaretçi ekranında fiyat yeri boş kalır. Kuruş hassasiyeti iki basamağa kadar korunur. Açık menü sayfaları görünürken 30 saniyede bir güncellemeleri kontrol eder; yeni açılan sayfa güncel veriyi alır.

Başlangıç verisi ve güncel veri yönetim alanından ayrı ayrı JSON olarak dışa aktarılabilir. Sabit kimlikler, kaynak kategorisi ve kaynak satırları dışa aktarmada korunur. Bu sürüm mevcut 23 kategoriyi ve 158 ürünü düzenler; ürün ekleme/silme kapsam dışıdır.

## Doğrulama

```sh
node scripts/test-all.mjs
```

21 kontrol başarılı: kaynakla alan eşleşmesi, Türkçe/Unicode arama, boş fiyat, kuruş hassasiyeti, kimlik ve kaynak izlenebilirliği, yetkisiz erişim, CSRF kontrolü, gerçek parola/oturum doğrulama, giriş denemesi sınırı, güncelleme/temizleme, veritabanı yeniden açıldığında kalıcılık, sürüm çakışması, işlem kaydı, dışa aktarma ve çıkışta oturum iptali.

`docs/DOGRULAMA_RAPORU.md` kategori bazlı sayımı, metin farkını ve tamamlanamayan kontrolleri içerir. İstek işleyicisi testleri gerçek uygulama koduyla çalıştırılmıştır; tarayıcı ve ağ taşıması testinin yerine geçmez.

## Kaynak ve marka

Tek menü kaynağı `source/LOBBY_PREMIUM_ANA_MENU.md`; başlığı değiştirilmemiştir. İlk aktarım `data/initial-menu.json` içindedir. Aktarım komutunu yalnızca başlangıç verisini bilerek yeniden üretmek için çalıştırın:

```sh
node scripts/import-menu.mjs
node scripts/build-preview.mjs
```

Mevcut veritabanını bu komutlar değiştirmez. Ürün kimlikleri ilk kaynak konumuna dayanır; canlı veriyi yeniden aktararak kimlik üretmeyin.

Marka tipografik kullanılmıştır. Özgün logo/monogram çizilmemiştir. Renkler verilen yaklaşık arayüz paletinden türetilmiştir. Sistem fontları Türkçe karakterleri destekler; dış font veya stok ürün görseli kullanılmamıştır.

## Yayın durumu

**Canlı dağıtım tamamlanmadı. Genel menü URL’si ve basıma uygun QR dosyası henüz yok.** Yerel ortam paket sunucusunu ve kaynak deposunu çözemedi. Tarayıcı önizleme bağlantısı da zaman aşımına uğradı. 320 px görünüm, gerçek tarayıcı etkileşimleri ve gerçek telefonla QR okuma canlı ortamda kontrol edilmelidir.

Yayın adımları: `docs/YAYIN.md`. Nihai genel URL doğrulandıktan sonra `scripts/generate-qr.py` SVG ve yüksek çözünürlüklü PNG üretir. Fiyat değişiklikleri URL’yi değiştirmez.

## Sites uyarlaması

`app/`, `db/`, `worker/`, `vite.config.ts` ve `.openai/hosting.json` Sites/Vinext sürümüdür. Bu sürümde kimlik doğrulama Sites tarafından, kalıcılık D1 tarafından sağlanır; yönetici e-posta izin listesi sunucu ortamındaki `ADMIN_EMAILS` değeridir. Tarayıcıya yönetici anahtarı gönderilmez. Sites proje kimliği korunmuştur; aynı proje için yeniden kayıt oluşturmayın.

Sites sürümünün paket kurulumu ve derlemesi bu ortamda doğrulanamadı. Ek paket gerektirmeyen yerel sürüm kendi SQLite veritabanını ve parola oturumlarını kullanır. İki çalışma biçiminin veritabanları ayrıdır; biri diğerine otomatik eşitlenmez. Canlıya geçerken yönetimden alınan güncel JSON verisini kaybetmeyin; ilk yayın sırasında kaynak veri kullanılmalıdır.
