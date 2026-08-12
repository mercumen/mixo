import type { Metadata } from "next";
import { CreateEventFlow } from "../_components/create-event-flow";

export const metadata: Metadata = {
  title: "Etkinliğinizi Yaratın — MIXOinteractive",
  description:
    "Etkinlik türünüzü, katılımcı sayınızı ve etkinlik adınızı seçin; şovunuz dakikalar içinde hazır.",
  // Kurulum akışı arama sonuçlarında görünmesin
  robots: { index: false, follow: false },
};

export default function CreateEventPage() {
  return <CreateEventFlow />;
}
