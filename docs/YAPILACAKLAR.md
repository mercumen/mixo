# Yapılacaklar, Devir ve Satın Alma Notları

Bu dosya konuşarak verdiğimiz kararların ve ertelediğimiz işlerin kaydı.
Unutulmaması gereken şeyler burada duruyor.

Son güncelleme: 15 Ağustos 2026

---

## 0. Misafir uygulaması notları (15 Ağustos)

Misafir akışı (`/e/{kod}`) gönderilen tasarımlara göre kuruldu ve headless
Chrome ile uçtan uca test edildi (oturum → görev → gerçek R2 yüklemesi →
otomatik onay → feed → beğeni → silme). Bilinçli kararlar:

- **Beğeni** tasarımda vardı, veri modeline eklendi: `feed/likes` TEK doküman
  (photoId → sayı haritası). Akış isteği toplam 2 okuma. "Aynı kişi iki kez
  beğenemesin" takibi istemcide (localStorage) — bu bir düğün eğlencesi,
  oylama sistemi değil.
- **KVKK açık rızası** isim ekranındaki "Devam ederek … onay vermiş olursun"
  metniyle alınıyor (tasarımda ayrı kutu yoktu). Sunucu `consent: true`
  gelmeden oturum açmıyor. Ayrı onay kutusu istenirse söyle, eklerim.
- **Görev dağıtımı:** havuzda hak sayısından çok görev varsa her misafire
  RASTGELE bir alt küme atanıyor (cihazda saklı) — ekranda hep aynı üç görev
  dönmesin diye.
- **Silme kredi iade etmiyor** (yükle-sil-yükle döngüsünü kesmek için).
  Silme kalıcı: R2 objesi + doküman + feed karesi + beğeni sayacı.
- **Tasarımdaki gerçek fotoğraflar** (polaroid dekorları) yerinde degrade
  yer tutucular var — görseller gelince `Polaroid` bileşenine takılacak.
- Test etkinliği: kod `ELIFCAN` (Elif & Can Düğünü) — **otomatik moderasyon
  modunda** bırakıldı (boru hattını test etmek için). Ürün varsayılanı manuel;
  gerçek demoda kendi etkinliğini kullan ya da bunu manuel moda çek.
- Telefonda kamera için **HTTPS şart** (`getUserMedia` değil ama `capture`
  kamerayı ancak güvenli bağlamda düzgün açıyor) → Vercel deploy sonrası
  Vercel domainini R2 CORS `AllowedOrigins`a eklemeyi unutma (bkz. bölüm 1).

---

## 1. Ertelenen işler (v1'de yok, sırası gelince)

### LANSMANDA SİTE KİLİDİNİ KALDIR — 15 Ağustos
Proje gizli olduğu için tüm site tek parolalık kilit arkasında (`/kilit`).
Kaldırmak için: `lib/gate.ts` + `app/kilit/` + `app/api/gate/` sil,
`proxy.ts`'teki kilit bloğunu ve matcher genişletmesini geri al,
`GATE_PASSWORD` env'ini lokalden ve Vercel'in üç ortamından sil.
**Kilit açıkken Google siteyi indeksleyemez** — lansmandan önce kaldırılmazsa
SEO sıfırdan başlar. Cumartesi demosunda misafir telefonları da parola
soracak; istenirse `/e/` yolları tek satırla muaf tutulabilir.

### AI Gateway bedava katmanı DEMO İÇİN RİSKLİ — 16 Ağustos
Görev üretimi Vercel AI Gateway'den geçiyor (`lib/mission-ai.ts`).
Bedava katmanın iki kısıtı ölçüldü:

1. **Model kısıtı:** sadece `gemini-2.5-flash-lite`, `gpt-5-nano` ve
   `qwen3.7-flash` açık. Diğerleri "Free tier users do not have access".
2. **Hız sınırı:** birkaç istek sonrası kilitleniyor, ~90 sn sonra açılıyor.

