'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { categoryAPI, productAPI, userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableSkeleton } from '@/components/table-skeleton';
import { Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
    description: '',
  });
  const limit = 10;
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userAPI.getProfile(),
    select: (response) => response.data.data,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getCategories(),
    select: (response) => response.data.data,
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['my-products', page],
    queryFn: () => productAPI.getMyProducts(page, limit),
    select: (response) => response.data.data,
  });

  const products = Array.isArray(productsData) ? productsData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productAPI.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete product';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editTarget?._id) {
        throw new Error('Product not selected');
      }
      if (!profileData?.shopId) {
        throw new Error('Shop not found. Please contact support.');
      }

      const fd = new FormData();
      fd.append('shopId', profileData.shopId);
      fd.append('title', editForm.title);
      fd.append('price', editForm.price);
      fd.append('stock', editForm.stock);
      fd.append('category', editForm.category);
      fd.append('sku', editForm.sku);
      fd.append('detailedDescription', editForm.description);

      return productAPI.updateProduct(editTarget._id, fd);
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || error?.message || 'Failed to update product';
      toast.error(message);
    },
  });

  useEffect(() => {
    if (editTarget) {
      setEditForm({
        title: editTarget.title || '',
        price: String(editTarget.price ?? ''),
        stock: String(editTarget.stock ?? ''),
        category: editTarget.category?._id || editTarget.category || '',
        sku: editTarget.sku || '',
        description: editTarget.detailedDescription || editTarget.description || '',
      });
    }
  }, [editTarget]);

  const handleDeleteConfirm = () => {
    if (deleteTarget?._id) {
      deleteMutation.mutate(deleteTarget._id);
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editForm.title ||
      !editForm.price ||
      !editForm.stock ||
      !editForm.category ||
      !editForm.sku
    ) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active Product List</h1>
          <p className="text-slate-500 mt-1">Dashboard &gt; Active Product</p>
        </div>
        <Link href="/dashboard/products/add">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Your active product listings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.thumbnail && (
                            <Image
                              src={product?.thumbnail || "/placeholder.svg"}
                              alt={product?.title}
                              width={40}
                              height={40}
                              className="rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-medium">{product.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>{product.stock} KG/1box</TableCell>
                      <TableCell className="text-sm">
                        {new Date(product.createdAt).toLocaleDateString()}{' '}
                        {new Date(product.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                          {product.status?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditTarget(product)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(product)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No products found</p>
              <Link href="/dashboard/products/add">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  Add Your First Product
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination - simplified */}
      {products.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
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
            disabled={products.length < limit}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget?.title}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              No
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="mt-2 border-2 border-amber-300"
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="text-sm font-medium">
                  Price
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="mt-2 border-2 border-amber-300"
                  disabled={updateMutation.isPending}
                />
              </div>
              <div>
                <Label htmlFor="edit-stock" className="text-sm font-medium">
                  Quantity kg / per box
                </Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="mt-2 border-2 border-amber-300"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category" className="text-sm font-medium">
                Category
              </Label>
              <Select
                value={editForm.category}
                onValueChange={(val) => setEditForm({ ...editForm, category: val })}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger className="border-2 border-amber-300 mt-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-sku" className="text-sm font-medium">
                SKU
              </Label>
              <Input
                id="edit-sku"
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                className="mt-2 border-2 border-amber-300"
                disabled={updateMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-2 border-2 border-amber-300 resize-none"
                rows={4}
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
