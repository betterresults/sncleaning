import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyConfigDialogProps {
  propertyConfig: any;
  language: 'english' | 'bulgarian';
  onSave: (config: any) => void;
  children: React.ReactNode;
}

export function PropertyConfigDialog({ propertyConfig, language, onSave, children }: PropertyConfigDialogProps) {
  const [config, setConfig] = useState({
    bedrooms: propertyConfig?.bedrooms || 1,
    bathrooms: propertyConfig?.bathrooms || 1,
    living_rooms: propertyConfig?.living_rooms || 1,
  });
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(config);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'english' ? 'Edit Property Configuration' : 'Редактиране на конфигурацията'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bedrooms">
              {language === 'english' ? 'Bedrooms' : 'Спални'}
            </Label>
            <Input
              id="bedrooms"
              type="number"
              min="1"
              max="10"
              value={config.bedrooms}
              onChange={(e) => setConfig(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <Label htmlFor="bathrooms">
              {language === 'english' ? 'Bathrooms' : 'Бани'}
            </Label>
            <Input
              id="bathrooms"
              type="number"
              min="1"
              max="10"
              value={config.bathrooms}
              onChange={(e) => setConfig(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <Label htmlFor="living_rooms">
              {language === 'english' ? 'Living Rooms' : 'Дневни'}
            </Label>
            <Input
              id="living_rooms"
              type="number"
              min="1"
              max="10"
              value={config.living_rooms}
              onChange={(e) => setConfig(prev => ({ ...prev, living_rooms: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {language === 'english' ? 'Cancel' : 'Отказ'}
            </Button>
            <Button onClick={handleSave}>
              {language === 'english' ? 'Save' : 'Запази'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}