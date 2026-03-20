import { useTranslations } from "next-intl";
import CardComponent from "../Card";

export default function HeroHand({
  cards,
  fourColor = false,
}: {
  cards: { rank: string; suit: string }[];
  fourColor?: boolean;
}) {
  const t = useTranslations("train");
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t("yourHand")}</p>
      <div className="flex gap-2">
        {cards.map((card, i) => (
          <CardComponent key={i} rank={card.rank} suit={card.suit} fourColor={fourColor} size="xl" />
        ))}
      </div>
    </div>
  );
}
