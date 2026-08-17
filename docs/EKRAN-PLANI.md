# Ekran Uygulaması — Anı Bahçesi

Durum: **temel akış çalışıyor ve canlıda.** `/display/{kod}`
Kaynak sahne: `docs/design/ani-bahcesi-demo.html` (motorun tek doğrusu)

---

## 1. Bugün yapılanlar

### Motor: yeniden yazılmadı, sarıldı
Demo görsel olarak onaylanmış durumdaydı. 1600 satır Three.js kodunu
TypeScript'e çevirmek sahneyi bozma riski demekti — kazancı yok, riski çok.
Bunun yerine gövde **harfiyen** korunup bir modüle sarıldı
(`app/display/[kod]/_lib/garden-engine.js`). Tek dokunuşlar:

- `rafId` ataması (sayfa kapanırken döngüyü durdurabilmek için)
- en altta işaretli **MIXO KÖPRÜSÜ** bloğu: `addImage`, `reset`, `count`,
  `showFinale`, `dispose`

Motor demo arayüzünün DOM'da olduğunu varsayıyor (dosya seçici, ayar paneli,
final kutusu). Bu satırları silmek yerine **gizli kabuklar** üretiliyor;
böylece motor koduna hiç girilmedi ve sahada gerekirse ayar paneli
açılabilir hâlde duruyor.

### Fotoğraf akışı
```
onaylanan foto → feed/live dokümanı → onSnapshot (TEK listener)
   → 10 sn gecikme tamponu → crossOrigin görsel yükleme
   → motor kuyruğu → tören (kart belirir, durur, uçar) → gülde yaprak
```

- **CLAUDE.md kural 2** birebir: koleksiyon dinleyicisi yok, tek doküman.
- Kod → etkinlik çözümü **sunucuda**; `events` sorgusu anonim istemciye
  kapalı (ve kapalı kalmalı). İstemciye sadece etkinlik kimliği geçiyor.
- `crossOrigin = "anonymous"` **zorunlu**: motor fotoğrafı canvas'a çizip
  `getImageData` ile okuyor (yaprak kopma tozu, final kolajı). Başka
  kökenden gelen görsel canvas'ı kirletiyor ve `getImageData` SecurityError
  atıyor — bayrak olmasa fotoğraf görünür ama **dökülme animasyonu çökerdi.**

### Saha kısıtları
| Kısıt | Çözüm |
|---|---|
| Laptop uyumamalı | Wake Lock + sekme öne gelince yeniden alma |
| Klavyesiz, imleçsiz | Fare durunca imleç ve kontroller kayboluyor (3 sn) |
| İnternet kesilirse | Sahne durmuyor; yüklü yapraklar dönmeye devam ediyor, SDK bağlantıyı kendi kuruyor |
| Acil dondurma | `frozen` bayrağı yeni kare almıyor, sahne dönmeye devam ediyor |
| Kötü kare ekrana düşmesin | 10 sn gecikme tamponu |
| Sahne motoru gelmezse | Siyah ekran değil, Türkçe okunur hata |

### Doğrulanan
1920×1080 WebGL'de sahne çiziliyor (ekran görüntüsü alındı), tören→yaprak
boru hattı 21 saniyede 3 kare işledi, konsolda hata yok, canlıda `200`.
Demo HTML `public/`ten çıkarıldı — **herkese açık servis ediliyordu**,
artık `404`.

---

## 2. Sıradaki işler — öncelik sırasına göre

### 🔴 Gerçek fotoğrafla uçtan uca test
Bugünkü test sentetik karelerle yapıldı (motorun kendi örnek üreticisi).
Gerçek R2 fotoğrafıyla denenmesi gereken tek şey **CORS**: bucket'ın
`AllowedOrigins` listesinde canlı adres varsa yüklenir, yoksa `crossOrigin`
yüzünden görsel sessizce düşer. Onaylı fotoğrafı olan bir etkinlikte
`/display/{kod}` açılıp bakılacak.

### 🔴 Three.js'i paketin içine al
Şu an CDN'den geliyor (demo da öyle yapıyordu). **Mekan internetiyle
çelişiyor:** sayfa ilk açılışta CDN'e ulaşamazsa ekran hiç açılmaz.
`npm i three` + yerel import bunu tamamen ortadan kaldırır.
**Bağımlılık eklemek için onay gerekiyor** (CLAUDE.md) — sorulacak.
Geçici emniyet: yüklenemezse okunur hata mesajı çıkıyor.

