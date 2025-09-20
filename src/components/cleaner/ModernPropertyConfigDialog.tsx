import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Home, Bath, Bed, Utensils, Car, BookOpen, Sun, Trees, Trash2 } from 'lucide-react';

interface ModernPropertyConfigDialogProps {
  propertyConfig: any;
  language: 'english' | 'bulgarian';
  onSave: (config: any) => void;
  children: React.ReactNode;
}

const roomTypes = [
  { id: 'guest_bedroom', icon: Bed, name: { en: 'Guest Bedroom', bg: 'Спалня за гости' } },
  { id: 'wc', icon: Bath, name: { en: 'WC/Powder Room', bg: 'Тоалетна' } },
  { id: 'ensuite', icon: Bath, name: { en: 'En-suite', bg: 'Самостоятелна баня' } },
  { id: 'dining_room', icon: Utensils, name: { en: 'Dining Room', bg: 'Трапезария' } },
  { id: 'utility_room', icon: Car, name: { en: 'Utility Room', bg: 'Перално помещение' } },
  { id: 'study_room', icon: BookOpen, name: { en: 'Study/Office', bg: 'Кабинет' } },
  { id: 'conservatory', icon: Sun, name: { en: 'Conservatory', bg: 'Зимна градина' } },
  { id: 'balcony', icon: Trees, name: { en: 'Balcony/Terrace', bg: 'Балкон/Тераса' } },
];

export function ModernPropertyConfigDialog({ 
  propertyConfig, 
  language, 
  onSave, 
  children 
}: ModernPropertyConfigDialogProps) {
  const [config, setConfig] = useState({
    bedrooms: propertyConfig?.bedrooms || 1,
    bathrooms: propertyConfig?.bathrooms || 1,
    living_rooms: propertyConfig?.living_rooms || 1,
    additional_rooms: propertyConfig?.additional_rooms || [],
  });
  const [open, setOpen] = useState(false);

  const langKey = language === 'english' ? 'en' : 'bg';

  const handleSave = () => {
    onSave(config);
    setOpen(false);
  };

  const updateCount = (field: string, increment: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1))
    }));
  };

  const addAdditionalRoom = (roomType: string) => {
    setConfig(prev => {
      const existing = prev.additional_rooms.find(r => r.type === roomType);
      if (existing) {
        return {
          ...prev,
          additional_rooms: prev.additional_rooms.map(r => 
            r.type === roomType ? { ...r, count: r.count + 1 } : r
          )
        };
      } else {
        return {
          ...prev,
          additional_rooms: [...prev.additional_rooms, { type: roomType, count: 1 }]
        };
      }
    });
  };

  const removeAdditionalRoom = (roomType: string) => {
    setConfig(prev => ({
      ...prev,
      additional_rooms: prev.additional_rooms.reduce((acc, room) => {
        if (room.type === roomType) {
          if (room.count > 1) {
            acc.push({ ...room, count: room.count - 1 });
          }
          // If count is 1, we don't add it back (effectively removing it)
        } else {
          acc.push(room);
        }
        return acc;
      }, [])
    }));
  };

  const getAdditionalRoomCount = (roomType: string) => {
    const room = config.additional_rooms.find(r => r.type === roomType);
    return room ? room.count : 0;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            {language === 'english' ? 'Property Configuration' : 'Конфигурация на имота'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Main Rooms */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-primary">
                {language === 'english' ? 'Main Rooms' : 'Основни стаи'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bedrooms */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {language === 'english' ? 'Bedrooms' : 'Спални'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCount('bedrooms', false)}
                      disabled={config.bedrooms <= 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Badge variant="secondary" className="min-w-[2rem] justify-center">
                      {config.bedrooms}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCount('bedrooms', true)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {language === 'english' ? 'Bathrooms' : 'Бани'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCount('bathrooms', false)}
                      disabled={config.bathrooms <= 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Badge variant="secondary" className="min-w-[2rem] justify-center">
                      {config.bathrooms}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCount('bathrooms', true)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Living Rooms */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {language === 'english' ? 'Living Rooms' : 'Дневни'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCount('living_rooms', false)}
                      disabled={config.living_rooms <= 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Badge variant="secondary" className="min-w-[2rem] justify-center">
                      {config.living_rooms}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCount('living_rooms', true)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Kitchen - Always 1 */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm text-muted-foreground">
                    {language === 'english' ? 'Kitchen' : 'Кухня'}
                  </span>
                </div>
                <Badge variant="outline">1</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Additional Rooms */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-primary">
                {language === 'english' ? 'Additional Rooms' : 'Допълнителни стаи'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roomTypes.map((roomType) => {
                  const count = getAdditionalRoomCount(roomType.id);
                  const Icon = roomType.icon;
                  
                  return (
                    <div key={roomType.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">
                          {roomType.name[langKey]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {count > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAdditionalRoom(roomType.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        )}
                        {count > 0 ? (
                          <Badge variant="secondary" className="min-w-[2rem] justify-center">
                            {count}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="min-w-[2rem] justify-center">
                            0
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addAdditionalRoom(roomType.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {language === 'english' ? 'Cancel' : 'Отказ'}
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {language === 'english' ? 'Save Configuration' : 'Запази конфигурацията'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}