"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Layers, ShoppingBag, Sparkles, Tag, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

import { customerSubscribeAction } from "@/app/actions/subscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  formatCurrency,
  FREQUENCY_LABEL,
  type Frequency,
} from "@/lib/constants";
import { initialFormState, type FormState } from "@/lib/form";

type Variant = {
  id: string;
  type: string;
  value: string;
  surcharge: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  variants: Variant[];
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  frequency: string;
  minQuantity: number;
  earlyClose: boolean;
  earlyCloseDays: number;
  pauseAllowed: boolean;
  autoRenew: boolean;
  product: Product | null;
};

type DiscountRule = {
  id: string;
  name: string;
  code: string | null;
  kind: string;
  value: number;
  minSubtotal: number;
  minQuantity: number;
};

export function CatalogClient({
  plans,
  discountRules,
}: {
  plans: Plan[];
  discountRules: DiscountRule[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedRule, setAppliedRule] = useState<DiscountRule | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openSubscribeModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedVariantId(plan.product?.variants[0]?.id ?? "");
    setQuantity(plan.minQuantity || 1);
    setPromoCode("");
    setAppliedRule(null);
    setPromoMessage(null);
    setModalOpen(true);
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setAppliedRule(null);
      setPromoMessage(null);
      return;
    }

    const rule = discountRules.find((r) => r.code?.toUpperCase() === code);
    if (!rule) {
      setAppliedRule(null);
      setPromoMessage({ type: "error", text: "Invalid or expired promo code" });
      return;
    }

    setAppliedRule(rule);
    setPromoMessage({
      type: "success",
      text: `${rule.name}: ${rule.kind === "PERCENT" ? `${rule.value}% off` : `$${rule.value} off`}`,
    });
  };

  // Pricing calculations
  const selectedVariant = selectedPlan?.product?.variants.find((v) => v.id === selectedVariantId);
  const variantSurcharge = selectedVariant ? selectedVariant.surcharge : 0;
  const unitPrice = selectedPlan ? selectedPlan.price + variantSurcharge : 0;
  const subtotal = unitPrice * quantity;

  let discountAmount = 0;
  if (appliedRule) {
    if (appliedRule.kind === "PERCENT") {
      discountAmount = (subtotal * appliedRule.value) / 100;
    } else {
      discountAmount = Math.min(subtotal, appliedRule.value);
    }
  }
  const estimatedTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="space-y-6">
      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={ShoppingBag}
              title="No active subscription plans"
              description="No subscription plans are currently published for customer self-enrollment. Please contact support or check back soon."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between h-full hover:border-primary/50 hover:shadow-md transition-all">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                  <Badge variant="outline">
                    {FREQUENCY_LABEL[plan.frequency as Frequency] ?? plan.frequency}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{plan.description || "Recurring subscription plan"}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between space-y-4 pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold font-mono text-foreground">
                      {formatCurrency(plan.price)}
                      <span className="text-xs font-normal text-muted-foreground font-sans">
                        {" "}
                        / {plan.frequency.toLowerCase()}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Min contract quantity: {plan.minQuantity}
                    </p>
                  </div>

                  {plan.product ? (
                    <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5 text-xs">
                      <p className="font-semibold text-foreground">Product: {plan.product.name}</p>
                      {plan.product.variants.length > 0 ? (
                        <div>
                          <span className="text-muted-foreground block mb-1">Available tiers / variants:</span>
                          <div className="flex flex-wrap gap-1">
                            {plan.product.variants.map((v) => (
                              <Badge key={v.id} variant="secondary" className="text-[10px]">
                                {v.value} (+{formatCurrency(v.surcharge)})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-1">
                    {plan.earlyClose ? (
                      <Badge variant="warning" className="text-[10px]">
                        early close{plan.earlyCloseDays > 0 ? ` ${plan.earlyCloseDays}d` : ""}
                      </Badge>
                    ) : null}
                    {plan.pauseAllowed ? <Badge variant="secondary" className="text-[10px]">pausable</Badge> : null}
                    {plan.autoRenew ? <Badge className="text-[10px]">auto renew</Badge> : null}
                  </div>
                </div>

                <Button
                  onClick={() => openSubscribeModal(plan)}
                  id={`btn-subscribe-${plan.id}`}
                  className="w-full gap-2 mt-auto"
                >
                  <span>Subscribe to Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscribe Modal */}
      {modalOpen && selectedPlan ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl space-y-4 animate-in fade-in-0">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Subscribe: {selectedPlan.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={customerSubscribeAction as any} className="space-y-4">
              <input type="hidden" name="planId" value={selectedPlan.id} />
              <input type="hidden" name="variantId" value={selectedVariantId} />
              <input type="hidden" name="discountCode" value={promoCode} />

              <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
                <p className="font-semibold">{selectedPlan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Cadence: {FREQUENCY_LABEL[selectedPlan.frequency as Frequency] ?? selectedPlan.frequency} · Base Price: {formatCurrency(selectedPlan.price)}
                </p>
              </div>

              {selectedPlan.product?.variants && selectedPlan.product.variants.length > 0 ? (
                <div className="space-y-1.5">
                  <Label htmlFor="variantSelect">Select Variant / Tier</Label>
                  <Select
                    id="variantSelect"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                  >
                    <option value="">Base Product (No Addon)</option>
                    {selectedPlan.product.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.value} (+{formatCurrency(v.surcharge)})
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="quantityInput">Quantity (min: {selectedPlan.minQuantity})</Label>
                <Input
                  id="quantityInput"
                  name="quantity"
                  type="number"
                  min={selectedPlan.minQuantity}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(selectedPlan.minQuantity, parseInt(e.target.value, 10) || 1))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promoInput">Promotional / Discount Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="promoInput"
                    placeholder="e.g. WELCOME10, BULK5"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" onClick={handleApplyPromo}>
                    Apply
                  </Button>
                </div>
                {promoMessage ? (
                  <p
                    className={`text-xs flex items-center gap-1 ${
                      promoMessage.type === "success" ? "text-emerald-600 font-medium" : "text-destructive"
                    }`}
                  >
                    {promoMessage.type === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : null}
                    {promoMessage.text}
                  </p>
                ) : null}
              </div>

              {/* Order Breakdown */}
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit price</span>
                  <span>{formatCurrency(unitPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{quantity}</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount applied</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t pt-1.5 text-sm font-bold">
                  <span>First period estimate</span>
                  <span className="text-primary">{formatCurrency(estimatedTotal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" id="btn-confirm-customer-subscription">
                  Confirm & Subscribe
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

