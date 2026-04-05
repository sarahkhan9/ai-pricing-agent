import { useMemo } from "react";

export default function SearchBar({ value, onChange, onSubmit, quickPicks = [], disabled }) {
  const placeholder = useMemo(
    () => "Enter any company - e.g. Mercury, Duolingo, Figma...",
    [],
  );

  function handleFormSubmit(e) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <form onSubmit={handleFormSubmit} className="mt-2">
      <div className="flex gap-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm outline-none font-mono"
        />
        <button
          type="submit"
          disabled={disabled}
          className="bg-gray-900 border border-yellow-400/40 rounded-lg px-4 py-3 text-sm font-mono text-yellow-400 hover:border-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Build model
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickPicks.map((c) => {
          const key = String(c);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              disabled={disabled}
              className="text-xs font-mono px-3 py-1 rounded-full border border-gray-800 bg-gray-900 text-gray-200 hover:border-gray-600 disabled:opacity-60"
            >
              {key}
            </button>
          );
        })}
      </div>
    </form>
  );
}

