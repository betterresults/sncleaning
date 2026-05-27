import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, X, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Valid email is required').max(255),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  postcode: z.string().trim().min(2, 'Postcode is required').max(20),
  service: z.string().trim().min(2, 'Please describe the service').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  street: z.string().trim().max(200).optional().or(z.literal('')),
});

const QuoteRequest: React.FC = () => {
  const { user, customerId } = useAuth();
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', postcode: '', street: '', service: '', description: '',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    setPhotos((prev) => [...prev, ...list].slice(0, 8));
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      toast({ title: 'Please check the form', description: first, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Upload photos
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('quote-request-photos').upload(path, file, {
          cacheControl: '3600', upsert: false, contentType: file.type,
        });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('quote-request-photos').getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const payload = {
        ...parsed.data,
        phone: parsed.data.phone || null,
        description: parsed.data.description || null,
        street: parsed.data.street || null,
        photo_urls: uploadedUrls,
        customer_id: customerId || null,
      };

      const { data: inserted, error } = await supabase
        .from('quote_requests')
        .insert(payload as any)
        .select('id')
        .single();
      if (error) throw error;

      await supabase.functions.invoke('send-quote-request-notification', {
        body: {
          id: inserted.id,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          postcode: payload.postcode,
          street: payload.street,
          service: payload.service,
          description: payload.description,
          photo_urls: uploadedUrls,
        },
      });

      setDone(true);
      setForm({ name: '', email: '', phone: '', postcode: '', street: '', service: '', description: '' });
      setPhotos([]);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Submission failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-[#18A5A5] mx-auto" />
          <h1 className="text-2xl font-bold text-[#185166]">Quote request received</h1>
          <p className="text-slate-600">Thanks! Our team will review your request and get back to you shortly.</p>
          <Button onClick={() => setDone(false)} className="bg-[#18A5A5] hover:bg-[#149090] text-white">
            Submit another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#185166]">Request a Cleaning Quote</h1>
          <p className="text-slate-600 mt-2">Tell us what you need, add photos and your postcode — we'll send a tailored quote.</p>
        </div>

        <Card className="p-6 md:p-8 shadow-xl">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name *</Label>
                <Input id="name" value={form.name} onChange={update('name')} placeholder="John Smith" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode *</Label>
                <Input id="postcode" value={form.postcode} onChange={update('postcode')} placeholder="SW1A 1AA" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street / Nickname</Label>
              <Input id="street" value={form.street} onChange={update('street')} placeholder="e.g. 12 Baker Street, or 'Mum's flat'" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={update('phone')} placeholder="07..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service needed *</Label>
              <Input id="service" value={form.service} onChange={update('service')} placeholder="e.g. End of tenancy, carpet cleaning, deep clean..." required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={5} value={form.description} onChange={update('description')} placeholder="Tell us about the property, rooms, condition, anything specific..." />
            </div>

            <div className="space-y-2">
              <Label>Photos (up to 8)</Label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:bg-slate-50 transition">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-600">Click to upload images</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative group">
                      <img src={URL.createObjectURL(p)} alt="" className="w-full h-24 object-cover rounded-md border" />
                      <button type="button" onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting}
              className="w-full bg-[#18A5A5] hover:bg-[#149090] text-white font-semibold py-6 text-base">
              {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>) : 'Send quote request'}
            </Button>

            {!user && (
              <p className="text-xs text-slate-500 text-center">
                By submitting you agree to be contacted regarding your request.
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default QuoteRequest;