### 🟡 Finalin ne zaman patlayacağı
Motor gül dolunca (15 kare) finali kendi tetikliyor: gül çözülüp **isim**
yazıyor. Şu an isim etkinlik adından türetiliyor ("Elif & Can Düğünü" →
"Elif & Can"). Karar bekleyenler:
- Final **fotoğrafı** seçilebiliyor (motor destekliyor): çift kendi
  fotoğrafını verirse anılar o kareye evriliyor. Sihirbaza bir adım
  eklenirse organizatör önceden seçer.
- Final aralığı: 15 karede bir mi, gecede bir kez mi, saat başı mı?
  500 misafir × 3 hak = 1500 fotoğraf → 15'lik kapasiteyle **100 final**
  demek. Bu çok sık. Kapasiteyi 30-40'a çıkarmak ya da finali zamana
  bağlamak gerekiyor (ör. saat başı + gece sonu büyük final).

### 🟡 Organizatör kontrolü
`feed/live`'daki `frozen` bayrağını çeviren uç yazılı ama panelde **düğme
yok**. Canlı Akış sayfasına "Ekranı Dondur" acil butonu eklenecek.
Ayrıca panelden "finali şimdi başlat" tetiklemesi mantıklı olur — şu an
sadece ekranın kendi gizli çubuğundan yapılıyor.

### 🟡 Beğeni sahneye girmiyor
Misafir beğenileri toplanıyor (`feed/likes`) ama ekran kullanmıyor.
En beğenilen kare gülün merkezine yerleşebilir ya da finalde öne çıkabilir.
Motor yaprak konumunu `slotParams(i)` ile veriyor — merkez neredeyse dik,
dışı açık; beğeniye göre sıralama bu fonksiyona dokunmadan yapılabilir.

### 🟢 Sahne kalibrasyonu
Her mekanın ışığı farklı. Motorun ayar paneli (ışık, cam, renk, rüzgâr)
gizli kabuk olarak duruyor ama erişilemiyor. Operatöre gizli bir kısayol
(ör. `?ayar=1`) verilirse sahada projeksiyon/TV'ye göre ayarlanabilir ve
seçilen değerler etkinliğe kaydedilebilir.

### 🟢 Paket kapısı
Anı Bahçesi bir **sahne şablonu**; `lib/stage-templates.ts` pakete göre
kısıtlıyor. Şu an `/display/{kod}` şablona bakmadan gülü açıyor. Etkinliğin
`stageTemplateId`'sine göre doğru sahneyi seçen bir yönlendirme gerekiyor —
diğer şablonlar (mozaik, zaman tüneli, polaroid yığını) yazıldıkça bu
zorunlu olacak.

### 🟢 Dayanıklılık, uzun gece
- İmzalı adreslerin ömrü 6 saat. Gece 8 saat sürerse geç yüklenen eski
  kareler düşebilir. Şu an başarısız yükleme sessizce atlanıyor ve tekrar
  denenebilir işaretleniyor; kalıcı çözüm adresi yenileyen küçük bir uç.
- Bellek: her fotoğraf bir doku. Kapasite 15 + düşen yapraklar dispose
  ediliyor, ama 1500 fotoğraflı bir gece hiç test edilmedi. Saatlerce açık
  bırakıp bellek eğrisine bakmak gerekiyor.
- `prefers-reduced-motion` açıksa tören atlanıyor (motor öyle yazılmış) —
  ekran laptopunda bu ayar açıksa sahne sönük kalır, operatöre söylenmeli.

---

## 3. Bu gülün açtığı fikirler (v2 defterine)

Kapsam dışı ama motor bunları neredeyse bedava veriyor:

- **Gece sonu videosu:** final animasyonu ekran kaydına alınırsa çifte
  hediye edilecek 30 saniyelik bir kapanış çıkar.
- **Bahçe, tek gül değil:** motor tek gül çiziyor; masa/tür bazlı ikinci
  bir gül eklemek `rose` grubunu çoğaltmak demek.
- **Mevsim/tema paleti:** `PETAL_HUES` tek dizi. Kurumsal etkinlikte
  marka renkleri, düğünde pembe-altın — organizatör seçer.
- **Yaprak dokusu:** motor yaprağa doku bindirmeyi destekliyor
  (`petalOverlay`). Kurumsal müşteri logosunu yapraklara işleyebilir.
