// Range slider (Radix) for divergence filter — two thumbs for [min, max].

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--bg-elevated)]">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--accent-indigo)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-[var(--border)] bg-[var(--text-primary)] shadow focus:outline-none focus:ring-2 focus:ring-[var(--accent-indigo)]" />
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-[var(--border)] bg-[var(--text-primary)] shadow focus:outline-none focus:ring-2 focus:ring-[var(--accent-indigo)]" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;
