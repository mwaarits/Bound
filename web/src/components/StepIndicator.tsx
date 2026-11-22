'use client';

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center justify-between gap-2 w-full" aria-label="Tahapan">
      {steps.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <li key={label} className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-7 h-7 rounded-full text-caption font-semibold flex items-center justify-center shrink-0 transition-colors ${
                  done
                    ? 'bg-brand-primary text-text-on-dark'
                    : active
                      ? 'bg-brand-surface text-brand-primary border-2 border-brand-primary'
                      : 'bg-bg-surface text-text-secondary border border-border-subtle'
                }`}
              >
                {done ? '✓' : idx + 1}
              </span>
              <span
                className={`text-caption sm:text-body-sm truncate ${
                  active || done ? 'font-semibold text-text-primary' : 'text-text-secondary'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`hidden sm:block flex-1 h-0.5 rounded-full ${
                  done ? 'bg-brand-primary' : 'bg-border-subtle'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
