# LOBBY — Doğrulama ve teslim raporu

## Kaynak eşleşmesi

Tek içerik kaynağı: `source/LOBBY_PREMIUM_ANA_MENU.md`. Başlık `LOBBY PREMIUM CAFE` olarak korundu; ziyaretçi markası `LOBBY PREMIUM LOUNGE`.

Ürün adları, açıklamalar, dolu fiyatlar, kategori sırası ve ürün sırası kaynakla alan bazında karşılaştırıldı. **Fark: 0.** Başlangıç veri modeli 23 kategori, 158 ürün ve 12 null fiyat içerir. Burger veya Hemingway ürünü bulunmaz. Aynı isimli ürünleri kategoriler arasında birleştiren işlem yapılmadı.

| Kategori | Ürün sayısı |
| --- | ---: |
| Türk Kahveleri | 6 |
| Çay Çeşitleri | 7 |
| Bitki Çayları | 6 |
| Sıcak İçecekler | 7 |
| Sıcak Kahveler | 10 |
| Soğuk Kahveler | 10 |
| Smoothie | 10 |
| Frozen | 10 |
| Ferahlatıcı İçecekler | 8 |
| Milkshake | 9 |
| Soğuk İçecekler | 14 |
| Vitamin Bar | 5 |
| Tatlılar | 9 |
| Sandviçler | 3 |
| Atıştırmalıklar | 4 |
| Meyveler ve Çerezler | 2 |
| Soslu Tavuklar | 8 |
| Pizzalar | 6 |
| Salatalar | 4 |
| Makarnalar | 6 |
| Tostlar | 7 |
| Gözlemeler | 5 |
| Wrap / Quesadilla | 2 |
| **Toplam** | **158** |

Boş fiyatlar: 9 Tatlılar + 3 Sandviçler. Üç sandviç kruvasandır. Fiyatlar 0 veya metinle doldurulmadı. Gözlemelerin ortak servis notu kategori açıklamasına aynen aktarıldı.

## Prompt ile Markdown arasındaki açık metin farkı

Ürün: **Bazlama Tavuklu Tost**.

- Prompt: “Sotelenmiş tavuk yanında patates kızartması, domates, salatalık ile birlikte”
- Kaynak: “Sotelenmiş tavuk; yanında patates kızartması, domates ve salatalık ile birlikte.”
- Karar: Tek kaynak kuralı gereği Markdown açıklaması aynen korundu. Noktalama veya bağlaç gizlice değiştirilmedi.

Diğer onaylı ürün adları/fiyatları kaynağa uyuyor. Smoothie çeşitlerinin 10’u da 180 TL; Vejetaryen Pizza açıklaması ve 290 TL fiyatı korundu.

## Çalıştırılan kontroller

**21 kontrol geçti; 0 başarısız.**

- Source checksum and title preserved: başarılı.
- Independent field comparison of all 158 products and 23 categories: başarılı.
- Exactly 9 desserts and 3 sandwiches have null prices: başarılı.
- Approved prices, names, and category note: başarılı.
- Turkish case, decomposed Unicode, and ASCII search: başarılı.
- Null display empty and TL decimal precision: başarılı.
- Reject invalid edits and preserve immutable source provenance: başarılı.
- Pre-save changes identify exact before/after fields: başarılı.
- Anonymous and non-admin reads, writes, exports rejected: başarılı.
- Cross-origin writes rejected: başarılı.
- Price update, clearing, restart durability and no reseed overwrite: başarılı.
- Stale and racing revisions cannot overwrite saved data: başarılı.
- Only administrator actions mutate data; audit and exports preserved: başarılı.
- Public menu renders without authentication and exposes exact source data: başarılı.
- Every admin endpoint denies anonymous access: başarılı.
- Real scrypt login rejects bad credentials and creates secure server sessions: başarılı.
- Full authenticated write flow preserves cents and clears prices to null: başarılı.
- Authorized sessions cannot perform cross-origin or invalid writes: başarılı.
- Initial and current exports remain distinct and current revision prevents lost updates: başarılı.
- Login attempts are rate limited: başarılı.
- Logout revokes the session server-side: başarılı.

Veritabanı testleri geçici SQLite dosyalarında yapıldı; başlangıç menüsü üzerinde kalıcı test fiyatı bırakılmadı. Kalıcılık testinde veritabanı kapatılıp yeniden açıldı. Yönetim HTTP işleyicileri gerçek scrypt ve gerçek sunucu oturumu koduyla doğrudan çağrıldı; testteki istek nesneleri kontrollü taklitti. Sites kimlik testlerinde platformun oturum başlıkları taklit edildi; gerçek Sites OAuth akışı doğrulanmadı.

Ana renk kontrastları hesaplandı: koyu metin/kırık beyaz **13,33:1**; ikincil metin/kırık beyaz **5,19:1**; seçili kategori/koyu metin **6,42:1**. Düşük kontrastlı arama yer tutucu rengi koyulaştırıldı.

## Tamamlanmayan kabul kontrolleri

- Tarayıcı önizleme bağlantısı zaman aşımına uğradı. 320 px görünümde taşma, klavye/odak etkileşimi ve gerçek tarayıcı arama/kategori davranışı görsel olarak doğrulanamadı. Duyarlı stiller, görünür odak, dialog ve hareket azaltma desteği kodda mevcut.
- Sites paket kurulumu `registry.npmjs.org` DNS hatasıyla tamamlanmadı. Kaynak deposu bağlantısı `getaddrinfo() thread failed to start` hatasıyla kurulamadı. Sites/Vinext derlemesi ve canlı dağıtım yapılmadı.
- Node yerel sunucusu başlatıldı ve dinleme mesajı alındı; bu ortamdan loopback HTTP erişimi kısıtlandı. Ağ üzerinden gerçek uçtan uca kontrol tamamlanmadı.
- Genel HTTPS URL yok; QR dosyaları üretilmedi. Gerçek telefonda QR okuma yapılmadı. Üretimden sonra bunlar ayrıca tamamlanmalı.

## Teslim edilenler

- Doğrudan açılabilen `ONIZLEME.html`; kaynağın tüm ürünleriyle çevrimdışı arama/kategori önizlemesi.
- Paket kurulumu gerektirmeyen Node 24 yerel uygulama, gerçek parola/oturum koruması, SQLite kalıcılık, yönetim ve dışa aktarma.
- Sites/Vinext uyarlaması, D1 şeması/migrasyonu ve sunucu izin listesi. Bu yolun derlemesi doğrulanmadı.
- İlk kaynak Markdown, başlangıç JSON, alan bazlı doğrulama sonuçları, kurulum/yayın rehberi ve nihai URL için QR üretim betiği.
