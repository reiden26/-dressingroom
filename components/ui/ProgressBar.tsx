interface ProgressBarProps {
  current: number;
  total: number;
  labels?: string[];
  className?: string;
}

export default function ProgressBar({ current, total, labels, className = '' }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-2">
        {labels?.map((label, index) => (
          <span
            key={label}
            className={`text-xs font-medium ${
              index <= current ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
