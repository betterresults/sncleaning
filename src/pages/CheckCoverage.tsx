import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, MapPin, Loader2, Home, Sparkles, Key, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CoverageResult {
  covered: boolean;
  prefix: string;
  borough?: string;
  region?: string;
  services: {
    domestic_cleaning: boolean;
    airbnb_cleaning: boolean;
    end_of_tenancy: boolean;
  };
}

const CheckCoverage = () => {
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [searched, setSearched] = useState(false);

  const extractPrefix = (postcode: string): string => {
    const clean = postcode.replace(/\s/g, '').toUpperCase();
    // Check if it looks like a full postcode (ends with digit + 2 letters pattern for inward code)
    const fullPostcodePattern = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\d[A-Z]{2}$/;
    const match = clean.match(fullPostcodePattern);
    if (match) {
      return match[1]; // Return the outward code
    }
    // Otherwise assume it's already just the outward code (prefix)
    return clean;
  };

  const checkCoverage = async () => {
    if (!postcode.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const prefix = extractPrefix(postcode);
      
      let { data: postcodeData, error } = await supabase
        .from('postcode_prefixes')
        .select(`
          *,
          coverage_boroughs!inner (
            name,
            coverage_regions!inner (
              name
            )
          )
        `)
        .eq('prefix', prefix)
        .eq('is_active', true)
        .single();

      if (!postcodeData && prefix.length > 1) {
        for (let i = prefix.length - 1; i >= 1; i--) {
          const shorterPrefix = prefix.slice(0, i);
          const { data } = await supabase
            .from('postcode_prefixes')
            .select(`
              *,
              coverage_boroughs!inner (
                name,
                coverage_regions!inner (
                  name
                )
              )
            `)
            .eq('prefix', shorterPrefix)
            .eq('is_active', true)
            .single();
          
          if (data) {
            postcodeData = data;
            break;
          }
        }
      }

      if (postcodeData) {
        setResult({
          covered: true,
          prefix: postcodeData.prefix,
          borough: postcodeData.coverage_boroughs?.name,
          region: postcodeData.coverage_boroughs?.coverage_regions?.name,
          services: {
            domestic_cleaning: postcodeData.domestic_cleaning,
            airbnb_cleaning: postcodeData.airbnb_cleaning,
            end_of_tenancy: postcodeData.end_of_tenancy,
          },
        });
      } else {
        setResult({
          covered: false,
          prefix: prefix,
          services: {
            domestic_cleaning: false,
            airbnb_cleaning: false,
            end_of_tenancy: false,
          },
        });
      }
    } catch (error) {
      console.error('Error checking coverage:', error);
      setResult({
        covered: false,
        prefix: extractPrefix(postcode),
        services: {
          domestic_cleaning: false,
          airbnb_cleaning: false,
          end_of_tenancy: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkCoverage();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - matching booking form style */}
      <header className="bg-white py-4 mb-3 border-b border-border shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button
                variant="outline"
                className="text-sm font-medium hover:bg-accent/50 transition-all duration-200 shadow-sm rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700">
              Check Our Coverage
            </h1>
            <div className="w-[100px]" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Icon Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Enter your postcode to see if we provide cleaning services in your area
            </p>
          </div>

          {/* Search Card - matching booking form style */}
          <div className="p-4 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter your postcode (e.g., E1 6AN)"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg h-12 rounded-xl border-2 border-border focus:border-primary transition-all"
              />
              <Button 
                onClick={checkCoverage} 
                disabled={loading || !postcode.trim()}
                className="h-12 px-6 rounded-xl font-medium"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {searched && result && (
            <div className={`p-4 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-white transition-all duration-300 ${
              result.covered 
                ? 'border-2 border-primary/50' 
                : 'border-2 border-destructive/50'
            }`}>
              {result.covered ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">Great news!</h2>
                      <p className="text-muted-foreground">
                        We cover {result.region}, London
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-bold text-slate-700 mb-3">Available services in your area:</h3>
                    <div className="space-y-2">
                      {result.services.domestic_cleaning && (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Home className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-slate-700">Domestic Cleaning</span>
                          <Badge className="ml-auto bg-primary">Available</Badge>
                        </div>
                      )}
                      {result.services.airbnb_cleaning && (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-slate-700">Airbnb Cleaning</span>
                          <Badge className="ml-auto bg-primary">Available</Badge>
                        </div>
                      )}
                      {result.services.end_of_tenancy && (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Key className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-slate-700">End of Tenancy</span>
                          <Badge className="ml-auto bg-primary">Available</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to="/services">
                      <Button className="w-full h-12 rounded-xl font-bold text-base" size="lg">
                        Book a Cleaning
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-destructive">Not yet covered</h2>
                      <p className="text-muted-foreground">
                        We don't currently service the {result.prefix} area
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      We're always expanding our coverage. Leave your details and we'll notify you when we start serving your area.
                    </p>
                    <Button variant="outline" className="w-full h-12 rounded-xl font-medium">
                      Notify Me When Available
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckCoverage;
