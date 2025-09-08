import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PostponeDialogProps {
  serviceId: number;
  isPostponed: boolean;
  onUpdate: () => void;
  children: React.ReactNode;
}

export function PostponeDialog({ serviceId, isPostponed, onUpdate, children }: PostponeDialogProps) {
  const [open, setOpen] = useState(false);
  const [resumeDate, setResumeDate] = useState<Date>();
  const [loading, setLoading] = useState(false);

  const handlePostpone = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('recurring_services')
        .update({ 
          postponed: true,
          resume_date: resumeDate?.toISOString() || null
        })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring service has been postponed",
      });
      onUpdate();
      setOpen(false);
      setResumeDate(undefined);
    } catch (error) {
      console.error('Error postponing service:', error);
      toast({
        title: "Error",
        description: "Failed to postpone service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('recurring_services')
        .update({ 
          postponed: false,
          resume_date: null
        })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring service has been resumed",
      });
      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error resuming service:', error);
      toast({
        title: "Error",
        description: "Failed to resume service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPostponed ? (
              <>
                <Play className="h-5 w-5 text-green-600" />
                Resume Recurring Service
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 text-orange-600" />
                Postpone Recurring Service
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isPostponed 
              ? "This will resume the recurring service and start generating bookings again."
              : "This will pause the generation of new bookings. You can optionally set a date when it should resume automatically."
            }
          </DialogDescription>
        </DialogHeader>

        {!isPostponed && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resume-date">Resume Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !resumeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {resumeDate ? format(resumeDate, "PPP") : "Pick a date to resume"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={resumeDate}
                    onSelect={setResumeDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Leave empty to postpone indefinitely
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={isPostponed ? handleResume : handlePostpone}
            disabled={loading}
            variant={isPostponed ? "default" : "secondary"}
          >
            {loading ? "Processing..." : (isPostponed ? "Resume" : "Postpone")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}