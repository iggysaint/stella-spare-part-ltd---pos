import React from 'react';
import { 
  Settings, 
  Disc, 
  Layers, 
  Snowflake, 
  Zap, 
  RotateCw, 
  Fuel, 
  Truck, 
  Boxes 
} from 'lucide-react';
import { ProductCategory } from '../../types';

interface CategoryIconProps {
  category: ProductCategory | 'All Parts' | string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  className = 'w-5 h-5',
  size 
}) => {
  const iconProps = { className, size };

  switch (category) {
    case 'Engine':
      return <Settings {...iconProps} />;
    case 'Brakes':
      return <Disc {...iconProps} />;
    case 'Suspension':
      return <Layers {...iconProps} />;
    case 'Cooling':
      return <Snowflake {...iconProps} />;
    case 'Electrical':
      return <Zap {...iconProps} />;
    case 'Transmission':
      return <RotateCw {...iconProps} />;
    case 'Fuel':
      return <Fuel {...iconProps} />;
    case 'Body/Van':
      return <Truck {...iconProps} />;
    case 'All Parts':
    default:
      return <Boxes {...iconProps} />;
  }
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Engine: { bg: 'bg-accent-soft', text: 'text-accent', border: 'border-border' },
  Brakes: { bg: 'bg-surface-muted', text: 'text-primary', border: 'border-border' },
  Suspension: { bg: 'bg-surface-muted', text: 'text-secondary', border: 'border-border' },
  Cooling: { bg: 'bg-surface-muted', text: 'text-secondary', border: 'border-border' },
  Electrical: { bg: 'bg-accent-soft', text: 'text-accent', border: 'border-border' },
  Transmission: { bg: 'bg-surface-muted', text: 'text-primary', border: 'border-border' },
  Fuel: { bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive' },
  'Body/Van': { bg: 'bg-accent-soft', text: 'text-accent', border: 'border-border' },
  'All Parts': { bg: 'bg-surface-muted', text: 'text-primary', border: 'border-border' },
};