**Etkinlik gününde risk:** organizatör arka arkaya üretim denerse sınır
yer ve buton hata verir. **Çözüm: Gateway'e küçük bir tutar kredi yükle**
(vercel.com/[takım]/~/ai → Top up). Gerçek kullanımda aylık maliyet
1-2 doları geçmiyor; kredi hem sınırı kaldırıyor hem daha iyi modelleri
(`gemini-3.1-flash-lite`, `gpt-5-mini`) açıyor.

**Ayrıca:** `gemini-2.5-flash-lite` Google tarafından **16 Ekim 2026'da**
emekliye ayrılıyor. O tarihten önce model değiştirilmeli — tek sabit,
`lib/mission-ai.ts` içindeki `MODEL`.

**Sohbete düşen anahtarlar (devirde iptal edilecekler listesine ek):**
iki adet AI Gateway anahtarı (`vck_6NSb…`, `vck_50kO…`).

### firebase-admin v13'te sabit (Vercel kısıtı) — 15 Ağustos
**Ne oldu:** v14, `jwks-rsa@4 → jose@6` (sadece ESM) zincirini `require()` ile
yüklüyor. Vercel, Next.js fonksiyonlarını `--no-experimental-require-module`
bayrağıyla başlattığı için bu production'da `ERR_REQUIRE_ESM` ile patladı
(lokalde Node 24 özelliği açık olduğundan çalışıyordu — sinsi fark).
Google girişindeki "hesap hazırlanamadı" hatasının kök nedeni buydu.

**Yapılacak:** firebase-admin'i v14+'a yükseltmeden önce Vercel'in
`require(esm)` desteğini kontrol et — kanıt: `/api/debug-node` gibi geçici bir
uçtan `process.execArgv` okumak. Bayrak kalktıysa yükseltilebilir.

### Mail altyapısı — kendi domainimizden gönderim
**Neden gerekli:** Firebase'in şifre sıfırlama maili `noreply@mixo-57b65.firebaseapp.com`
adresinden gidiyor ve **Gmail'de spam'e düşüyor** (test edildi, 12 Ağustos). Sebep:
o domain bizim değil, binlerce Firebase projesinin paylaştığı bir alt domain,
itibarı yok ve bizim domainimizle DKIM hizalaması yok.

**Not:** Firestore Enterprise sürümü ya da hesabı şirket maliyle açmak bunu
çözmüyor. Sorun hesabın kime ait olduğu değil, mailin **kimden gittiği**.

