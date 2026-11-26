import { useEffect, useState } from 'react';
import { Bus, ShieldAlert, X } from 'lucide-react';
import {
  DEPARTURE_WAVES,
  STANDARD_BUS_CAPACITY,
  calculateRouteShortage,
  formatNaira,
  validateDeployBusForm,
} from '../lib/voyaEngine';
import type { DepartureWave, RouteData } from '../lib/voyaTypes';

interface DeployBusModalProps {
  route: RouteData | null;
  onClose: () => void;
  onConfirmDeploy: (payload: {
    routeId: RouteData['id'];
    plateNumber: string;
    lockedFare: number;
    wave: DepartureWave;
  }) => void;
}

const DEFAULT_PLATES: Record<RouteData['id'], string> = {
  lagos: 'OYO-482-LA',
  ibadan: 'OYO-319-IB',
  abuja: 'ABJ-741-FC',
  ilorin: 'KWR-528-IL',
};

export function DeployBusModal({ route, onClose, onConfirmDeploy }: DeployBusModalProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [lockedFareInput, setLockedFareInput] = useState('');
  const [wave, setWave] = useState<DepartureWave>('9:00 AM');
  const [errors, setErrors] = useState<{ plateNumber?: string; lockedFare?: string }>({});

  useEffect(() => {
    if (!route) return;
    setPlateNumber(DEFAULT_PLATES[route.id]);
    setLockedFareInput(String(route.fare));
    setWave(route.buses.length % 2 === 0 ? '11:00 AM' : '9:00 AM');
    setErrors({});
  }, [route]);

  useEffect(() => {
    if (!route) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [route, onClose]);

  if (!route) return null;

  const currentShortage = calculateRouteShortage(route);
  const projectedShortage = Math.max(0, currentShortage - STANDARD_BUS_CAPACITY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericFare = Number(lockedFareInput);
    const validation = validateDeployBusForm(plateNumber, numericFare);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    onConfirmDeploy({
      routeId: route.id,
      plateNumber: plateNumber.trim().toUpperCase(),
      lockedFare: numericFare,
      wave,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-bus-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#0D131F] border border-white/15 shadow-[0_0_50px_rgba(245,158,11,0.14)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-[#05070A]/70 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              Fleet Dispatch · +{STANDARD_BUS_CAPACITY} Seat Unit
            </p>
            <h2 id="deploy-bus-modal-title" className="mt-1 font-heading text-xl font-bold text-white">
              Deploy +{STANDARD_BUS_CAPACITY} Seat Bus — {route.destination}
            </h2>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Origin: {route.origin} · Corridor {route.corridorCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close deploy bus modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#05070A]/80 border border-white/10">
            <div>
              <p className="text-xs text-[#94A3B8]">Current Shortage</p>
              <p className="mt-0.5 font-mono-tabular text-lg font-bold text-red-400">
                {currentShortage}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">Injected Seats</p>
              <p className="mt-0.5 font-mono-tabular text-lg font-bold text-[#10B981]">
                +{STANDARD_BUS_CAPACITY}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">Projected Shortage</p>
              <p className="mt-0.5 font-mono-tabular text-lg font-bold text-white">
                {projectedShortage}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="deploy-plate-number"
              className="block text-sm font-semibold text-slate-200 mb-1.5"
            >
              Vehicle Plate Number
            </label>
            <input
              id="deploy-plate-number"
              type="text"
              value={plateNumber}
              onChange={(e) => {
                setPlateNumber(e.target.value.toUpperCase());
                setErrors((prev) => ({ ...prev, plateNumber: undefined }));
              }}
              placeholder="e.g. OYO-482-LA"
              className={`w-full px-3.5 py-2.5 rounded-xl border font-mono-tabular text-sm bg-[#05070A] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 min-h-[44px] ${
                errors.plateNumber ? 'border-red-500' : 'border-white/15'
              }`}
              required
            />
            {errors.plateNumber && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                {errors.plateNumber}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="deploy-locked-fare"
                className="block text-sm font-semibold text-slate-200 mb-1.5"
              >
                Locked Fare (₦)
              </label>
              <input
                id="deploy-locked-fare"
                type="number"
                min={500}
                step={500}
                value={lockedFareInput}
                onChange={(e) => {
                  setLockedFareInput(e.target.value);
                  setErrors((prev) => ({ ...prev, lockedFare: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono-tabular text-sm bg-[#05070A] text-white focus:outline-none focus:border-emerald-500/60 min-h-[44px] ${
                  errors.lockedFare ? 'border-red-500' : 'border-white/15'
                }`}
                required
              />
              {errors.lockedFare && (
                <p className="mt-1.5 text-xs text-red-400" role="alert">
                  {errors.lockedFare}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="deploy-wave"
                className="block text-sm font-semibold text-slate-200 mb-1.5"
              >
                Departure Wave
              </label>
              <select
                id="deploy-wave"
                value={wave}
                onChange={(e) => setWave(e.target.value as DepartureWave)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 text-sm bg-[#05070A] text-white focus:outline-none focus:border-emerald-500/60 min-h-[44px] [&>option]:bg-[#0B1120] [&>option]:text-white"
              >
                {DEPARTURE_WAVES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Locked fare ({formatNaira(Number(lockedFareInput) || route.fare)}) is held in
            Interswitch Escrow until QR boarding verification completes.
          </p>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-medium text-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#05070A] font-bold text-sm transition-all cursor-pointer h-12 shadow-[0_0_24px_rgba(245,158,11,0.3)]"
            >
              <Bus className="w-4 h-4" />
              Confirm +{STANDARD_BUS_CAPACITY} Seat Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
