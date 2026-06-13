import React, { createContext, useContext, useState } from "react";

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const [data, setData] = useState({
    location: "",
    gender: "",
    dob: "",
    interests: [],
  });

  const update = (values) => {
    setData((prev) => ({ ...prev, ...values }));
  };

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
