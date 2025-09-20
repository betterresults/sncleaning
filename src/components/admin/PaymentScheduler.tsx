import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const PaymentScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<{
    authorized: number;
    captured: number;
    pending: number;
  }>({ authorized: 0, captured: 0, pending: 0 });

  const runPaymentProcessing = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-process-payments');
      
      if (error) {
        console.error('Payment processing error:', error);
        toast({
          title: "Payment Processing Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setLastRun(new Date());
      setStats({
        authorized: data?.bookings_authorized || 0,
        captured: data?.bookings_captured || 0,
        pending: stats.pending - (data?.bookings_authorized || 0) - (data?.bookings_captured || 0)
      });

      if ((data?.bookings_authorized || 0) > 0 || (data?.bookings_captured || 0) > 0) {
        toast({
          title: "Payment Processing Complete",
          description: `Authorized: ${data?.bookings_authorized || 0}, Captured: ${data?.bookings_captured || 0}`
        });
      }

      return true;
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Error",
        description: "Failed to process payments",
        variant: "destructive"
      });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const startScheduler = () => {
    if (intervalId) return;
    
    setIsRunning(true);
    // Run immediately
    runPaymentProcessing();
    
    // Then run every 30 minutes
    const id = setInterval(() => {
      runPaymentProcessing();
    }, 30 * 60 * 1000); // 30 minutes
    
    setIntervalId(id);
    
    toast({
      title: "Payment Scheduler Started",
      description: "Processing payments every 30 minutes"
    });
  };

  const stopScheduler = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
    
    toast({
      title: "Payment Scheduler Stopped",
      description: "Automatic payment processing has been stopped"
    });
  };

  const fetchPendingStats = async () => {
    try {
      // Get upcoming bookings that need authorization
      const { data: unpaidBookings } = await supabase
        .from('bookings')
        .select('id')
        .in('payment_status', ['Unpaid', 'pending', 'failed'])
        .gte('date_time', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // 2 hours ago
        .lte('date_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()); // 24 hours from now

      // Get authorized bookings that need capture
      const { data: authorizedBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('payment_status', 'authorized');

      setStats(prev => ({
        ...prev,
        pending: (unpaidBookings?.length || 0) + (authorizedBookings?.length || 0)
      }));
    } catch (error) {
      console.error('Error fetching pending stats:', error);
    }
  };

  useEffect(() => {
    fetchPendingStats();
    const interval = setInterval(fetchPendingStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automatic Payment Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "Running" : "Stopped"}
            </Badge>
            {processing && (
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Processing...
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runPaymentProcessing}
              disabled={processing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
              Run Now
            </Button>
            
            {isRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopScheduler}
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={startScheduler}
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-blue-600">Pending</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.authorized}</div>
            <div className="text-sm text-green-600">Authorized</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.captured}</div>
            <div className="text-sm text-purple-600">Captured</div>
          </div>
        </div>

        {lastRun && (
          <div className="text-sm text-muted-foreground">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded border">
          <strong>Schedule:</strong> Authorizes payments 24h before booking, captures 1h after completion or immediately when marked as completed.
          Runs every 30 minutes when active.
        </div>
      </CardContent>
    </Card>
  );
};