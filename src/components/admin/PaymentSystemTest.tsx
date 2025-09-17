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
        toast({
          title: "Test Error",
          description: error.message,
          variant: "destructive"
        });
        setResult({ error: error.message });
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
        toast({
          title: "Process Test Error",
          description: error.message,
          variant: "destructive"
        });
        setResult({ error: error.message });
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