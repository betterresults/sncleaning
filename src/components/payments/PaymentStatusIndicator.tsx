import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';

interface PaymentStatusIndicatorProps {
  status: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isClickable?: boolean;
}

const PaymentStatusIndicator = ({ status, onClick, size = 'md', isClickable = false }: PaymentStatusIndicatorProps) => {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-green-500 hover:bg-green-600',
          icon: CheckCircle,
          color: 'text-white'
        };
      case 'authorized':
        return {
          label: 'Authorized',
          className: 'bg-blue-500 hover:bg-blue-600',
          icon: Clock,
          color: 'text-white'
        };
      case 'failed':
      case 'authorization_failed':
      case 'capture_failed':
        return {
          label: 'Failed',
          className: 'bg-red-500 hover:bg-red-600',
          icon: XCircle,
          color: 'text-white'
        };
      case 'unpaid':
      case 'not paid':
        return {
          label: 'Unpaid',
          className: 'bg-yellow-500 hover:bg-yellow-600',
          icon: AlertCircle,
          color: 'text-white'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-gray-500 hover:bg-gray-600',
          icon: Clock,
          color: 'text-white'
        };
      case 'processing':
        return {
          label: 'Processing',
          className: 'bg-purple-500 hover:bg-purple-600',
          icon: DollarSign,
          color: 'text-white'
        };
      default:
        return {
          label: status || 'Unknown',
          className: 'bg-gray-500 hover:bg-gray-600',
          icon: AlertCircle,
          color: 'text-white'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';

  if (isClickable && onClick) {
    return (
      <Button
        onClick={onClick}
        className={`${config.className} ${buttonSize} p-0 rounded-full border-0 shadow-sm transition-all duration-200 hover:scale-110`}
        variant="default"
        title={config.label}
      >
        <Icon className={`${iconSize} ${config.color}`} />
      </Button>
    );
  }

  return (
    <div 
      className={`${config.className.replace('hover:', '')} ${buttonSize} p-0 rounded-full border-0 shadow-sm flex items-center justify-center`}
      title={config.label}
    >
      <Icon className={`${iconSize} ${config.color}`} />
    </div>
  );
};

export default PaymentStatusIndicator;