import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-mono tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-vault-green text-vault-bg hover:bg-vault-green/90 shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-shadow duration-300",
        destructive:
          "bg-red-900/50 border border-red-800 text-red-100 hover:bg-red-900/70",
        outline:
          "border border-vault-slate bg-transparent hover:bg-vault-slate/20 text-vault-text hover:text-white",
        secondary:
          "bg-vault-slate text-white hover:bg-vault-slate/80",
        ghost: "hover:bg-vault-slate/20 hover:text-white",
        link: "text-vault-blue underline-offset-4 hover:underline",
        cyber: "relative border border-vault-blue/50 text-vault-blue bg-vault-blue/5 hover:bg-vault-blue/10 overflow-hidden group",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-sm px-3",
        lg: "h-11 rounded-sm px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    if (variant === 'cyber') {
         return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
             <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-vault-blue opacity-50 block transition-all group-hover:w-full group-hover:h-full"></span>
             <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-vault-blue opacity-50 block transition-all group-hover:w-full group-hover:h-full"></span>
            {props.children}
        </Comp>
         )
    }
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
