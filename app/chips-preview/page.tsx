import PokerChip from "@/components/PokerChip";

export default function ChipsPreview() {
  return (
    <div className="min-h-screen bg-gray-900 p-12">
      <h1 className="text-white text-2xl font-bold mb-10">Chip Preview</h1>

      <section className="mb-10">
        <h2 className="text-blue-300 text-sm uppercase tracking-widest mb-4">Hand vs Range — blue</h2>
        <div className="flex gap-6 items-end">
          <PokerChip color="blue" value={5} />
          <PokerChip color="blue" value={25} />
          <PokerChip color="blue" value={50} />
          <PokerChip color="blue" value={100} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-green-300 text-sm uppercase tracking-widest mb-4">Pot Odds — green</h2>
        <div className="flex gap-6 items-end">
          <PokerChip color="green" value={5} />
          <PokerChip color="green" value={25} />
          <PokerChip color="green" value={50} />
          <PokerChip color="green" value={100} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-red-300 text-sm uppercase tracking-widest mb-4">Leak Training — red</h2>
        <div className="flex gap-6 items-end">
          <PokerChip color="red" value={5} />
          <PokerChip color="red" value={25} />
          <PokerChip color="red" value={50} />
          <PokerChip color="red" value={100} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-orange-300 text-sm uppercase tracking-widest mb-4">Streaks — fire</h2>
        <div className="flex gap-6 items-end flex-wrap">
          <PokerChip color="fire" value={1} />
          <PokerChip color="fire" value={5} />
          <PokerChip color="fire" value={10} />
          <PokerChip color="fire" value={25} />
          <PokerChip color="fire" value={50} />
          <PokerChip color="fire" value={100} />
          <PokerChip color="fire" value={500} />
          <PokerChip color="fire" value={1000} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-yellow-300 text-sm uppercase tracking-widest mb-4">Size variants — gold 100</h2>
        <div className="flex gap-6 items-end">
          <PokerChip color="gold" value={100} size={48} />
          <PokerChip color="gold" value={100} size={80} />
          <PokerChip color="gold" value={100} size={120} />
          <PokerChip color="gold" value={100} size={160} />
        </div>
      </section>
    </div>
  );
}
