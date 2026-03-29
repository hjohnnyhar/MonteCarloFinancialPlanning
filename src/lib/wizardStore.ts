type Listener = () => void;
let _stepIndex = 0;
let _completedSteps: number[] = [];
const _listeners = new Set<Listener>();

export const wizardStore = {
  getStepIndex: () => _stepIndex,
  setStepIndex: (i: number) => { if (_stepIndex === i) return; _stepIndex = i; _listeners.forEach(l => l()); },
  getCompletedSteps: () => _completedSteps,
  setCompletedSteps: (s: number[]) => { _completedSteps = s; _listeners.forEach(l => l()); },
  subscribe: (listener: Listener) => {
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  },
};
