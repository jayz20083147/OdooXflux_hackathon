import {
  earlyCloseSubscriptionAction,
  pauseSubscriptionAction,
  renewSubscriptionAction,
  resumeSubscriptionAction,
  transitionSubscriptionAction,
} from "@/app/actions/subscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_TRANSITIONS,
  formatDate,
  type SubscriptionStatus,
} from "@/lib/constants";

type SubscriptionLike = {
  id: string;
  status: string;
  pausedAt: Date | null;
  endDate: Date | null;
  plan: {
    frequency: string;
    endDate: Date | null;
    pauseAllowed: boolean;
    earlyClose: boolean;
    earlyCloseDays: number;
    autoRenew: boolean;
  } | null;
};

/**
 * Renders the status-machine transitions and lifecycle actions for a
 * subscription. Each action is a POST to a server action form.
 */
export function SubscriptionActions({
  subscription,
  isStaff,
}: {
  subscription: SubscriptionLike;
  isStaff: boolean;
}) {
  const status = subscription.status as SubscriptionStatus;
  const transitions = SUBSCRIPTION_TRANSITIONS[status] ?? [];
  const plan = subscription.plan;
  const paused = Boolean(subscription.pausedAt);

  const canPause = plan?.pauseAllowed && status === "ACTIVE" && !paused;
  const canResume = status === "ACTIVE" && paused;
  const canEarlyClose = plan?.earlyClose && status === "ACTIVE";
  const canRenew = (plan?.autoRenew || isStaff) && status !== "DRAFT";

  const nothing =
    transitions.length === 0 &&
    !canPause &&
    !canResume &&
    !canEarlyClose &&
    !canRenew;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {transitions.map((to) => (
        <form key={to} action={transitionSubscriptionAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <input type="hidden" name="to" value={to} />
          <Button type="submit" size="sm">
            Move to {SUBSCRIPTION_STATUS_LABEL[to]}
          </Button>
        </form>
      ))}

      {canPause ? (
        <form action={pauseSubscriptionAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <Button type="submit" size="sm" variant="secondary">
            Pause
          </Button>
        </form>
      ) : null}

      {canResume ? (
        <form action={resumeSubscriptionAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <Button type="submit" size="sm" variant="secondary">
            Resume
          </Button>
        </form>
      ) : null}

      {canEarlyClose ? (
        <form action={earlyCloseSubscriptionAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <Button type="submit" size="sm" variant="outline">
            Early close
            {plan && plan.earlyCloseDays > 0 ? ` (${plan.earlyCloseDays}d)` : ""}
          </Button>
        </form>
      ) : null}

      {canRenew ? (
        <form action={renewSubscriptionAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <Button type="submit" size="sm" variant="outline">
            Renew
          </Button>
        </form>
      ) : null}

      {paused ? <Badge variant="warning">Paused</Badge> : null}

      {nothing ? (
        <span className="text-xs text-muted-foreground">No actions available.</span>
      ) : null}
    </div>
  );
}

export function subscriptionStatusVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "CONFIRMED":
      return "default" as const;
    case "QUOTATION":
      return "warning" as const;
    case "CLOSED":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function invoiceStatusVariant(status: string) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "CONFIRMED":
      return "default" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

/** Badge variant for a derived invoice payment state. */
export function paymentStateVariant(state: string) {
  switch (state) {
    case "PAID":
      return "success" as const;
    case "PARTIAL":
      return "warning" as const;
    case "OUTSTANDING":
      return "default" as const;
    case "OVERDUE":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export { formatDate };