**Yapılacak:**
- Resend'de domain doğrulama (DKIM + SPF + DMARC kayıtları DNS'e)
- `Admin SDK → generatePasswordResetLink()` ile link üret, maili **Resend**
  kendi domainimizden yollasın (Firebase'e attırmayı bırak)
- Aynı iş ekip davet maillerini de kapsıyor (`Üye Davet Et`)
- DMARC'ı `p=none` ile başlat, birkaç gün izleyip sıkılaştır

**Süre:** ~1,5 saat aktif iş + DNS yayılma beklemesi. Yarım gün ayır.
Markalı HTML mail şablonu istenirse ayrı iş sayılmalı (Outlook/koyu tema kaprisleri).

### Uygulama domaini (mail domaininden AYRI iş)
- Vercel'e domain ekle + DNS
- Firebase → Authentication → **Authorized domains**'e ekle
  (yoksa Google girişi o adreste çalışmaz)
- `NEXT_PUBLIC_APP_URL` güncelle
- Misafir linki kısa olmalı: `alanadi.com/e/A7K2` gibi. Masa kartına basılacak
  ve QR okunmayan telefon için **kısa link + 4 haneli kod** yazılacak.

**Süre:** ~15 dk.

### Masa QR'ları
Müşteri şimdilik tek QR istedi. İleride masa bazlı yapılırsa geri gelecekler:
- `tables/{tableId}` — masaNo + qrToken
- Session'ın masaya bağlanması
- **Masa bazlı hız limiti** — gizli sekmeden tekrar girme numarasını yakalayan şeydi
- Masa kartının KVKK aydınlatma metnini taşıması

Şu an bunların yerine: session bazlı hız limiti + feed çeşitliliği kuralı,
aydınlatma metni de uygulamanın ilk ekranında.

### Cloudflare Queues + Worker
Moderasyonu kuyruğa taşımak. **Şimdilik gerekmiyor** — ölçek hesabı:
1.500 fotoğraf / 5 saat ≈ 5 fotoğraf/dakika, tepe noktada ~37/dakika.
Kuyruk gerektiren bir yük değil.

İleride gerekirse kuyruğun asıl kazancı: geri çekilmeli otomatik tekrar deneme
ve dead-letter. Uyarı: Cloudflare Worker'lar Firestore'a Admin SDK ile
**yazamıyor** (Admin SDK Node + gRPC ister, Worker V8 isolate). O yüzden
kuyruğa geçilirse Worker sadece "postacı" olmalı, Firestore'a yazmayı Vercel
tarafında tutmalıyız.

### Firebase App Check
API anahtarı public (olması normal). App Check, isteğin gerçekten bizim
uygulamamızdan geldiğini doğruluyor. Security Rules'a ek katman.

### Vercel Analytics
Firebase Analytics **bilerek** kurulmadı: `getAnalytics` SSR'da patlıyor,
misafir uygulaması hafif olmak zorunda (4G) ve KVKK'da gereksiz rıza katmanı
açıyor. Ölçüm istenirse Vercel Analytics — sunucu tarafı, çerezsiz.

### `check-email` endpoint'ine hız sınırı
`/api/auth/check-email` kullanıcı numaralandırmaya açık: art arda çağırıp hangi
e-postaların kayıtlı olduğu çıkarılabilir. Tasarım iki ayrı ekran istediği için
(Aramıza / Tekrar Hoş Geldiniz) böyle bırakıldı. **Canlıya çıkmadan önce en az
hız sınırı konmalı.**

### Hukuki sayfalar — footer'daki bağlantılar boşta
Footer'da üç bağlantı var ve hepsi `#` (yer tutucu):
- **KVKK Aydınlatma Metni**
- **Gizlilik Politikası**
- **Çerez Politikaları**

500 kişinin tanınabilir fotoğrafını işleyen bir üründe bunlar opsiyonel değil.
Ayrıca misafir uygulamasının ilk ekranındaki açık rıza metni de aynı
aydınlatma metnine bağlanacak. **Canlıya çıkmadan önce yazılmalı** (hukuk
tarafından metin gelmeli, biz sayfaya dökeriz).

Aynı şekilde footer'daki "Referans Etkinlikler" ve sosyal medya bağlantıları da
gerçek adreslerle değişmeli.

### ⚠️ R2 CORS politikası — YENİ BUCKET'TA TEKRAR GEREKİR
Tarayıcı R2'ye doğrudan PUT ediyor (CLAUDE.md kural 1: byte'lar sunucudan
geçmiyor). Bunun çalışması için bucket'ta **CORS politikası** olmak zorunda —
yoksa istek sessizce `Failed to fetch` ile ölüyor.

Sunucu tarafı testler CORS'a takılmadığı için bu hata **ancak tarayıcıdan
denerken** ortaya çıkıyor. Yeni ortam kurulunca mutlaka kontrol edilmeli.

`Cloudflare → R2 → bucket → Settings → CORS Policy`:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://GERCEK-ALAN-ADI"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**`cache-control` LİSTEDEN ÇIKARILMAMALI.** Presigned PUT bu header'la
imzalanıyor ve istemci onu göndermek zorunda (yoksa obje header'sız iniyor,
istek yine başarılı olur — sessiz kayıp). CORS izin vermezse yükleme
tamamen `Failed to fetch` ile ölüyor. Zincir şu:

```
CORS yok            → R2'ye hiç ulaşılamıyor
CORS var, header yok → yükleme olur ama Cache-Control kaybolur (kural 7 bozulur)
ikisi de var         → doğru
```

