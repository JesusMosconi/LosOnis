"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function PageTransition() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const content = Array.from(document.querySelectorAll("main"))
      .find(main => main.getClientRects().length > 0);
    if (!content) return;

    const animation = content.animate(
      [{ opacity: 0.65 }, { opacity: 1 }],
      { duration: 180, easing: "ease-out" },
    );

    return () => animation.cancel();
  }, [pathname]);

  return null;
}
