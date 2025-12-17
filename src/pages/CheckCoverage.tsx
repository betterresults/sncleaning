import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, MapPin, Loader2, Home, Sparkles, Key } from 'lucide-react';
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
    // Remove all spaces and convert to uppercase
    const clean = postcode.replace(/\s/g, '').toUpperCase();
    
    // UK postcode format: outward code (1-4 chars) + inward code (3 chars)
    // Extract the outward code (everything except last 3 characters)
    if (clean.length >= 4) {
      const outward = clean.slice(0, -3);
      return outward;
    }
    // If too short, just return what we have
    return clean;
  };

  const checkCoverage = async () => {
    if (!postcode.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const prefix = extractPrefix(postcode);
      
      // First, try exact match
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

      // If no exact match, try progressively shorter prefixes
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Check Our Coverage</h1>
            <p className="text-muted-foreground">
              Enter your postcode to see if we provide cleaning services in your area
            </p>
          </div>

          {/* Search Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your postcode (e.g., E1 6AN)"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg"
                />
                <Button onClick={checkCoverage} disabled={loading || !postcode.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {searched && result && (
            <Card className={result.covered ? 'border-green-500/50' : 'border-destructive/50'}>
              <CardContent className="pt-6">
                {result.covered ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <div>
                        <h2 className="text-xl font-semibold text-green-700">Great news!</h2>
                        <p className="text-muted-foreground">
                          We cover {result.borough}, {result.region}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Available services in your area:</h3>
                      <div className="space-y-2">
                        {result.services.domestic_cleaning && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Home className="h-5 w-5 text-green-600" />
                            <span>Domestic Cleaning</span>
                            <Badge variant="secondary" className="ml-auto">Available</Badge>
                          </div>
                        )}
                        {result.services.airbnb_cleaning && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Sparkles className="h-5 w-5 text-green-600" />
                            <span>Airbnb Cleaning</span>
                            <Badge variant="secondary" className="ml-auto">Available</Badge>
                          </div>
                        )}
                        {result.services.end_of_tenancy && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <Key className="h-5 w-5 text-green-600" />
                            <span>End of Tenancy</span>
                            <Badge variant="secondary" className="ml-auto">Available</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link to="/services">
                        <Button className="w-full" size="lg">
                          Book a Cleaning
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-destructive" />
                      <div>
                        <h2 className="text-xl font-semibold text-destructive">Not yet covered</h2>
                        <p className="text-muted-foreground">
                          We don't currently service the {result.prefix} area
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-4">
                        We're always expanding our coverage. Leave your details and we'll notify you when we start serving your area.
                      </p>
                      <Button variant="outline" className="w-full">
                        Notify Me When Available
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Back link */}
          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckCoverage;
