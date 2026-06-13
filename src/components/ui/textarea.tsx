import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text shadow-elev-1 outline-none placeholder:text-muted/80 focus:border-ring/60 focus:ring-2 focus:ring-ring/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
