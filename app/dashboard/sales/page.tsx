'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/table-skeleton';

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-history', page],
    queryFn: () => dashboardAPI.getSalesHistory(page, limit),
    select: (response) => response.data.data,
  });

  const sales = salesData?.sales || [];
  const pagination = salesData?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Sales</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; Sales</p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-amber-600">
            ${salesData?.totalSales || '0.00'}
          </p>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Your complete sales records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : sales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Sell</TableHead>
                    <TableHead>Admin Charge</TableHead>
                    <TableHead>My Revenue</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale: any) => (
                    <TableRow key={sale.orderId}>
                      <TableCell className="font-medium">{sale.orderId}</TableCell>
                      <TableCell>{sale.customer || 'N/A'}</TableCell>
                      <TableCell>${sale.totalSellAmount}</TableCell>
                      <TableCell>${sale.adminCharge}</TableCell>
                      <TableCell>${sale.myRevenue}</TableCell>
                      <TableCell>
                        {new Date(sale.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No sales found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {sales.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {pagination?.page || 1} of {pagination?.totalPages || 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= (pagination?.totalPages || 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

