"use client";

export default function MatrixTip() {
  return (
    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-1.5">
      <p className="font-semibold text-gray-300">Matrix bei einem Miss</p>
      <p>
        Schau auf das Board: welche{" "}
        <span className="text-lime-400 font-semibold">grünen Felder</span> haben getroffen — als
        Paar, Draw oder Set? Wer kann sich noch verbessern, du oder der Villain? Das sind die
        entscheidenden Fragen beim Review.
      </p>
      <p>
        Beachte: Paare auf der{" "}
        <span className="text-lime-400 font-semibold">Diagonale</span> sehen groß aus, kommen aber
        seltener vor (6 Kombos je Paar) als suited oder offsuit Hände (bis zu 16 Kombos). Ein
        einzelnes grünes Pair-Feld wiegt also weniger als es wirkt.
      </p>
      <p>
        Liegt dein weißes Feld{" "}
        <span className="text-gray-200 font-semibold">mitten im Grünen</span>, ist deine Hand ein
        typischer Vertreter der Range — ~50% Equity ist normal. Liegt es{" "}
        <span className="text-gray-200 font-semibold">außerhalb</span>, wirst du von der Range
        öfter dominiert.
      </p>
    </div>
  );
}
