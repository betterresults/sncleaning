import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';

interface PaymentStatusIndicatorProps {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PaymentStatusIndicator = ({ status, showIcon = true, size = 'md' }: PaymentStatusIndicatorProps) => {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    switch (normalizedStatus) {
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'authorized':
        return {
          label: 'Authorized',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          color: 'text-blue-600'
        };
      case 'failed':
      case 'authorization_failed':
      case 'capture_failed':
        return {
          label: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          color: 'text-red-600'
        };
      case 'unpaid':
      case 'not paid':
        return {
          label: 'Unpaid',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          color: 'text-yellow-600'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          color: 'text-gray-600'
        };
      case 'processing':
        return {
          label: 'Processing',
          className: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: DollarSign,
          color: 'text-purple-600'
        };
      default:
        return {
          label: status || 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
          color: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <Badge 
      className={`${config.className} ${textSize} flex items-center gap-1.5 font-medium border`}
    >
      {showIcon && <Icon className={`${iconSize} ${config.color}`} />}
      {config.label}
    </Badge>
  );
};

export default PaymentStatusIndicator;