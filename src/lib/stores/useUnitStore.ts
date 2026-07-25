import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UnitSystem } from '../units';

interface UnitState {
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => void;
  toggleUnitSystem: () => void;
}

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      unitSystem: 'METRIC',
      setUnitSystem: (unitSystem: UnitSystem) => set({ unitSystem }),
      toggleUnitSystem: () =>
        set((state) => ({
          unitSystem: state.unitSystem === 'METRIC' ? 'IMPERIAL' : 'METRIC',
        })),
    }),
    {
      name: 'kavriolab_unit_system',
    }
  )
);
