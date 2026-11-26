import type { BusSeatSlot } from '../lib/voyaTypes';

interface HiaceSeatMapProps {
  busNumber: number;
  plateNumber: string;
  seats: BusSeatSlot[];
  selectedSeat: number | null;
  onSelectSeat: (seatNumber: number) => void;
}

function SteeringWheelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 14.2V21" />
      <path d="M9.9 11.2L3.6 9.5" />
      <path d="M14.1 11.2L20.4 9.5" />
    </svg>
  );
}

export function HiaceSeatMap({
  busNumber,
  plateNumber,
  seats,
  selectedSeat,
  onSelectSeat,
}: HiaceSeatMapProps) {
  const slotByNumber = new Map<number, BusSeatSlot>();
  for (const s of seats) {
    slotByNumber.set(s.seatNumber, s);
  }

  const renderSeatButton = (seatNumber: number, tag?: string) => {
    const slot = slotByNumber.get(seatNumber);
    const isBooked = !slot || slot.status === 'booked';
    const isSelected = selectedSeat === seatNumber;

    return (
      <button
        key={seatNumber}
        type="button"
        disabled={isBooked}
        onClick={() => !isBooked && onSelectSeat(seatNumber)}
        aria-pressed={isSelected}
        aria-label={`Seat ${seatNumber}, ${
          isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'
        }`}
        className={`relative h-14 sm:h-15 rounded-xl border font-mono-tabular transition-all flex flex-col items-center justify-center select-none ${
          isBooked
            ? 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed'
            : isSelected
              ? 'bg-emerald-500 text-black font-bold border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.45)] cursor-pointer scale-[1.03]'
              : 'bg-[#05070A]/80 text-white border-white/20 hover:border-emerald-400/70 hover:bg-emerald-500/10 cursor-pointer'
        }`}
      >
        {/* Top headrest bar */}
        <span
          aria-hidden="true"
          className={`w-7 h-1 rounded-full mb-1 ${
            isBooked
              ? 'bg-slate-700/70'
              : isSelected
                ? 'bg-black/35'
                : 'bg-white/25'
          }`}
        />
        <span className="text-sm leading-none">{seatNumber}</span>
        {tag && (
          <span
            className={`mt-0.5 text-[9px] uppercase tracking-wider leading-none ${
              isBooked
                ? 'text-slate-600'
                : isSelected
                  ? 'text-black/75 font-bold'
                  : 'text-[#94A3B8]'
            }`}
          >
            {tag}
          </span>
        )}
      </button>
    );
  };

  const availableCount = seats.filter((s) => s.status === 'available').length;

  return (
    <div className="rounded-2xl bg-[#0D131F]/80 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header + Legend */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
            14-Seater AC Hiace Cabin
          </p>
          <h2 className="mt-0.5 font-heading text-lg font-bold text-white">
            Select Your Seat · Bus #{busNumber}
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono-tabular">
            Plate {plateNumber} · {availableCount}{' '}
            {availableCount === 1 ? 'seat' : 'seats'} open
          </p>
        </div>

        {/* Color Legend */}
        <div
          className="flex flex-wrap items-center gap-3 text-[11px] text-[#94A3B8]"
          aria-label="Seat status legend"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#05070A] border border-white/25 inline-block" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white/5 border border-white/10 inline-block" />
            Booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
            Selected
          </span>
        </div>
      </div>

      {/* Dark Vehicle Chassis Outline */}
      <div className="max-w-sm mx-auto rounded-[2rem] bg-[#05070A]/85 border-2 border-white/15 p-4 sm:p-5 space-y-3.5 relative">
        {/* Front Windshield Arc */}
        <div
          className="mx-6 h-2 rounded-t-full bg-gradient-to-r from-white/5 via-emerald-500/35 to-white/5 border-t border-white/20"
          aria-hidden="true"
        />
        <p className="text-center text-[10px] font-mono-tabular uppercase tracking-widest text-slate-500 -mt-1">
          Front · Windshield
        </p>

        {/* Row 1: Driver (top-left) + Seat 1 */}
        <div className="grid grid-cols-4 gap-2.5 items-center pt-1 pb-2 border-b border-dashed border-white/10">
          <div className="col-span-2 h-14 sm:h-15 rounded-xl bg-white/[0.03] border border-white/10 px-3 flex items-center gap-2.5 text-[#94A3B8]">
            <SteeringWheelIcon className="w-6 h-6 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 leading-tight">
                Driver
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">Cabin</p>
            </div>
          </div>

          <div
            className="flex flex-col items-center justify-center text-[9px] uppercase tracking-wider text-slate-500"
            aria-hidden="true"
          >
            <span>Door</span>
            <span>→</span>
          </div>

          {renderSeatButton(1, 'Front')}
        </div>

        {/* Row 2: Seats 2, 3, [Aisle], 4 */}
        <div className="grid grid-cols-4 gap-2.5 items-center">
          {renderSeatButton(2)}
          {renderSeatButton(3)}
          <div
            className="flex items-center justify-center h-full text-[10px] font-mono-tabular text-slate-600"
            aria-hidden="true"
          >
            ┆
          </div>
          {renderSeatButton(4)}
        </div>

        {/* Row 3: Seats 5, 6, [Aisle], 7 */}
        <div className="grid grid-cols-4 gap-2.5 items-center">
          {renderSeatButton(5)}
          {renderSeatButton(6)}
          <div
            className="flex items-center justify-center h-full text-[10px] font-mono-tabular text-slate-600"
            aria-hidden="true"
          >
            ┆
          </div>
          {renderSeatButton(7)}
        </div>

        {/* Row 4: Seats 8, 9, [Aisle], 10 */}
        <div className="grid grid-cols-4 gap-2.5 items-center">
          {renderSeatButton(8)}
          {renderSeatButton(9)}
          <div
            className="flex items-center justify-center h-full text-[10px] font-mono-tabular text-slate-600"
            aria-hidden="true"
          >
            ┆
          </div>
          {renderSeatButton(10)}
        </div>

        {/* Row 5 (Rear Bench): Seats 11, 12, 13, 14 */}
        <div className="pt-2 border-t border-dashed border-white/10">
          <div className="grid grid-cols-4 gap-2.5 items-center">
            {renderSeatButton(11)}
            {renderSeatButton(12)}
            {renderSeatButton(13)}
            {renderSeatButton(14, 'Back')}
          </div>
        </div>

        <p className="text-center text-[10px] font-mono-tabular uppercase tracking-widest text-slate-500 pt-1">
          Rear Bench · AC Vents Overhead
        </p>
      </div>
    </div>
  );
}
