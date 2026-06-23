import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  HelpCircle,
  Mic,
  Pause,
  Play,
  Sparkles,
  Square,
  Target,
  TriangleAlert,
} from 'lucide-react'
import {
  DEMO_LIVE_CONCERNS,
  DEMO_LIVE_GOALS,
  DEMO_LIVE_QUESTIONS,
  DEMO_MEETING_ACTIONS,
  DEMO_MEETING_CLIENT,
  DEMO_MEETING_SUMMARY,
  DEMO_MEETING_TYPE,
  DEMO_TRANSCRIPT,
} from '../../lib/mock'
import { initials } from '../../lib/format'
import { Badge, DemoTag } from '../../components/ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type Status = 'idle' | 'live' | 'paused' | 'ended'

function fmtClock(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function revealCount<T>(arr: T[], shown: number, total: number) {
  if (total === 0) return 0
  return Math.min(arr.length, Math.ceil((shown / total) * arr.length))
}

export function MeetingRoomScreen({ clientName }: { clientName?: string }) {
  const name = clientName || DEMO_MEETING_CLIENT
  const [status, setStatus] = useState<Status>('idle')
  const [shown, setShown] = useState(0) // transcript lines revealed
  const [seconds, setSeconds] = useState(0)
  const [summarized, setSummarized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const total = DEMO_TRANSCRIPT.length

  // Stream transcript lines while live
  useEffect(() => {
    if (status !== 'live') return
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= total) {
          window.clearInterval(id)
          setStatus('ended')
          return n
        }
        return n + 1
      })
    }, 1700)
    return () => window.clearInterval(id)
  }, [status, total])

  // Clock
  useEffect(() => {
    if (status !== 'live') return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [status])

  // Autoscroll transcript
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [shown])

  function reset() {
    setStatus('idle')
    setShown(0)
    setSeconds(0)
    setSummarized(false)
  }

  const lines = DEMO_TRANSCRIPT.slice(0, shown)
  const goals = DEMO_LIVE_GOALS.slice(0, revealCount(DEMO_LIVE_GOALS, shown, total))
  const concerns = DEMO_LIVE_CONCERNS.slice(0, revealCount(DEMO_LIVE_CONCERNS, shown, total))
  const questions = DEMO_LIVE_QUESTIONS.slice(0, revealCount(DEMO_LIVE_QUESTIONS, shown, total))

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 space-y-5">
      {/* Header / controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900 text-sm font-semibold text-white">
            {initials(name)}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-ink-900">{name}</h1>
              {status === 'live' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-50 px-2 py-0.5 text-2xs font-semibold text-danger-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger-500 animate-pulse" /> Recording
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {DEMO_MEETING_TYPE} · live copilot <span className="tnum">{fmtClock(seconds)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DemoTag />
          {status === 'idle' && (
            <button
              onClick={() => setStatus('live')}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-600"
            >
              <Play className="h-4 w-4" /> Start meeting
            </button>
          )}
          {status === 'live' && (
            <>
              <button
                onClick={() => setStatus('paused')}
                className="inline-flex items-center gap-1.5 rounded-md border border-surface-border-strong bg-surface-card px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-sunken"
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
              <button
                onClick={() => setStatus('ended')}
                className="inline-flex items-center gap-1.5 rounded-md border border-danger-200 bg-surface-card px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
              >
                <Square className="h-4 w-4" /> End
              </button>
            </>
          )}
          {status === 'paused' && (
            <button
              onClick={() => setStatus('live')}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-600"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          {status === 'ended' && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-surface-border-strong bg-surface-card px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-sunken"
            >
              Restart
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Transcript */}
        <div className="lg:col-span-2 rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-ink-400" />
              <h3 className="text-sm font-semibold text-ink-900">Live transcription</h3>
            </div>
            <Badge tone={status === 'live' ? 'success' : 'neutral'} dot={status === 'live'}>
              {status === 'live' ? 'Listening' : status === 'ended' ? 'Ended' : status === 'paused' ? 'Paused' : 'Ready'}
            </Badge>
          </div>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Meeting transcript"
            className="px-5 py-4 space-y-3 overflow-auto"
            style={{ minHeight: 320, maxHeight: 460 }}
          >
            {lines.length === 0 ? (
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-ink-400">
                  <Mic className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm text-ink-500">Press <strong className="text-ink-700">Start meeting</strong> to begin live transcription.</p>
                <p className="mt-1 text-2xs text-ink-400">The copilot will detect goals, concerns and follow-ups in real time.</p>
              </div>
            ) : (
              lines.map((l, i) => {
                const advisor = l.speaker === 'advisor'
                return (
                  <div key={i} className={cx('flex gap-2.5 animate-slide-up', advisor ? 'flex-row' : 'flex-row-reverse')}>
                    <span
                      className={cx(
                        'flex h-7 w-7 items-center justify-center rounded-full text-2xs font-semibold shrink-0',
                        advisor ? 'bg-accent-500 text-white' : 'bg-navy-900 text-white',
                      )}
                    >
                      {advisor ? 'You' : initials(name)}
                    </span>
                    <div
                      className={cx(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                        advisor ? 'bg-accent-50 text-ink-800' : 'bg-surface-sunken text-ink-700',
                      )}
                    >
                      {l.text}
                    </div>
                  </div>
                )
              })
            )}
            {status === 'live' && shown < total && (
              <div className="flex items-center gap-1 pl-9 text-ink-300" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </div>

        {/* Live AI insights */}
        <div className="space-y-4">
          <InsightCard icon={<Target className="h-4 w-4" />} title="Detected goals" tone="accent" items={goals} empty="Listening for goals…" />
          <InsightCard icon={<TriangleAlert className="h-4 w-4" />} title="Detected concerns" tone="warning" items={concerns} empty="Listening for concerns…" />
          <InsightCard icon={<HelpCircle className="h-4 w-4" />} title="Suggested questions" tone="violet" items={questions} empty="Generating follow-ups…" />
        </div>
      </div>

      {/* Post-meeting summary + CRM preview */}
      {status === 'ended' && (
        <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-500" />
              <h3 className="text-sm font-semibold text-ink-900">Post-meeting summary</h3>
            </div>
            {!summarized && (
              <button
                onClick={() => setSummarized(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate summary
              </button>
            )}
          </div>

          {!summarized ? (
            <div className="px-5 py-8 text-center text-sm text-ink-500">
              The meeting has ended. Generate an AI summary and proposed CRM updates for your review.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3 px-5 py-4 animate-fade-in">
              <div className="lg:col-span-2">
                <div className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Summary</div>
                <p className="text-sm leading-relaxed text-ink-700">{DEMO_MEETING_SUMMARY}</p>
                <div className="mt-3 text-2xs text-ink-400">
                  <span className="font-medium text-agent-summary">Summary Agent</span> · AI generated · review before saving
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                  Proposed CRM updates
                </div>
                <div className="space-y-2.5">
                  {DEMO_MEETING_ACTIONS.map((a, i) => (
                    <ActionPreview key={i} action={a} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InsightCard({
  icon,
  title,
  tone,
  items,
  empty,
}: {
  icon: React.ReactNode
  title: string
  tone: 'accent' | 'warning' | 'violet'
  items: string[]
  empty: string
}) {
  const toneColor = tone === 'accent' ? 'text-accent-600' : tone === 'warning' ? 'text-warning-600' : 'text-violet-600'
  const dotColor = tone === 'accent' ? 'bg-accent-400' : tone === 'warning' ? 'bg-warning-500' : 'bg-violet-500'
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border">
        <div className={cx('flex items-center gap-2 text-sm font-semibold text-ink-900')}>
          <span className={toneColor}>{icon}</span>
          {title}
        </div>
        {items.length > 0 && <Badge tone={tone}>{items.length}</Badge>}
      </div>
      <div className="px-4 py-3">
        {items.length === 0 ? (
          <p className="text-xs italic text-ink-400">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-700 animate-slide-up">
                <span className={cx('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />
                <span className="leading-snug">{it}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ActionPreview({ action }: { action: { kind: 'task' | 'note'; tool: string; title: string; detail: string } }) {
  const [approved, setApproved] = useState(false)
  const Icon = action.kind === 'task' ? ClipboardList : FileText
  return (
    <div className={cx('rounded-md border bg-surface-card p-3', approved ? 'border-success-200' : 'border-surface-border')}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-accent-50 text-accent-600 shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-ink-900">{action.title}</div>
          <p className="text-2xs text-ink-500 mt-0.5 leading-snug">{action.detail}</p>
          <code className="text-2xs text-ink-400">{action.tool}</code>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => setApproved((v) => !v)}
          className={cx(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-semibold transition-colors',
            approved
              ? 'border-success-500 bg-success-500 text-white'
              : 'border-success-200 bg-success-50 text-success-700 hover:bg-success-100',
          )}
        >
          {approved && <CheckCircle2 className="h-3 w-3" />}
          {approved ? 'Approved' : 'Approve & save'}
        </button>
      </div>
    </div>
  )
}
