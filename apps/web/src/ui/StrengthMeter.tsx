import "./StrengthMeter.css";

type StrengthZone = "weak" | "ok" | "good" | "strong";

type StrengthMeterProps = {
  password: string;
};

export function passwordSegments(password: string): number {
  if (!password) {
    return 0;
  }

  let score = 0;
  score += Math.min(password.length, 12);

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 2;
  }

  return Math.min(score, 16);
}

function strengthZone(segments: number): StrengthZone {
  if (segments <= 3) {
    return "weak";
  }

  if (segments <= 7) {
    return "ok";
  }

  if (segments <= 11) {
    return "good";
  }

  return "strong";
}

function strengthLabel(zone: StrengthZone) {
  switch (zone) {
    case "weak":
      return "fraca";
    case "ok":
      return "ok";
    case "good":
      return "boa";
    case "strong":
      return "forte";
  }
}

export function StrengthMeter({ password }: StrengthMeterProps) {
  const segments = passwordSegments(password);

  if (segments === 0) {
    return null;
  }

  const zone = strengthZone(segments);
  const label = strengthLabel(zone);

  return (
    <div className={`strength strength--${zone}`}>
      <div
        className="strength__meter"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={16}
        aria-valuenow={segments}
        aria-valuetext={label}
      >
        {Array.from({ length: 16 }, (_, index) => {
          const filled = index < segments;
          const lastFilled = index === segments - 1;

          return (
            <span
              className={[
                "strength__segment",
                filled ? "strength__segment--on" : "",
                lastFilled ? "strength__segment--last" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={index}
            />
          );
        })}
      </div>
      <p className="strength__label">{label}</p>
    </div>
  );
}
