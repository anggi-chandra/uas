import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-white hover:bg-secondary/80',
        destructive: 'border-transparent bg-red-500 text-white hover:bg-red-500/80',
        outline: 'text-foreground',
        age: 'border-transparent bg-yellow-500 text-white',
        now: 'border-transparent bg-green-500 text-white',
        soon: 'border-transparent bg-blue-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };