import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TaskCommentDialogProps {
  taskName: string;
  currentComment: string;
  language: 'english' | 'bulgarian';
  onSave: (comment: string) => void;
}

export function TaskCommentDialog({ taskName, currentComment, language, onSave }: TaskCommentDialogProps) {
  const [comment, setComment] = useState(currentComment);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(comment);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          💬
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'english' ? 'Add Comment' : 'Добави коментар'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {language === 'english' ? 'Task' : 'Задача'}
            </label>
            <div className="text-sm bg-muted/30 p-2 rounded">{taskName}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {language === 'english' ? 'Comment' : 'Коментар'}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={language === 'english' 
                ? 'Add any notes or issues with this task...' 
                : 'Добави бележки или проблеми с тази задача...'}
              className="min-h-[80px]"
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