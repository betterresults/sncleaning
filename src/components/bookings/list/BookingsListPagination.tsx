import { Button } from '@/components/ui/button';

interface BookingsListPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function BookingsListPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
}: BookingsListPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 px-0 sm:px-4">
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </Button>
        <span className="text-xs sm:text-sm font-medium px-2 tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
