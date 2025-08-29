import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-safeway-red text-white shadow hover:bg-safeway-dark-red',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-safeway-medium-gray bg-background shadow-sm hover:bg-safeway-light-gray hover:text-safeway-dark-gray',
        secondary: 'bg-safeway-light-gray text-safeway-dark-gray shadow-sm hover:bg-safeway-medium-gray',
        ghost: 'hover:bg-safeway-light-gray hover:text-safeway-dark-gray',
        header: 'bg-white border border-safeway-medium-gray shadow-sm hover:bg-safeway-light-gray text-safeway-red',
        link: 'text-safeway-red underline-offset-4 hover:underline',
        safeway: 'bg-safeway-red text-white shadow-sm hover:bg-safeway-dark-red border-0',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base font-semibold',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
