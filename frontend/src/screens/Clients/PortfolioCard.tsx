import { TrendingDown, TrendingUp } from 'lucide-react'
import { DEMO_PORTFOLIO, DEMO_PORTFOLIO_TOTAL, type DemoHolding } from '../../lib/mock'
import { formatCurrency } from '../../lib/format'
import { Badge, DemoTag } from '../../components/ui/Badge'
import { SectionLabel } from '../../components/ui/Card'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const CLASS_COLOR: Record<DemoHolding['assetClass'], string> = {
  Equity: 'bg-accent-500',
  'Fixed Income': 'bg-navy-600',
  Cash: 'bg-success-500',
  Alternatives: 'bg-warning-500',
}

export function PortfolioCard() {
  const byClass = DEMO_PORTFOLIO.reduce<Record<string, number>>((acc, h) => {
    acc[h.assetClass] = (acc[h.assetClass] ?? 0) + h.weight
    return acc
  }, {})

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-surface-border">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Portfolio snapshot</h3>
          <p className="text-2xs text-ink-400 mt-0.5">Total assets under management</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-ink-900 tnum leading-none">
            {formatCurrency(DEMO_PORTFOLIO_TOTAL)}
          </div>
          <div className="mt-1 flex justify-end">
            <DemoTag />
          </div>
        </div>
      </div>

      {/* Allocation bar */}
      <div className="px-5 py-4 border-b border-surface-border">
        <SectionLabel className="mb-2">Allocation</SectionLabel>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {Object.entries(byClass).map(([cls, weight]) => (
            <div
              key={cls}
              className={cx(CLASS_COLOR[cls as DemoHolding['assetClass']])}
              style={{ width: `${weight}%` }}
              title={`${cls} · ${weight}%`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(byClass).map(([cls, weight]) => (
            <div key={cls} className="flex items-center gap-1.5 text-2xs text-ink-600">
              <span className={cx('h-2 w-2 rounded-sm', CLASS_COLOR[cls as DemoHolding['assetClass']])} />
              {cls} <span className="font-medium text-ink-900 tnum">{weight}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-2xs uppercase tracking-wider text-ink-400">
            <th className="text-left font-medium px-5 py-2">Holding</th>
            <th className="text-left font-medium px-2 py-2 hidden sm:table-cell">Class</th>
            <th className="text-right font-medium px-2 py-2">Value</th>
            <th className="text-right font-medium px-2 py-2">Wt.</th>
            <th className="text-right font-medium px-5 py-2">Day</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {DEMO_PORTFOLIO.map((h) => {
            const up = h.dayChangePct >= 0
            return (
              <tr key={h.symbol} className="hover:bg-surface-base/60">
                <td className="px-5 py-2.5">
                  <div className="font-medium text-ink-900">{h.symbol}</div>
                  <div className="text-2xs text-ink-400">{h.name}</div>
                </td>
                <td className="px-2 py-2.5 hidden sm:table-cell">
                  <Badge tone="neutral">{h.assetClass}</Badge>
                </td>
                <td className="px-2 py-2.5 text-right tnum text-ink-700">{formatCurrency(h.value, true)}</td>
                <td className="px-2 py-2.5 text-right tnum text-ink-700">{h.weight}%</td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={cx(
                      'inline-flex items-center gap-1 tnum font-medium',
                      up ? 'text-success-600' : 'text-danger-600',
                    )}
                  >
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? '+' : ''}
                    {h.dayChangePct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
