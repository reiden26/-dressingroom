import { create } from 'zustand';
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
  setUserProfile: (profile: UserProfile) => void;
  addCapturedPose: (pose: CapturedPose) => void;
  clearPoses: () => void;
  setCurrentStep: (step: ScanStep) => void;
  selectGarment: (garment: GarmentItem | null) => void;
  addGarmentToCatalog: (garment: GarmentItem) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  userProfile: null,
  capturedPoses: [],
  currentStep: 'height',
  isScanning: false,
  garmentCatalog: [],
  selectedGarment: null,

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
}));
