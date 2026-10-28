# Ana site — öğrenci kafesi revizyonu

Ana site: https://lobby-premium-menu-preview.vercel.app
Menü: https://lobby-premium-menu-preview.vercel.app/men%C3%BC
Dağıtım: dpl_jnah1kXQLiET4GGXxr6mwNoUuBdR
Durum: READY, production. Aynı sabit herkese açık URL; ziyaretçi hesabı veya süreli paylaşım bağlantısı gerekmez.

## Güncel yön

Kullanıcı işletmeyi okey ve kart oyunları oynanan genel bir öğrenci kafesi olarak tanımladı. Ana sayfanın konusu buna göre değiştirildi.

- Açılış: “Çıkışta LOBBY'deyiz.” Okey, kart oyunları, arkadaş buluşmaları, yemek ve muhabbet önde.
- Kahve fincanı ve çekirdek görselleri kaldırıldı. Arkadaşların masa oyunu oynadığı tek bir lisanslı atmosfer fotoğrafı kullanılıyor. Gerçek LOBBY mekânı veya müşterileri olarak sunulmuyor; kaynak açıklaması altbilgide.
- İnce serif ve italik başlıklar kaldırıldı. Başlıklar Arial/Helvetica sans serif, 750–800 ağırlık; buton ve menü sekmeleri daha tok. Tipografik marka daha kalın serif olarak korunuyor. Ana sayfada `em` veya `i` etiketi yok.
- Okey, Kart oyunları ve Muhabbet bölümü eklendi. Metinler daha kısa ve gündelik.
- Ana sayfa seçkisi Soğuk İçecekler, Atıştırmalıklar, Pizzalar ve Tostlar kategorilerinden üretiliyor; ilk açılışta Atıştırmalıklar etkin. Her kategoriden ilk dört ürün kaynaktaki alanlarıyla gösterilir.
- Üst menüye koyu zemin verilerek fotoğraf üzerinde okunurluk sağlandı. Kaydırmada krem zemine geçer.
- Mevcut QR menünün verisi ve tasarımı korundu. Sipariş, rezervasyon veya ödeme özelliği eklenmedi.

## Doğrulama

- 13 kaynak/veri ve 9 standalone/yetkilendirme/yönlendirme testi geçti: 22 kontrol, 0 başarısızlık.
- Kaynakla alan karşılaştırması: 0 fark. 23 kategori, 158 ürün, 12 null fiyat. Burger ve Hemingway yok.
- `menü.html` önceki onaylı sürümle birebir aynı: SHA-1 `22a2483131b5a22950fa53c00f066d8fae68e8db`.
- Canlı site Chrome'da hesap girişi olmadan açıldı. Atmosfer fotoğrafı yüklendi.
- 320 ve 390 px telefon, 768 px tablet ve masaüstü görünümü incelendi. 320 ve 768 px genişliklerde yatay taşma yok. Türkçe karakterler doğrulandı; hatalı Unicode değiştirme karakteri yok.
- Başlık yazı tipi Arial/Helvetica sans serif, ağırlık 800; italik öğe sayısı 0.
- Mobil menüden Oyun ve sohbet / Menüden bölümlerine geçiş ve otomatik kapanma çalıştı.
- İlk etkin kategori Atıştırmalıklar; Patates Kızartması, Karışık Sepet, 6'lı Soğan Halkası ve Çıtır Tavuk Parçaları doğru gösterildi.
- Pizzalar sekmesinde sağ ok tuşu Tostlar'a geçti ve klavye odağı yeni sekmeye taşındı.
- Kategorinin tamamı bağlantısı `/menü#cat-21` sayfasını açtı. Gerçek menü DOM sayımı: 23 kategori, 158 ürün ve 12 boş fiyat. 320 px genişlikte yatay taşma yok.

Yerel localhost önizlemesine tarayıcı erişimi önceki denemede zaman aşımına uğradığı için görsel ve etkileşim kontrolleri bu herkese açık yayında yapıldı. Gerçek telefon ve kapsamlı ekran okuyucu testi henüz yapılmadı.

## Yayın ve aktarım

Statik dosyalar `vercel-preview/public/` içinde. Kurulum: `WEB_SITE_KURULUM.md`.
Sunucu sürümü aynı ana sayfayı, kalıcı menüyü ve korumalı `/admin` alanını içerir; Node 24 ve kalıcı disk gerekir. Bu Vercel yayını statik ana site/menüdür; yönetim sunucusu henüz Vercel'e dağıtılmadı.

Özgün logo, gerçek mekân/ürün fotoğrafları, doğrulanmış adres, telefon, saatler ve sosyal hesaplar sağlanmadı. Alan adı/hosting satın alınmış veya bağlanmış gibi gösterilmez. Son alan adı belli olunca canonical, site haritası ve basılacak QR hazırlanmalı.