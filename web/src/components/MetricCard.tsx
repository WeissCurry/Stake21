import { ReactNode } from "react";
import { cn } from "../lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "accent" | "success";
  className?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = "default",
  className 
}: MetricCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-medium transition-all duration-300 hover:shadow-large",
        variant === "default" && "bg-gradient-card border border-border",
        variant === "accent" && "bg-gradient-hero text-primary-foreground border-none",
        variant === "success" && "bg-success text-success-foreground border-none",
        className
      )}
    >
      {icon && (
        <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-background/10">
          {icon}
        </div>
      )}
      <h3 className={cn(
        "text-sm font-medium mb-2",
        variant === "default" ? "text-muted-foreground" : "text-current opacity-90"
      )}>
        {title}
      </h3>
      <p className="text-3xl font-bold mb-1 tracking-tight">{value}</p>
      {subtitle && (
        <p className={cn(
          "text-sm",
          variant === "default" ? "text-muted-foreground" : "text-current opacity-75"
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
