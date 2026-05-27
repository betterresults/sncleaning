import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type QuoteRequest = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  postcode: string;
  street: string | null;
  service: string;
  description: string | null;
  photo_urls: string[];
  status: string;
  admin_notes: string | null;
  created_at: string;
  quoted_price: number | null;
  quote_message: string | null;
  quoted_at: string | null;
};

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

const AdminQuoteRequests: React.FC = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const [items, setItems] = useState<QuoteRequest[]>([]);
  const [busy, setBusy] = useState(true);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, { price: string; message: string }>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
    setItems((data as any) || []);
    setBusy(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (userRole !== 'admin' && userRole !== 'sales_agent') return <Navigate to="/" />;

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('quote_requests').update({ status }).eq('id', id);
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this quote request?')) return;
    const { error } = await supabase.from('quote_requests').delete().eq('id', id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    setItems((arr) => arr.filter((x) => x.id !== id));
  };

  const setDraft = (id: string, patch: Partial<{ price: string; message: string }>) =>
    setQuoteDrafts((d) => ({ ...d, [id]: { price: '', message: '', ...d[id], ...patch } }));

  const sendQuote = async (q: QuoteRequest) => {
    const draft = quoteDrafts[q.id] || { price: '', message: '' };
    const price = Number(draft.price);
    if (!q.email) return toast({ title: 'No email on file', description: 'Cannot send quote — customer has no email.', variant: 'destructive' });
    if (!price || price <= 0) return toast({ title: 'Enter a valid price', variant: 'destructive' });
    setSendingId(q.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-price', {
        body: { quote_request_id: q.id, price, message: draft.message || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: 'Quote sent', description: `Emailed £${price.toFixed(2)} to ${q.email}` });
      setItems((arr) => arr.map((x) => x.id === q.id ? { ...x, status: 'quoted', quoted_price: price, quote_message: draft.message || null, quoted_at: new Date().toISOString() } : x));
    } catch (err: any) {
      toast({ title: 'Failed to send quote', description: err.message, variant: 'destructive' });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <UnifiedHeader title="Quote Requests" user={user} userRole={userRole} onSignOut={signOut} />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar navigationItems={adminNavigation} user={user} onSignOut={signOut} />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
              <div className="max-w-6xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-[#185166]">Quote Requests</h1>
                  <Button variant="outline" onClick={load}>Refresh</Button>
                </div>

                {busy ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#18A5A5]" /></div>
                ) : items.length === 0 ? (
                  <Card className="p-12 text-center text-slate-500">No quote requests yet.</Card>
                ) : (
                  <div className="space-y-3">
                    {items.map((q) => (
                      <Card key={q.id} className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-[#185166] text-lg">{q.name || 'No name'}</h3>
                              <Badge variant="secondary">{q.service}</Badge>
                              <Badge>{q.status}</Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{new Date(q.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)}>
                              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button variant="destructive" size="sm" onClick={() => remove(q.id)}>Delete</Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-700 mb-3">
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#18A5A5]" /> <strong>{q.postcode}</strong>{q.street ? <span className="text-slate-500">— {q.street}</span> : null}</div>
                          {q.email && <a href={`mailto:${q.email}`} className="flex items-center gap-2 hover:underline"><Mail className="w-4 h-4 text-[#18A5A5]" /> {q.email}</a>}
                          {q.phone && <a href={`tel:${q.phone}`} className="flex items-center gap-2 hover:underline"><Phone className="w-4 h-4 text-[#18A5A5]" /> {q.phone}</a>}
                        </div>

                        {q.description && <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3 bg-slate-50 p-3 rounded">{q.description}</p>}

                        {q.photo_urls?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {q.photo_urls.map((u, i) => (
                              <a key={i} href={u} target="_blank" rel="noreferrer">
                                <img src={u} alt="" className="w-24 h-24 object-cover rounded border hover:opacity-80 transition" />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 border-t pt-4">
                          {q.quoted_price != null && (
                            <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Quote of <strong>£{Number(q.quoted_price).toFixed(2)}</strong> sent {q.quoted_at ? `on ${new Date(q.quoted_at).toLocaleString()}` : ''}
                            </div>
                          )}
                          <div className="grid md:grid-cols-[160px_1fr_auto] gap-2 items-start">
                            <div>
                              <label className="text-xs text-slate-500">Price (£)</label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={quoteDrafts[q.id]?.price ?? ''}
                                onChange={(e) => setDraft(q.id, { price: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Message (optional)</label>
                              <Textarea
                                rows={2}
                                placeholder="Optional note included with the quote..."
                                value={quoteDrafts[q.id]?.message ?? ''}
                                onChange={(e) => setDraft(q.id, { message: e.target.value })}
                              />
                            </div>
                            <div className="md:self-end">
                              <Button
                                onClick={() => sendQuote(q)}
                                disabled={sendingId === q.id || !q.email}
                                className="bg-[#18A5A5] hover:bg-[#149090] text-white"
                              >
                                {sendingId === q.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Send price
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminQuoteRequests;