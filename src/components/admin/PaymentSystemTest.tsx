import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const PaymentSystemTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSystemPayment = async (bookingId: number, action: 'authorize' | 'charge') => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-payment-action', {
        body: { bookingId, action }
      });
      
      if (error) {
        const errorMessage = error.message || 'Unknown error occurred';
        const stripeCode = data?.stripeErrorCode || '';
        const stripeType = data?.stripeErrorType || '';
        
        toast({
          title: "Payment Failed",
          description: `${errorMessage}${stripeCode ? ` (${stripeCode})` : ''}${stripeType ? ` - ${stripeType}` : ''}`,
          variant: "destructive"
        });
        setResult({ 
          error: errorMessage,
          stripeErrorCode: stripeCode,
          stripeErrorType: stripeType,
          fullResponse: data
        });
      } else {
        toast({
          title: "Test Complete",
          description: `Action: ${action}, Result: ${data?.success ? 'Success' : 'Failed'}`
        });
        setResult(data);
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const testProcessPayments = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-process-payments');
      
      if (error) {
        const errorMessage = error.message || 'Unknown error occurred';
        toast({
          title: "Process Test Error", 
          description: errorMessage,
          variant: "destructive"
        });
        setResult({ 
          error: errorMessage,
          fullResponse: data
        });
      } else {
        toast({
          title: "Process Test Complete",
          description: `Authorized: ${data?.bookings_authorized || 0}, Captured: ${data?.bookings_captured || 0}`
        });
        setResult(data);
      }
    } catch (error) {
      console.error('Process test error:', error);
      setResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Payment System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => testSystemPayment(110661, 'authorize')} 
            disabled={testing}
          >
            Test Authorize Booking 110661
          </Button>
          <Button 
            onClick={() => testSystemPayment(110655, 'charge')} 
            disabled={testing}
          >
            Capture Booking 110655 (£117)
          </Button>
          <Button 
            onClick={() => testSystemPayment(110664, 'charge')} 
            disabled={testing}
          >
            Capture Booking 110664 (£62.50)
          </Button>
          <Button 
            onClick={() => testProcessPayments()} 
            disabled={testing}
          >
            Test Process All Payments
          </Button>
        </div>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold">Result:</h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};