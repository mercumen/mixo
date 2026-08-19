import { requireOwnedEvent } from "@/lib/event-access";
import { getDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/schema";

/**
 * ÖDEME — şimdilik sahte.
 *
 * Gerçek ödeme sağlayıcısı CLAUDE.md'de kapsam dışı (v2). Bu uç, akışın
 * geri kalanı test edilebilsin diye var: panelde "Ödemeye Geç" düğmesi
 * buraya vuruyor ve etkinlik ödenmiş sayılıyor.
 *
 * SAĞLAYICI GELDİĞİNDE: bu uç ödeme başlatmaya (checkout oturumu) dönüşecek,
 * `paid` alanını sağlayıcının webhook'u yazacak. Alanın anlamı ve ona bakan
 * yerler (misafir girişi, panel kilitleri) DEĞİŞMEYECEK — bugünkü sahte
 * düğme yarın çöpe gitmiyor, sadece arkası değişiyor.
 *
 * Ödeme TERSİNE ÇEVRİLMİYOR: iade/iptal bir muhasebe işi, panelden tek
 * tıkla yapılacak bir şey değil.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireOwnedEvent(id);
  if (!access.ok) return access.response;

  if (access.event.paid) {
    return Response.json({ ok: true, paid: true, zatenOdenmis: true });
  }

  if (!access.event.planId) {
    return Response.json({ error: "Önce bir paket seçin." }, { status: 400 });
  }

  const paidAt = new Date().toISOString();
  await getDb().doc(paths.event(id)).update({ paid: true, paidAt });

  return Response.json({ ok: true, paid: true, paidAt });
}
