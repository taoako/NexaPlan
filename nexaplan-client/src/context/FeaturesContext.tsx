// src/context/FeaturesContext.tsx
import { createContext, useContext } from 'react';

export interface TierFeatures {
  currentTier:            string;
  canUseMLPrediction:     boolean;
  canUseConfidenceBands:  boolean;
  canUseAnomalyDetection: boolean;
  canUseScenarios:        boolean;
  canSubmitPitch:         boolean;
  canSeeMLVarianceCol:    boolean;
  maxScenarios:           number;
  maxDepartments:         number;
  maxUsers:               number;
  historyMonths:          number;
}

export const FeaturesContext = createContext<TierFeatures | null>(null);

// Safe hook that returns null if not ready, but we'll use optional chaining in components
export const useFeatures = () => useContext(FeaturesContext);
