interface NumberStepperProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  min?: number;
  placeholder?: string;
  error?: boolean;
}

export function NumberStepper({ value, onChange, step = 1, min = 0, placeholder, error }: NumberStepperProps) {
  function decrement() {
    const next = (value ?? 0) - step;
    if (next < min) return;
    onChange(next);
  }

  function increment() {
    onChange((value ?? 0) + step);
  }

  return (
    <div className="pl-stepper" style={error ? { borderColor: "var(--pl-red)" } : undefined}>
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