Not: API token'ı ile programatik yazılamıyor — `Object Read & Write` izni
bucket ayarlarını kapsamıyor, `AccessDenied` dönüyor. Panelden yapılacak.
Deploy edilen her yeni alan adı bu listeye eklenmeli.

### R2 lifecycle kuralı
30 gün sonra otomatik silme (KVKK saklama süresi). Bucket oluşturulduktan
sonra Cloudflare panelinden kurulacak.

---

## 2. Şirketin hesabına taşınacaklar

Şu an **her şey geliştiricinin kendi hesaplarında**. Pazar günü devir planlanıyor.

### Devri kolaylaştıran tavsiye
Hepsi tek bir yeni e-postayla açılmalıydı (ör. `mixo.platform@...`). O zaman
devir "e-posta + şifre + 2FA kurtarma kodları teslim et" oluyor, beş ayrı
servis göçü yapmak gerekmiyor. 2FA kurtarma kodları kişisel telefona kilitli
kalmamalı.

### Devir kontrol listesi

| Servis | Ne yapılacak |
|---|---|
| **GitHub** (`mercumen/mixo`) | Repo şirket organizasyonuna taşınacak. Vercel'in Git bağlantısı taşımadan sonra yeniden kurulmalı (push→deploy zinciri kopmasın). Not: git remote'un adı `origin` değil `main` |
| **Firebase** (`mixo-57b65`) | Proje sahipliği şirkete. Firestore bölgesi kalıcı, kontrol edilmeli |
| **Cloudflare R2** | Hesap + bucket sahipliği |
| **OpenAI** | Organizasyon + API anahtarı |
| **Vercel** (`mercumens-projects/mixo`, canlı: `mixo-rho.vercel.app`) | Proje şirket takımına taşınacak, **Pro plana geçilecek**. Taşımada tüm env değişkenleri kontrol edilmeli (14 değişken + `GATE_PASSWORD`, üç ortamda). Gerçek domain gelince `mixo-rho.vercel.app`'in geçtiği iki yer güncellenecek: Firebase Authorized domains + R2 CORS |
| **Resend** | Hesap + doğrulanmış domain |
| **Domain** | Tescil ve DNS yönetimi şirkete |

### ⚠️ Devirde MUTLAKA yapılacak: anahtar iptali

Aşağıdaki anahtar geliştirme sırasında sohbet geçmişine düştü ve **Security
Rules'ı tamamen bypass ediyor**:

```
firebase-adminsdk-fbsvc@mixo-57b65.iam.gserviceaccount.com
```

Devirde bu anahtar **değiştirilmeyecek, İPTAL EDİLECEK**:
`Firebase Console → Proje ayarları → Hizmet hesapları → anahtarı sil → yeni üret`

**R2 anahtarı da aynı durumda** — geliştirme sırasında sohbet geçmişine düştü:

```
Access Key ID: 56fe724b…  (mixo-photos bucket'ına Read+Edit)
```

Devirde iptal edilip yenisi üretilecek:
`Cloudflare → R2 → Manage R2 API Tokens → token'ı sil → yeni oluştur`

OpenAI anahtarı da devirden sonra yenilenmeli.

Site kilidinin parolası (`GATE_PASSWORD`) da sohbet geçmişine düştü — ama
geçici: lansmanda kilitle birlikte tamamen siliniyor, ayrıca yenilemek
gerekmiyor. Lansman gecikir ve kilit uzun süre açık kalırsa parolayı
değiştirmek yeterli (env güncelle + redeploy).

### R2 endpoint tuzağı (devirde tekrar yaşanacak)
Cloudflare'ın **token oluşturma ekranı yanlış endpoint gösteriyor**: jenerik
hesap adresini basıyor, bucket'ın gerçek adresini değil. Bucket bir yargı
bölgesinde oluşturulduysa doğru adres farklı.

Bizim bucket EU bölgesinde ve test edildi:

```
✅ https://<hesap>.eu.r2.cloudflarestorage.com    ← çalışan
❌ https://<hesap>.r2.cloudflarestorage.com       ← token ekranının gösterdiği
```

