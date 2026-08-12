@AGENTS.md

# CLAUDE.md

Bu dosya, bu repoda çalışan her AI ajanı için bağlamdır. Kod yazmadan önce oku.

---

## Ürün

Etkinliklerde (düğün, nişan, kurumsal gece) misafirlerin masalardaki QR'ı okutup
görev bazlı fotoğraf çektiği, bu fotoğrafların moderasyondan geçip HDMI'a bağlı
büyük ekranda animasyonlu şekilde göründüğü bir SaaS.

Satış modeli: organizatör firmalara paket satılıyor. Misafir hesabı yok, üyelik yok.

### Akış

```
Admin paket satar
  → Organizatör etkinlik oluşturur, görevleri seçer, masa QR'larını bastırır
  → Misafir masadaki QR'ı okutur (anonim session, 3 fotoğraf hakkı, 3 görev)
  → Fotoğraf çekilir, sıkıştırılır, doğrudan R2'ye yüklenir (pending)
  → Otomatik moderasyon → onay / red / insan kuyruğu
  → Onaylananlar feed dokümanına girer
  → Ekran feed'i dinler, animasyonla gösterir
```

### Dört ayrı arayüz

| Arayüz | Route | Kim | Not |
|---|---|---|---|
| Admin | `/admin` | Biz | Paket, organizatör, global metrik |
| Organizatör | `/dashboard` | Müşteri | Etkinlik kurulumu, moderasyon, canlı takip |
| Misafir | `/e/{kod}` | Davetli | Auth yok, mobil, PWA |
| Ekran | `/display/{kod}` | Laptop→TV | Fullscreen, klavyesiz, saatlerce dönecek |

**Ekran ayrı bir uygulamadır**, organizatör panelinin sekmesi değil.
1920x1080 sabit, scroll yok, Screen Wake Lock açık.

---

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Firestore** — NoSQL + realtime. Blaze planında (kart bağlı, sert duvar olmasın diye)
- **Cloudflare R2** — fotoğraflar. Egress bedava olduğu için seçildi
- **Cloudflare Queues + Worker** — moderasyon boru hattı
- **Vercel** — Pro plan (Hobby ticari kullanıma kapalı)
- **Resend** — mail (organizatöre, misafire değil)
- **OpenAI omni-moderation** — görsel moderasyon (bedava endpoint)

---

## İhlal edilemez kurallar

Bunların her biri sahada yaşanan bir felaketin karşılığıdır. Sapma varsa önce sor.

### 1. Fotoğraf byte'ları sunucudan geçmez
Presigned URL üret, tarayıcı doğrudan R2'ye PUT'lasın. Sunucu sadece izin token'ı
üretir. 500 kişi aynı anda yüklerken sunucu 500 küçük JSON isteği görür.

### 2. Ekran asla koleksiyon dinlemez
`events/{id}/feed/live` diye **tek bir doküman** var, içinde son 60 onaylı
fotoğrafın referansı. Ekran sadece bu dokümanı dinler.
Koleksiyon dinleyicisi kurmak günlük okuma kotasını gecenin ortasında bitirir.

### 3. Her Firestore sorgusunda `.limit()` var
İstisnasız. Sınırsız sorgu = kontrolsüz fatura.

### 4. Kredi düşümü server-side
İstemci "3 hakkım var" demez. Sunucu session dokümanındaki sayacı transaction
içinde düşürür. Çift yükleme koruması şart.

### 5. İstemci sıkıştırması + sunucu doğrulaması
Canvas ile max 1600px, JPEG'e encode (HEIC sorununu da çözer), hedef ~350 KB.
Sunucu 1 MB üstünü reddeder.

### 6. Upload retry kuyruğu
Yükleme başarısız olursa localStorage'da beklet, tekrar dene. Mekan interneti
her etkinlikte sorun çıkarıyor.

### 7. R2 objelerinde cache header
`Cache-Control: public, max-age=31536000, immutable`
Ekran aynı fotoğrafı saatlerce tekrar indirmesin.

### 8. Moderasyon varsayılan olarak açık
Yeni etkinlikler manuel onay modunda başlar. Organizatör isterse otomatiğe alır.

---

## Moderasyon boru hattı

```
R2 object-create → Queue → Consumer Worker
  → imzalı okuma URL'si üret
  → OpenAI omni-moderation'a gönder (dosyayı değil, URL'yi)
  → yüksek skor: otomatik red
  → temiz: otomatik onay → feed dokümanına ekle
  → belirsiz bant: insan kuyruğuna
```

