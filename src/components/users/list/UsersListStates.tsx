import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import type { UsersTableUserType } from './types';

interface UsersListLoadingRowsProps {
  userType: UsersTableUserType;
  rowCount?: number;
}

export function UsersListLoadingRows({
  userType,
  rowCount = 8,
}: UsersListLoadingRowsProps) {
  const isCustomerView = userType === 'customer';
  const actionPlaceholders = isCustomerView ? 4 : 3;

  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <TableRow key={index} aria-hidden>
          {isCustomerView && (
            <TableCell className="w-12">
              <Skeleton className="h-4 w-4 rounded-sm" />
            </TableCell>
          )}

          <TableCell>
            <Skeleton className="h-4 w-[9rem] max-w-full" />
          </TableCell>

          <TableCell>
            <Skeleton className="h-4 w-[12rem] max-w-full" />
          </TableCell>

          {isCustomerView ? (
            <>
              <TableCell>
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="mx-0 h-8 w-8 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-10 rounded-md" />
              </TableCell>
            </>
          ) : (
            <TableCell>
              <Skeleton className="h-5 w-[4.5rem] rounded-full" />
            </TableCell>
          )}

          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              {Array.from({ length: actionPlaceholders }).map((__, btnIndex) => (
                <Skeleton key={btnIndex} className="h-8 w-8 shrink-0 rounded-md" />
              ))}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/** @deprecated Use UsersListLoadingRows inside TableBody */
export function UsersListLoading(props: UsersListLoadingRowsProps) {
  return <UsersListLoadingRows {...props} />;
}
