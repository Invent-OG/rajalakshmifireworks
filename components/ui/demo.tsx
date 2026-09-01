"use client";

import Featured_05 from "@/components/ui/globe-feature-section";
import AddToBasket from "@/components/ui/motion-add-to-basket";

export function DemoOne() {
  return <Featured_05 />;
}

export default function Default() {
  return (
    <div className="motion-example flex w-full items-center justify-center p-8">
      <AddToBasket />
    </div>
  );
}
