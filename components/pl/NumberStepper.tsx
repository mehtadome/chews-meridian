interface NumberStepperProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  min?: number;
  placeholder?: string;
}

export function NumberStepper({ value, onChange, step = 1, min = 0, placeholder }: NumberStepperProps) {
  function decrement() {
    const next = (value ?? 0) - step;
    if (next < min) return;
    onChange(next);
  }

  function increment() {
    onChange((value ?? 0) + step);
  }

  return (
    <div className="pl-stepper">
      <button type="button" className="pl-stepper__btn" onClick={decrement}>−</button>
      <input
        className="pl-stepper__input"
        type="number"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? undefined : v);
        }}
      />
      <button type="button" className="pl-stepper__btn" onClick={increment}>+</button>
    </div>
  );
}
