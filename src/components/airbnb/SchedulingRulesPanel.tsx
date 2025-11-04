import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Clock } from 'lucide-react';
import {
  useSchedulingRules,
  useCreateSchedulingRule,
  useUpdateSchedulingRule,
  useDeleteSchedulingRule,
  type SchedulingRule,
} from '@/hooks/useSchedulingRules';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const SchedulingRulesPanel = () => {
  const { data: timeSlots = [] } = useSchedulingRules('time_slot', false);
  const { data: dayPricing = [] } = useSchedulingRules('day_pricing', false);
  const { data: cutoffRules = [] } = useSchedulingRules('cutoff_time', false);
  const { data: overtimeRules = [] } = useSchedulingRules('overtime_window', false);
  const { data: timeSurcharges = [] } = useSchedulingRules('time_surcharge', false);

  const createRule = useCreateSchedulingRule();
  const updateRule = useUpdateSchedulingRule();
  const deleteRule = useDeleteSchedulingRule();

  const [newTimeSlot, setNewTimeSlot] = useState({ start: '07:00', end: '08:00', label: '' });
  const [newDayPricing, setNewDayPricing] = useState<{ day: number; modifier: number; type: 'fixed' | 'percentage'; label: string }>({ 
    day: 0, 
    modifier: 0, 
    type: 'percentage', 
    label: '' 
  });
  const [newTimeSurcharge, setNewTimeSurcharge] = useState<{ start: string; end: string; modifier: number; type: 'fixed' | 'percentage'; label: string }>({ 
    start: '07:00', 
    end: '09:00', 
    modifier: 0, 
    type: 'fixed', 
    label: '' 
  });

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.start || !newTimeSlot.end) return;
    
    createRule.mutate({
      rule_type: 'time_slot',
      start_time: newTimeSlot.start,
      end_time: newTimeSlot.end,
      label: newTimeSlot.label || `${newTimeSlot.start} - ${newTimeSlot.end}`,
      price_modifier: 0,
      modifier_type: 'fixed',
      is_active: true,
      display_order: timeSlots.length,
    });
    
    setNewTimeSlot({ start: '07:00', end: '08:00', label: '' });
  };

  const handleAddDayPricing = () => {
    createRule.mutate({
      rule_type: 'day_pricing',
      day_of_week: newDayPricing.day,
      price_modifier: newDayPricing.modifier,
      modifier_type: newDayPricing.type,
      label: newDayPricing.label || DAYS_OF_WEEK.find(d => d.value === newDayPricing.day)?.label,
      is_active: true,
      display_order: dayPricing.length,
    });
    
    setNewDayPricing({ day: 0, modifier: 0, type: 'percentage', label: '' });
  };

  const handleAddTimeSurcharge = () => {
    createRule.mutate({
      rule_type: 'time_surcharge',
      start_time: newTimeSurcharge.start,
      end_time: newTimeSurcharge.end,
      price_modifier: newTimeSurcharge.modifier,
      modifier_type: newTimeSurcharge.type,
      label: newTimeSurcharge.label || `${newTimeSurcharge.start} - ${newTimeSurcharge.end}`,
      is_active: true,
      display_order: timeSurcharges.length,
    });
    
    setNewTimeSurcharge({ start: '07:00', end: '09:00', modifier: 0, type: 'fixed', label: '' });
  };

  const handleUpdateCutoff = (endTime: string) => {
    if (cutoffRules.length > 0) {
      updateRule.mutate({
        id: cutoffRules[0].id,
        updates: { end_time: endTime },
      });
    } else {
      createRule.mutate({
        rule_type: 'cutoff_time',
        end_time: endTime,
        label: 'Standard Hours End',
        price_modifier: 0,
        modifier_type: 'fixed',
        is_active: true,
        display_order: 1,
      });
    }
  };

  const handleUpdateOvertime = (startTime: string, modifier: number, modifierType: 'fixed' | 'percentage') => {
    if (overtimeRules.length > 0) {
      updateRule.mutate({
        id: overtimeRules[0].id,
        updates: { start_time: startTime, price_modifier: modifier, modifier_type: modifierType },
      });
    } else {
      createRule.mutate({
        rule_type: 'overtime_window',
        start_time: startTime,
        end_time: '22:00',
        price_modifier: modifier,
        modifier_type: modifierType,
        label: 'Overtime Window',
        description: 'Additional charge for bookings extending past standard hours',
        is_active: true,
        display_order: 1,
      });
    }
  };

  return (
    <Tabs defaultValue="time-slots" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="time-slots">Time Slots</TabsTrigger>
        <TabsTrigger value="day-pricing">Day Pricing</TabsTrigger>
        <TabsTrigger value="cutoff">Cutoff & Overtime</TabsTrigger>
        <TabsTrigger value="time-surcharges">Time Surcharges</TabsTrigger>
      </TabsList>

      <TabsContent value="time-slots" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>Configure what times customers can book</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newTimeSlot.start}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newTimeSlot.end}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end: e.target.value })}
                />
              </div>
              <div>
                <Label>Label (optional)</Label>
                <Input
                  value={newTimeSlot.label}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, label: e.target.value })}
                  placeholder="e.g., Morning"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddTimeSlot} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{slot.label || `${slot.start_time} - ${slot.end_time}`}</span>
                    <span className="text-sm text-muted-foreground">{slot.start_time} - {slot.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slot.is_active}
                      onCheckedChange={(checked) =>
                        updateRule.mutate({ id: slot.id, updates: { is_active: checked } })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule.mutate(slot.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="day-pricing" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Day-Specific Pricing</CardTitle>
            <CardDescription>Set pricing modifiers for specific days (e.g., weekends). Positive values add charges, negative values give discounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label>Day</Label>
                <Select
                  value={newDayPricing.day.toString()}
                  onValueChange={(value) => setNewDayPricing({ ...newDayPricing, day: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modifier</Label>
                <Input
                  type="number"
                  value={newDayPricing.modifier}
                  onChange={(e) => setNewDayPricing({ ...newDayPricing, modifier: parseFloat(e.target.value) })}
                  placeholder="e.g., 20 or -10"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newDayPricing.type}
                  onValueChange={(value) => setNewDayPricing({ ...newDayPricing, type: value as 'fixed' | 'percentage' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">£</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label (optional)</Label>
                <Input
                  value={newDayPricing.label}
                  onChange={(e) => setNewDayPricing({ ...newDayPricing, label: e.target.value })}
                  placeholder="e.g., Weekend Premium"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddDayPricing} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {dayPricing.map((pricing) => (
                <div key={pricing.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{DAYS_OF_WEEK.find(d => d.value === pricing.day_of_week)?.label}</span>
                    <span className={`text-sm ${pricing.price_modifier >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {pricing.price_modifier >= 0 ? '+' : ''}{pricing.price_modifier}{pricing.modifier_type === 'percentage' ? '%' : '£'}
                    </span>
                    <span className="text-sm text-muted-foreground">{pricing.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pricing.is_active}
                      onCheckedChange={(checked) =>
                        updateRule.mutate({ id: pricing.id, updates: { is_active: checked } })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule.mutate(pricing.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cutoff" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Service Hours & Cutoff</CardTitle>
            <CardDescription>Configure standard finish time and overtime rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Latest Standard Finish Time</Label>
              <Input
                type="time"
                value={cutoffRules[0]?.end_time || '18:00'}
                onChange={(e) => handleUpdateCutoff(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Bookings ending after this time will incur overtime charges
              </p>
            </div>

            <div className="space-y-2">
              <Label>Overtime Window Settings</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={overtimeRules[0]?.start_time || '18:00'}
                    onChange={(e) =>
                      handleUpdateOvertime(
                        e.target.value,
                        overtimeRules[0]?.price_modifier || 15,
                        overtimeRules[0]?.modifier_type || 'percentage'
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Surcharge</Label>
                  <Input
                    type="number"
                    value={overtimeRules[0]?.price_modifier || 15}
                    onChange={(e) =>
                      handleUpdateOvertime(
                        overtimeRules[0]?.start_time || '18:00',
                        parseFloat(e.target.value),
                        overtimeRules[0]?.modifier_type || 'percentage'
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={overtimeRules[0]?.modifier_type || 'percentage'}
                    onValueChange={(value) =>
                      handleUpdateOvertime(
                        overtimeRules[0]?.start_time || '18:00',
                        overtimeRules[0]?.price_modifier || 15,
                        value as 'fixed' | 'percentage'
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">£</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="time-surcharges" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Time Slot Surcharges</CardTitle>
            <CardDescription>Add surcharges or discounts for specific time ranges. Positive values add charges, negative values give discounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={newTimeSurcharge.start}
                  onChange={(e) => setNewTimeSurcharge({ ...newTimeSurcharge, start: e.target.value })}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={newTimeSurcharge.end}
                  onChange={(e) => setNewTimeSurcharge({ ...newTimeSurcharge, end: e.target.value })}
                />
              </div>
              <div>
                <Label>Modifier</Label>
                <Input
                  type="number"
                  value={newTimeSurcharge.modifier}
                  onChange={(e) => setNewTimeSurcharge({ ...newTimeSurcharge, modifier: parseFloat(e.target.value) })}
                  placeholder="e.g., 10 or -5"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newTimeSurcharge.type}
                  onValueChange={(value) => setNewTimeSurcharge({ ...newTimeSurcharge, type: value as 'fixed' | 'percentage' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">£</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddTimeSurcharge} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {timeSurcharges.map((surcharge) => (
                <div key={surcharge.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{surcharge.start_time} - {surcharge.end_time}</span>
                    <span className={`text-sm ${surcharge.price_modifier >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {surcharge.price_modifier >= 0 ? '+' : ''}{surcharge.price_modifier}{surcharge.modifier_type === 'percentage' ? '%' : '£'}
                    </span>
                    <span className="text-sm text-muted-foreground">{surcharge.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={surcharge.is_active}
                      onCheckedChange={(checked) =>
                        updateRule.mutate({ id: surcharge.id, updates: { is_active: checked } })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule.mutate(surcharge.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