Yeni projede bucket oluşturulduktan sonra **iki adresi de deneyip** çalışanı
`R2_ENDPOINT`'e yazmak gerekiyor. Kod adresi türetmiyor, tam bu yüzden.

### Devirde MUTLAKA yapılacak: Firestore indeksleri
Bileşik indeksler proje bazlı — yeni projede otomatik oluşmuyor. Devirden sonra:

```
firebase deploy --only firestore:indexes
```

Tanımlar `firestore.indexes.json` dosyasında. Bunu atlarsak panel
"The query requires an index" hatasıyla açılmıyor.

Aynı şekilde **Security Rules** de yeni projeye yayınlanmalı (`firestore.rules`).

### Devirde silinecek test verileri
- Firestore `users/` altındaki test hesapları
- Firebase Auth'taki test kullanıcıları
  (`demo.organizator@mixointeractive.test`, geliştirici Gmail'i)

### KVKK notu
Gerçek misafir fotoğrafı **asla** geliştiricinin şahsi hesabına düşmemeli.
Veri sorumlusu etkinlik işini yapan şirket. Prodüksiyon şirket hesabına
geçmeden gerçek etkinlik yapılmamalı.

---

## 3. Satın alınması gerekenler

| Kalem | Zorunluluk | Not |
|---|---|---|
| **Firebase Blaze planı** | Zorunlu | Kart bağlı. Ölçeğimizde ücretsiz katmana yakın kalıyor (~6k yazma / ~13k okuma per etkinlik) |
| **Cloudflare R2** | Zorunlu | Egress bedava olduğu için seçildi. ~615 MB/etkinlik |
| **Vercel Pro** | Zorunlu | **Hobby planı ticari kullanıma kapalı.** Gerçek etkinlikten önce geçilmeli |
| **Domain** | Zorunlu | Misafir linki kısa olmak zorunda (masa kartına basılıyor) |
| **Resend** | Muhtemelen ücretsiz katman yeter | Sadece organizatöre mail atıyor, misafire atmıyor |
| **OpenAI** | Düşük | Sadece omni-moderation endpoint'i |

**Şu an ödeme yapılmamış / eksik olan:** Vercel Pro, domain.

---

## 4. CLAUDE.md'de düzeltilmesi gerekenler

CLAUDE.md hâlâ **eskimiş bilgi** içeriyor. Yeni bir oturum onu okuyup yanlış
şeyi kurabilir. Düzeltilecekler:

| CLAUDE.md ne diyor | Gerçek karar |
|---|---|
| Stack'te `Cloudflare Queues + Worker` | Kuyruk **yok**. Moderasyon Vercel'de, `after()` + Vercel Cron ile |
| Kural 5: "Sunucu 1 MB üstünü reddeder" | **Silinecek.** Sunucu dosyayı görmüyor, doğrulayamaz. Boyut R2'nin HEAD/event metadata'sından bedava geliyor |
| Veri modelinde `tables/{tableId}` | Masa yok, tek QR. v2'ye ertelendi |
| Session'da `masaId` | Yok. Kimlik = `deviceToken`. İsim sadece ekran etiketi, çakışma kontrolü **yapılmıyor** |
| Moderasyon şeması `R2 → Queue → Worker` | `R2 PUT → /api/upload-complete → sunucu HEAD ile doğrular → after() içinde moderasyon` |
| KVKK: "masa kartında aydınlatma metni" | Masa kartı yok. Metin **uygulamanın ilk ekranında, kamera izninden önce**. Onay zamanı session'a yazılıyor |

Ayrıca eklenmesi gerekenler:
- Session modelinde `openIntents` rezervasyonu (kredi gerçek inişte düşüyor,
  ama arka arkaya intent alıp sınır delinmesin diye slot tutuluyor)
- Feed çeşitliliği kuralı: ekran sıradaki kareyi seçerken son N karede aynı
  session varsa atlıyor — ekran spam'ini kimlikten bağımsız çözen tek kural
- Firestore'a yazan tek yer sunucu; Security Rules istemciye yazma vermiyor
