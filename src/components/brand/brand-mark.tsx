"use client";

import Image from "next/image";

export function BrandMark({ variant }: { variant?: "horizontal" | "vertical" }) {
  const v = variant ?? "horizontal";

  return (
    <div className={v === "vertical" ? "h-9" : "h-6"}>
      <Image
        src={v === "vertical" ? "/svg_logos/Vertical_white_text.svg" : "/svg_logos/Horizontal_white_text.svg"}
        alt="Map Ranking"
        width={v === "vertical" ? 180 : 220}
        height={v === "vertical" ? 180 : 48}
        unoptimized
        className={v === "vertical" ? "hidden h-9 w-auto dark:block" : "hidden h-6 w-auto dark:block"}
      />
      <Image
        src={v === "vertical" ? "/svg_logos/Logo- Vertical.svg" : "/svg_logos/Logo- Horizontal.svg"}
        alt="Map Ranking"
        width={v === "vertical" ? 180 : 220}
        height={v === "vertical" ? 180 : 48}
        unoptimized
        className={v === "vertical" ? "block h-9 w-auto dark:hidden" : "block h-6 w-auto dark:hidden"}
      />
    </div>
  );
}
