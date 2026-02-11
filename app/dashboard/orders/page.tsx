'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orderAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TableSkeleton } from '@/components/table-skeleton';
import { toast } from 'sonner';
import Image from 'next/image';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const limit = 10;

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', status, page],
    queryFn: () => orderAPI.getOrders(status, page, limit),
    select: (response) => response.data.data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: () =>
      orderAPI.updateOrderStatus(
        selectedOrder?.orderId,
        newStatus,
        trackingNumber || undefined
      ),
    onSuccess: () => {
      toast.success('Order status updated successfully');
      setShowStatusDialog(false);
      refetch();
      setNewStatus('');
      setTrackingNumber('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update order';
      toast.error(message);
    },
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];

  const handleUpdateStatus = () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    updateStatusMutation.mutate();
  };

  const openStatusDialog = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setShowStatusDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Order</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; Order</p>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales History</CardTitle>
          </div>
          <Select value={status} onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {order.customer?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{order.customer?.name}</p>
                            <p className="text-xs text-slate-500">{order.customer?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.items?.[0]?.product?.photos?.[0] && (
                            <Image
                              src={order.items[0].product.photos[0].url || "/placeholder.svg"}
                              alt={order.items[0].product.title}
                              width={40}
                              height={40}
                              className="rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm">{order.items?.[0]?.product?.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>${order.totalAmount}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}{' '}
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(order)}
                          className="border-amber-300 text-amber-600 hover:bg-amber-50"
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={orders.length < limit}
          >
            Next
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.orderId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'shipped' && (
              <div>
                <Label htmlFor="tracking" className="text-sm font-medium">
                  Tracking Number
                </Label>
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="mt-2 border-2 border-amber-300"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