Ek kurallar:
- 60 saniyeden uzun `pending` kalan fotoğraf otomatik insan kuyruğuna düşer
  (queue takılırsa fotoğraf sessizce kaybolmasın)
- Ekranda 10 saniye ayarlanabilir gecikme tamponu var
- Organizatörde "ekranı dondur" acil butonu var
- Strike: bir misafirin fotoğrafı reddedildiyse kalan hakları manuel onaya düşer
- Galeriden yükleme kapalı, sadece canlı kamera
- Zaman damgası etkinlik penceresi dışındaki fotoğraf reddedilir

**NSFW modeli asıl riskleri yakalamıyor** (el hareketi, meme, utandırıcı kare,
istemsiz kişiler). Otomatik moderasyonun işlevi insan kuyruğunu %5'e indirmek,
insanı devreden çıkarmak değil.

---

## Veri modeli (Firestore)

```
organizations/{orgId}
users/{userId}                    role: admin | organizer
packages/{packageId}              maxGuests, photosPerGuest, features
events/{eventId}                  kod, tip, tarih, moderasyonModu, tema, pencere
  tables/{tableId}                masaNo, qrToken
  missions/{missionId}            etkinliğe kopyalanmış, düzenlenebilir
  sessions/{sessionId}            masaId, takmaAd, deviceToken, kalanKredi
  photos/{photoId}                sessionId, missionId, r2Key, durum, tarih
  feed/live                       ← EKRANIN DİNLEDİĞİ TEK DOKÜMAN
missionTemplates/{templateId}     etkinlik tipine göre havuz
```

Security Rules ilk günden yazılacak. Misafir session'ı:
- sadece kendi fotoğraf dokümanını yazabilir
- kredi sayacına **yazamaz**
- başka session'ları okuyamaz
- feed dokümanına yazamaz

---

## Ölçek hedefi

500 misafir, 1.500 fotoğraf, ~80 masa, tek gece.

- R2: ~615 MB/etkinlik. 30 gün sonra otomatik silme (lifecycle rule)
- Firestore yazma: ~6.000/etkinlik
- Firestore okuma: tek feed dokümanı deseniyle ~13.000/etkinlik
- Peak: duyuru sonrası 10 dakikada 500 QR okutma

---

## Saha kısıtları (kod bunları varsayacak)

- **Mekan wifi'si kullanılmıyor**, misafirler kendi 4G'sinde. Uygulama hafif olmalı
- Ekran laptopu uyumamalı (Wake Lock), tam ekran, imleç gizli
- İnternet kesilirse: ekran son fotoğraflarla dönmeye devam eder,
  upload'lar kuyrukta bekler
- QR okunmayan telefon her etkinlikte çıkar → masa kartında kısa link + 4 haneli kod

---

## Tasarım

Figma frame'lerinin ekran görüntüleri `docs/design/` altında. **`public/` altına
koyma** — deploy'a gider ve herkese açık servis edilir.

Ekran görüntüsünde olmayan her şeyi sormadan uydurma:
- hover / focus / active / disabled durumları
- loading, boş durum, hata durumu
- responsive kırılma noktaları
- neyin ortak component neyin tek kullanımlık olduğu
- geçiş ve animasyon süreleri
- uzun veri (40 karakterlik isim layout'u patlatmamalı)

Öncelik: misafir uygulaması ve ekran piksel düzeyinde önemli.
Admin ve organizatör panelleri shadcn/ui üzerine kurulacak, üzerine sadece
token'lar geçilecek. Bu ikisinde özel tasarıma zaman harcanmayacak.

**Ekran animasyonları Figma'dan gelmez**, kodda tarif edilir.

---

## Kapsam dışı (v2)

Bunları önerme, isteme, eklemeye çalışma:
ödeme entegrasyonu, puan/liderlik tablosu, video/boomerang, misafirler arası
galeri, sosyal paylaşım, yüz tanıma, çoklu dil, native app, custom domain.

---

## KVKK

500 kişinin tanınabilir fotoğrafı = kişisel veri.
- Masa kartında aydınlatma metni ve açık rıza ibaresi
- Veri modelinde "fotoğrafımı sil" mekanizması **ilk günden** var
  (sonradan eklemek zor)
- Etkinlik sonrası saklama süresi 30 gün, sonra otomatik silme

---

## Çalışma tarzı

- Tek seferde bir ekran. "Admin panelini yap" değil, "paket listesi ekranını yap"
- Ortak componentler (button, input, card, badge, modal) ekranlardan önce biter
- Token'lar (`globals.css` + tailwind config) her şeyden önce biter
- Belirsizlik varsa varsayım yapma, sor
- Yeni bağımlılık eklemeden önce sor
