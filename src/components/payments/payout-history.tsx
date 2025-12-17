import { formatPrice, formatDate } from '@/lib/utils'
import type Stripe from 'stripe'

type PayoutStatus = 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed'

interface PayoutHistoryProps {
  payouts: Stripe.Payout[]
  availableBalance: number
  pendingBalance: number
}

export function PayoutHistory({ payouts, availableBalance, pendingBalance }: PayoutHistoryProps) {
  return (
    <div className="space-y-6">
      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="text-sm text-text-muted">Available</div>
          <div className="text-2xl font-mono text-accent-green">
            {formatPrice(availableBalance)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-text-muted">Pending</div>
          <div className="text-2xl font-mono text-text-secondary">
            {formatPrice(pendingBalance)}
          </div>
        </div>
      </div>

      {/* Payout list */}
      <div>
        <h3 className="font-display text-lg mb-4">Recent Payouts</h3>

        {payouts.length === 0 ? (
          <p className="text-text-muted">No payouts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Arrival</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{formatDate(new Date(payout.created * 1000))}</td>
                  <td className="font-mono">{formatPrice(payout.amount)}</td>
                  <td>
                    <PayoutStatusBadge status={payout.status as PayoutStatus} />
                  </td>
                  <td className="text-text-muted">
                    {formatDate(new Date(payout.arrival_date * 1000))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const statusConfig = {
    paid: { label: 'Paid', className: 'badge-green' },
    pending: { label: 'Pending', className: 'badge-yellow' },
    in_transit: { label: 'In Transit', className: 'badge-blue' },
    canceled: { label: 'Canceled', className: 'badge-red' },
    failed: { label: 'Failed', className: 'badge-red' },
  }

  const config = statusConfig[status]

  return <span className={`badge ${config.className}`}>{config.label}</span>
}

// Simple balance display
export function BalanceDisplay({ available, pending }: { available: number; pending: number }) {
  return (
    <div className="text-sm">
      <span className="text-accent-green font-mono">{formatPrice(available)}</span>
      <span className="text-text-muted"> available</span>
      {pending > 0 && (
        <>
          <span className="text-text-muted"> · </span>
          <span className="font-mono">{formatPrice(pending)}</span>
          <span className="text-text-muted"> pending</span>
        </>
      )}
    </div>
  )
}
