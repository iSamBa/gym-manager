"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LucideIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  value: number;
  label: string;
  isPositive?: boolean;
  isNegative?: boolean;
  period?: string;
}

interface AccessibleStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: TrendData;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  error?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  }>;
}

export function AccessibleStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
  loading = false,
  error = false,
  actions,
}: AccessibleStatsCardProps) {
  const formattedValue =
    typeof value === "number" ? new Intl.NumberFormat().format(value) : value;

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.isPositive || trend.value > 0) {
      return <TrendingUp className="h-3 w-3" aria-hidden="true" />;
    } else if (trend.isNegative || trend.value < 0) {
      return <TrendingDown className="h-3 w-3" aria-hidden="true" />;
    }
    return <Minus className="h-3 w-3" aria-hidden="true" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";

    if (trend.isPositive || trend.value > 0) {
      return "text-green-600 dark:text-green-400";
    } else if (trend.isNegative || trend.value < 0) {
      return "text-red-600 dark:text-red-400";
    }
    return "text-muted-foreground";
  };

  const getTrendAriaLabel = () => {
    if (!trend) return "";

    const direction =
      trend.isPositive || trend.value > 0
        ? "increased"
        : trend.isNegative || trend.value < 0
          ? "decreased"
          : "remained stable";

    return `${title} has ${direction} by ${Math.abs(trend.value)}% ${trend.label}`;
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="bg-muted h-4 w-24 rounded" />
          <div className="bg-muted h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <div className="bg-muted mb-2 h-8 w-16 rounded" />
          <div className="bg-muted h-3 w-32 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-destructive text-sm font-medium">
            {title}
          </CardTitle>
          <Icon className="text-destructive/70 h-4 w-4" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-destructive mb-1 text-2xl font-bold">Error</div>
          <p className="text-destructive/70 text-xs">Unable to load data</p>
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className="text-sm font-medium"
          id={`stat-title-${title.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className="text-2xl font-bold"
          aria-describedby={`stat-title-${title.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {formattedValue}
        </div>

        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}

        {trend && (
          <div className="flex items-center space-x-1">
            <div
              className={cn(
                "flex items-center space-x-1 text-xs font-medium",
                getTrendColor()
              )}
              aria-label={getTrendAriaLabel()}
            >
              {getTrendIcon()}
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            </div>
            <span className="text-muted-foreground text-xs">{trend.label}</span>
          </div>
        )}

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            {actions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="h-7 px-2 text-xs"
              >
                {action.icon && <action.icon className="mr-1 h-3 w-3" />}
                {action.label}
              </Button>
            ))}

            {actions.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </>
  );

  if (onClick) {
    return (
      <Card
        className={cn(
          "hover:bg-muted/50 focus-visible:ring-ring cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-2",
          className
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${title}: ${formattedValue}`}
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card
      className={cn("", className)}
      role="region"
      aria-labelledby={`stat-title-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {cardContent}
    </Card>
  );
}

// Enhanced Stats Grid Component
interface StatsGridProps {
  stats: Array<Omit<AccessibleStatsCardProps, "className">>;
  className?: string;
  loading?: boolean;
  error?: boolean;
}

export function AccessibleStatsGrid({
  stats,
  className,
  loading = false,
  error = false,
}: StatsGridProps) {
  return (
    <section
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
      aria-label="Dashboard Statistics"
    >
      {stats.map((stat, index) => (
        <AccessibleStatsCard
          key={`${stat.title}-${index}`}
          {...stat}
          loading={loading}
          error={error}
        />
      ))}
    </section>
  );
}
