import { Phone, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Plus } from 'lucide-react';
import type { ConversationThread, Customer } from '../types';
import { formatThreadTime, getCustomerDisplayName, getInitials } from '../utils/display';
import { SMSNewMessageDialog } from './SMSNewMessageDialog';

interface SMSConversationListProps {
  filteredThreads: ConversationThread[];
  selectedThread: ConversationThread | null;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectThread: (thread: ConversationThread) => void;
  showNewMessageDialog: boolean;
  onShowNewMessageDialogChange: (open: boolean) => void;
  customerSearch: string;
  onCustomerSearchChange: (value: string) => void;
  customers: Customer[];
  searchingCustomers: boolean;
  manualPhone: string;
  onManualPhoneChange: (value: string) => void;
  manualName: string;
  onManualNameChange: (value: string) => void;
  onStartWithManualPhone: () => void;
  onSelectCustomer: (customer: Customer) => void;
  className?: string;
}

export function SMSConversationList({
  filteredThreads,
  selectedThread,
  loading,
  searchTerm,
  onSearchChange,
  onSelectThread,
  showNewMessageDialog,
  onShowNewMessageDialogChange,
  customerSearch,
  onCustomerSearchChange,
  customers,
  searchingCustomers,
  manualPhone,
  onManualPhoneChange,
  manualName,
  onManualNameChange,
  onStartWithManualPhone,
  onSelectCustomer,
  className = '',
}: SMSConversationListProps) {
  return (
    <Card className={`flex h-full flex-col overflow-hidden lg:col-span-1 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            SMS Messages
          </CardTitle>
          <Dialog open={showNewMessageDialog} onOpenChange={onShowNewMessageDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New SMS Message</DialogTitle>
              </DialogHeader>
              <SMSNewMessageDialog
                customerSearch={customerSearch}
                onCustomerSearchChange={onCustomerSearchChange}
                customers={customers}
                searchingCustomers={searchingCustomers}
                manualPhone={manualPhone}
                onManualPhoneChange={onManualPhoneChange}
                manualName={manualName}
                onManualNameChange={onManualNameChange}
                onStartWithManualPhone={onStartWithManualPhone}
                onSelectCustomer={onSelectCustomer}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="mb-2 h-8 w-8" />
              <p>No SMS conversations yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.phone_number}
                  type="button"
                  onClick={() => onSelectThread(thread)}
                  className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                    selectedThread?.phone_number === thread.phone_number ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(thread.customer_name, thread.phone_number)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium">
                          {thread.customer_name || thread.phone_number}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatThreadTime(thread.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="truncate text-sm text-muted-foreground">{thread.last_message}</p>
                        {thread.unread_count > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full">
                            {thread.unread_count}
                          </Badge>
                        )}
                      </div>
                      {thread.customer_name && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {thread.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
