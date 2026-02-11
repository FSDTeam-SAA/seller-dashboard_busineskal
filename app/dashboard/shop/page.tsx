'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shopAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ShopPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const { data: shopData, isLoading } = useQuery({
    queryKey: ['my-shop'],
    queryFn: () => shopAPI.getMyShop(),
    select: (response) => response.data.data,
  });

  useEffect(() => {
    if (shopData) {
      setName(shopData?.name || '');
      setAddress(shopData?.address || '');
      setDescription(shopData?.description || '');
    }
  }, [shopData]);

  const updateShopMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      if (name) fd.append('name', name);
      if (address) fd.append('address', address);
      if (description) fd.append('description', description);
      return shopAPI.updateMyShop(fd);
    },
    onSuccess: () => {
      toast.success('Shop updated successfully');
      queryClient.invalidateQueries({ queryKey: ['my-shop'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update shop';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopMutation.mutate();
  };

  const statusLabel = shopData?.shopStatus === 'verified' ? 'Verified' : 'Not verified';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Shop</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; My Shop</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shop Information</CardTitle>
            <CardDescription>Update your shop profile details</CardDescription>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            shopData?.shopStatus === 'verified'
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {statusLabel}
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div>
                <Label htmlFor="shop-name" className="text-sm font-medium">
                  Shop Name
                </Label>
                <Input
                  id="shop-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 border-2 border-amber-300"
                  placeholder="Enter shop name"
                  disabled={updateShopMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="shop-address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="shop-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2 border-2 border-amber-300"
                  placeholder="Enter shop address"
                  disabled={updateShopMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="shop-description" className="text-sm font-medium">
                  About Us
                </Label>
                <Textarea
                  id="shop-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 border-2 border-amber-300 resize-none"
                  rows={6}
                  placeholder="Tell customers about your shop"
                  disabled={updateShopMutation.isPending}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateShopMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {updateShopMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
