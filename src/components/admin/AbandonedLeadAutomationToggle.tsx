import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MessageCircle, Loader2 } from 'lucide-react';

interface SettingRow {
  enabled: boolean;
  config: {
    delay_minutes?: number;
    admin_phone?: string;
    whatsapp_template?: string;
  } | null;
}

const AbandonedLeadAutomationToggle = () => {
  const [setting, setSetting] = useState<SettingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('automation_settings')
        .select('enabled, config')
        .eq('key', 'abandoned_lead_followup')
        .maybeSingle();
      if (error) {
        console.error(error);
      } else if (data) {
        setSetting(data as SettingRow);
      }
      setLoading(false);
    })();
  }, []);

  const toggle = async (enabled: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from('automation_settings')
      .update({ enabled })
      .eq('key', 'abandoned_lead_followup');
    if (error) {
      toast.error('Failed to update: ' + error.message);
    } else {
      setSetting((s) => (s ? { ...s, enabled } : s));
      toast.success(enabled ? 'Automation turned on' : 'Automation turned off');
    }
    setSaving(false);
  };

  if (loading) return null;
  if (!setting) return null;

  const cfg = setting.config ?? {};

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-emerald-100 rounded-xl shrink-0">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  WhatsApp follow-up SMS for abandoned leads
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  After {cfg.delay_minutes ?? 15} min of inactivity, sends an SMS to{' '}
                  <span className="font-medium">{cfg.admin_phone ?? '—'}</span> with a
                  ready-to-tap WhatsApp link for the customer. One alert per lead.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={toggle}
                  disabled={saving}
                />
              </div>
            </div>
            {cfg.whatsapp_template && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  Preview WhatsApp message
                </summary>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {cfg.whatsapp_template}
                </p>
              </details>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AbandonedLeadAutomationToggle;