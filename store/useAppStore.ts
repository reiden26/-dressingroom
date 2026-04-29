import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, CapturedPose, GarmentItem, ScanStep } from '@/lib/types';

interface AppState {
  userProfile: UserProfile | null;
  capturedPoses: CapturedPose[];
  currentStep: ScanStep;
  isScanning: boolean;
  garmentCatalog: GarmentItem[];
  selectedGarment: GarmentItem | null;
}

interface AppActions {
  setUserProfile: (profile: UserProfile | null) => void;
  addCapturedPose: (pose: CapturedPose) => void;
  clearPoses: () => void;
  setCurrentStep: (step: ScanStep) => void;
  selectGarment: (garment: GarmentItem | null) => void;
  addGarmentToCatalog: (garment: GarmentItem) => void;
  resetAll: () => void;
}

const initialState: AppState = {
  userProfile: null,
  capturedPoses: [],
  currentStep: 'height',
  isScanning: false,
  garmentCatalog: [],
  selectedGarment: null,
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,

      setUserProfile: (profile) => set({ userProfile: profile }),

      addCapturedPose: (pose) =>
        set((state) => {
          const existing = state.capturedPoses.findIndex((p) => p.poseId === pose.poseId);
          if (existing >= 0) {
            const updated = [...state.capturedPoses];
            updated[existing] = pose;
            return { capturedPoses: updated };
          }
          return { capturedPoses: [...state.capturedPoses, pose] };
        }),

      clearPoses: () => set({ capturedPoses: [] }),

      setCurrentStep: (step) => set({ currentStep: step }),

      selectGarment: (garment) => set({ selectedGarment: garment }),

      addGarmentToCatalog: (garment) =>
        set((state) => ({ garmentCatalog: [...state.garmentCatalog, garment] })),

      resetAll: () => set({ ...initialState }),
    }),
    {
      name: 'vfr-app-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user profile. Captured poses contain large base64
      // image data URLs (and PII) — those live in IndexedDB, not localStorage.
      // The garment catalog is rebuilt from the static catalogue on each load.
      partialize: (state) => ({
        userProfile: state.userProfile,
      }),
    }
  )
);
