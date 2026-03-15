import type { SubscriptionTier } from '../types/models';

const tierOrder: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  elite: 2,
};

export function hasTierAccess(current: SubscriptionTier, required: SubscriptionTier) {
  return tierOrder[current] >= tierOrder[required];
}

export function formatTierLabel(tier: SubscriptionTier) {
  return tier.toUpperCase();
}
