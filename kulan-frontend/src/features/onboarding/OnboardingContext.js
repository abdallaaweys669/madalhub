import React, { createContext, useContext, useState } from "react";

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null); // ISO date string for DOB
  const [interests, setInterests] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1..4, in-memory only
  const [completed, setCompleted] = useState(false);

  const markCompleted = () => setCompleted(true);

  const value = {
    location,
    setLocation,
    gender,
    setGender,
    age,
    setAge,
    interests,
    setInterests,
    currentStep,
    setCurrentStep,
    completed,
    markCompleted,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
