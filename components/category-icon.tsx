import {
  Car,
  Clapperboard,
  HeartPulse,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Utensils,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Clapperboard,
  Car,
  HeartPulse,
  MoreHorizontal,
};

export function CategoryIcon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? MoreHorizontal;
  return <Icon className={className} aria-hidden="true" />;
}
