import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-vault-green/10 text-vault-green hover:bg-vault-green/20 border-vault-green/20",
        secondary:
          "border-transparent bg-vault-slate text-vault-text hover:bg-vault-slate/80",
        destructive:
          "border-transparent bg-red-900/50 text-red-400 hover:bg-red-900/70 border-red-800",
        outline: "text-foreground",
        hologphic: 
          "relative overflow-hidden border-vault-blue/30 bg-vault-blue/5 text-vault-blue backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  if (variant === 'hologphic') {
    return (
      <div className={cn(badgeVariants({ variant }), className, "group relative")} {...props}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
        <span className="relative z-10 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-vault-blue animate-pulse" />
          {props.children}
        </span>
        <div className="absolute inset-0 rounded-sm ring-1 ring-inset ring-white/10 group-hover:ring-vault-blue/50 transition-all duration-500" />
      </div>
    )
  }
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
