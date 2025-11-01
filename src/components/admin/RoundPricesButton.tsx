import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const RoundPricesButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRoundPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('round-all-prices');

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Цените са закръглени успешно",
          description: `Актуализирани записи в bookings: ${data.bookingsUpdated}, в past_bookings: ${data.pastBookingsUpdated}`,
        });
      } else {
        throw new Error(data.error || 'Неуспешно закръгляне на цените');
      }
    } catch (error) {
      console.error('Грешка при закръгляне на цените:', error);
      toast({
        title: "Грешка",
        description: error.message || "Не успя да закръгли цените",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRoundPrices}
      disabled={loading}
      variant="outline"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Закръгли всички цени
    </Button>
  );
};
