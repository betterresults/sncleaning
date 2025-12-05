import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Variable, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VariableOption {
  name: string;
  description: string;
  example: string;
}

interface VariableCategory {
  category: string;
  variables: VariableOption[];
}

const AVAILABLE_VARIABLES: VariableCategory[] = [
  {
    category: 'Customer',
    variables: [
      { name: 'customer_name', description: 'Full customer name', example: 'John Smith' },
      { name: 'first_name', description: 'Customer first name', example: 'John' },
      { name: 'last_name', description: 'Customer last name', example: 'Smith' },
      { name: 'customer_email', description: 'Customer email address', example: 'john@example.com' },
      { name: 'customer_phone', description: 'Customer phone number', example: '+44 7123 456789' },
    ]
  },
  {
    category: 'Booking',
    variables: [
      { name: 'booking_date', description: 'Full booking date', example: 'Friday, 12 September 2025' },
      { name: 'booking_time', description: 'Booking time', example: '10:00 AM' },
      { name: 'service_type', description: 'Type of cleaning service', example: 'Domestic Cleaning' },
      { name: 'cleaning_type', description: 'Cleaning type (regular/deep)', example: 'Regular Cleaning' },
      { name: 'address', description: 'Property address', example: '123 Main Street, London' },
      { name: 'postcode', description: 'Property postcode', example: 'SW1A 1AA' },
      { name: 'total_cost', description: 'Total booking cost', example: '£150.00' },
      { name: 'total_hours', description: 'Total cleaning hours', example: '3' },
      { name: 'booking_id', description: 'Booking reference number', example: '12345' },
      { name: 'booking_status', description: 'Current booking status', example: 'Confirmed' },
    ]
  },
  {
    category: 'Cleaner',
    variables: [
      { name: 'cleaner_name', description: 'Assigned cleaner name', example: 'Maria Garcia' },
      { name: 'cleaner_phone', description: 'Cleaner phone number', example: '+44 7987 654321' },
    ]
  },
  {
    category: 'Payment',
    variables: [
      { name: 'payment_status', description: 'Payment status', example: 'Paid' },
      { name: 'payment_method', description: 'Payment method used', example: 'Card' },
      { name: 'amount', description: 'Payment amount', example: '150.00' },
      { name: 'payment_link', description: 'Link to pay for booking', example: 'https://...' },
      { name: 'invoice_link', description: 'Link to invoice', example: 'https://...' },
      { name: 'add_card_link', description: 'Link to add/save payment card', example: 'https://...' },
    ]
  },
  {
    category: 'Account',
    variables: [
      { name: 'temp_password', description: 'Temporary account password', example: 'TempPass123!' },
      { name: 'login_link', description: 'Link to login page', example: 'https://...' },
      { name: 'dashboard_link', description: 'Link to dashboard', example: 'https://...' },
    ]
  },
  {
    category: 'Other',
    variables: [
      { name: 'photo_link', description: 'Link to cleaning photos', example: 'https://...' },
      { name: 'company_name', description: 'Company name', example: 'SN Cleaning Services' },
      { name: 'company_email', description: 'Company email', example: 'sales@sncleaningservices.co.uk' },
      { name: 'company_phone', description: 'Company phone', example: '020 1234 5678' },
      { name: 'error_message', description: 'Error details (for failed notifications)', example: 'Card declined' },
    ]
  }
];

interface VariablePickerProps {
  onInsert: (variable: string) => void;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ 
  onInsert, 
  buttonVariant = 'outline',
  buttonSize = 'sm'
}) => {
  const { toast } = useToast();

  const handleInsert = (variable: string) => {
    onInsert(`{{${variable}}}`);
    toast({
      title: 'Variable inserted',
      description: `{{${variable}}} added to your template`,
    });
  };

  const copyVariable = (variable: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast({
      title: 'Copied',
      description: `{{${variable}}} copied to clipboard`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Variable className="h-4 w-4 mr-2" />
          Insert Variable
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Click to insert variable into your template
        </DropdownMenuLabel>
        
        {AVAILABLE_VARIABLES.map((category, idx) => (
          <React.Fragment key={category.category}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="font-semibold text-sm">
              {category.category}
            </DropdownMenuLabel>
            {category.variables.map((variable) => (
              <DropdownMenuItem
                key={variable.name}
                className="flex items-start justify-between cursor-pointer group"
                onClick={() => handleInsert(variable.name)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {`{{${variable.name}}}`}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {variable.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    e.g. {variable.example}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => copyVariable(variable.name, e)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Export the variable list for use elsewhere
export const getAllVariableNames = (): string[] => {
  return AVAILABLE_VARIABLES.flatMap(cat => cat.variables.map(v => v.name));
};

export const getVariableExample = (variableName: string): string => {
  for (const category of AVAILABLE_VARIABLES) {
    const found = category.variables.find(v => v.name === variableName);
    if (found) return found.example;
  }
  return `[${variableName}]`;
};

export default VariablePicker;
