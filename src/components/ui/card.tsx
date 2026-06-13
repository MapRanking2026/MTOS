import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface shadow-elev-1",
        className
      )}
      {...props}
    />
  )
}

export { Card }
