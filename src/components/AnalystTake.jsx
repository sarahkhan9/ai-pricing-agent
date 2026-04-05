export default function AnalystTake({ analysis, onPracticeQuestion }) {
  const company = analysis?.company ?? "";
  const biggestLever = analysis?.biggest_lever ?? "";
  const leverReason = analysis?.lever_reason ?? "";
  const keyRisk = analysis?.key_risk ?? "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-gray-950/20 border border-gray-800 rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-wide text-gray-400">Biggest lever</div>
          <div className="mt-2 font-mono text-xs text-yellow-300">{biggestLever}</div>
          <div className="mt-2 text-sm text-gray-200 leading-relaxed">{leverReason}</div>
        </div>

        <div className="bg-gray-950/20 border border-gray-800 rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-wide text-gray-400">Key risk</div>
          <div className="mt-2 text-sm text-gray-200 leading-relaxed">{keyRisk}</div>
        </div>
      </div>

      <div className="bg-gray-950/30 border border-gray-800 rounded-lg p-4">
        <button
          type="button"
          onClick={onPracticeQuestion}
          className="w-full bg-gray-900 border border-yellow-400/40 hover:border-yellow-400 rounded-lg px-4 py-3 font-mono text-yellow-300"
        >
          Practice a tough question about {company} →
        </button>
        <div className="mt-2 text-xs text-gray-500 font-mono">
          You'll get a direct investor-style monetization prompt and evaluation.
        </div>
      </div>
    </div>
  );
}

