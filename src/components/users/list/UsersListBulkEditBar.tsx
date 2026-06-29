import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserData } from './types';

interface UsersListBulkEditBarProps {
  selectedCount: number;
  bulkType: string;
  onBulkTypeChange: (value: string) => void;
  bulkSource: string;
  onBulkSourceChange: (value: string) => void;
  bulkUpdating: boolean;
  onApply: () => void;
  onClear: () => void;
  selectedUsers: UserData[];
}

export function UsersListBulkEditBar({
  selectedCount,
  bulkType,
  onBulkTypeChange,
  bulkSource,
  onBulkSourceChange,
  bulkUpdating,
  onApply,
  onClear,
  selectedUsers,
}: UsersListBulkEditBarProps) {
  const exportCsv = () => {
    const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Name', 'Email', 'Phone', 'Postcode'];
    const rows = selectedUsers.map((u) =>
      [
        `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        u.email || '',
        u.phone || '',
        u.postcode || '',
      ]
        .map(escape)
        .join(','),
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-500/10 bg-blue-500/[0.06] px-2.5 py-2">
      <span className="whitespace-nowrap text-sm font-semibold text-[#007aff]">
        {selectedCount} selected
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Select value={bulkType} onValueChange={onBulkTypeChange}>
          <SelectTrigger className="h-8 min-w-32 bg-white text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-change">Type: no change</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="empty">Clear type</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bulkSource} onValueChange={onBulkSourceChange}>
          <SelectTrigger className="h-8 min-w-32 bg-white text-xs">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-change">Source: no change</SelectItem>
            <SelectItem value="Facebook ads">Facebook Ads</SelectItem>
            <SelectItem value="Google ads">Google Ads</SelectItem>
            <SelectItem value="Organic">Organic</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="empty">Clear source</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onApply} disabled={bulkUpdating} size="sm">
          {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
    </div>
  );
}
