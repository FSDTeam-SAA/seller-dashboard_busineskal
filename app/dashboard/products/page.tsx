'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { categoryAPI, productAPI, userAPI } from '@/lib/api';
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
import UpdateProduct from './_components/update_product';

type ExistingPhoto = {
  url: string;
  public_id?: string;
};

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    stock: '',
    category: '',
    subcategory: '',
    country: '',
    sku: '',
    description: '',
  });
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [colors, setColors] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [photosPreview, setPhotosPreview] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
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

  const { data: countries, isLoading: isCountriesLoading, isError: isCountriesError } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries');
      if (!response.ok) {
        throw new Error('Failed to load countries');
      }
      return response.json();
    },
    select: (data) =>
      Array.isArray(data)
        ? [...data].sort((a: any, b: any) => (a?.name || '').localeCompare(b?.name || ''))
        : [],
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
      if (editForm.subcategory) {
        fd.append('subcategory', editForm.subcategory);
      }
      fd.append('country', editForm.country);
      fd.append('sku', editForm.sku);
      fd.append('detailedDescription', editForm.description);
      if (colors.length > 0) {
        fd.append('colors', colors.join(','));
      }

      if (thumbnail) {
        fd.append('thumbnail', thumbnail);
      }

      photos.forEach((photo) => {
        fd.append('photos', photo);
      });

      if (removedPhotos.length > 0) {
        fd.append('removedPhotos', JSON.stringify(removedPhotos));
      }

      if (removeThumbnail) {
        fd.append('removeThumbnail', 'true');
      }

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
    if (!editTarget) {
      setEditForm({
        title: '',
        price: '',
        stock: '',
        category: '',
        subcategory: '',
        country: '',
        sku: '',
        description: '',
      });
      setSelectedColor('#000000');
      setColors([]);
      setThumbnail(null);
      setPhotos([]);
      setThumbnailPreview('');
      setPhotosPreview([]);
      setExistingPhotos([]);
      setRemovedPhotos([]);
      setRemoveThumbnail(false);
      setIsCountryOpen(false);
      return;
    }

    const rawCategoryId = editTarget.category?._id || editTarget.category || '';
    let categoryId = rawCategoryId;
    let subcategoryId = '';

    if (categories.length > 0 && rawCategoryId) {
      const isTop = categories.find((cat: any) => cat._id === rawCategoryId && !cat.parent);
      if (!isTop) {
        const parent = categories.find(
          (cat: any) =>
            Array.isArray(cat.children) &&
            cat.children.some((child: any) => child._id === rawCategoryId),
        );
        if (parent) {
          categoryId = parent._id;
          subcategoryId = rawCategoryId;
        }
      }
    }

    setEditForm({
      title: editTarget.title || '',
      price: String(editTarget.price ?? ''),
      stock: String(editTarget.stock ?? ''),
      category: categoryId,
      subcategory: subcategoryId,
      country: editTarget.country || '',
      sku: editTarget.sku || '',
      description: editTarget.detailedDescription || editTarget.description || '',
    });
    setColors(
      Array.isArray(editTarget.colors)
        ? editTarget.colors.map((c: any) =>
            typeof c === 'string' ? c.toLowerCase() : c,
          )
        : [],
    );
    setThumbnailPreview(editTarget.thumbnail || '');
    setExistingPhotos(
      Array.isArray(editTarget.photos)
        ? editTarget.photos
            .map((p: any) => ({ url: p?.url, public_id: p?.public_id }))
            .filter((p: ExistingPhoto) => p.url)
        : [],
    );
    setRemovedPhotos([]);
    setRemoveThumbnail(false);
  }, [editTarget, categories]);

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
      !editForm.country ||
      !editForm.sku
    ) {
      toast.error('Please fill in all required fields');
      return;
    }
    const selectedCategory = categories.find((cat: any) => cat._id === editForm.category);
    const subcategories = selectedCategory?.children || [];
    if (subcategories.length > 0 && !editForm.subcategory) {
      toast.error('Please select a subcategory');
      return;
    }
    updateMutation.mutate();
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setRemoveThumbnail(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotosPreview((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotosPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => {
      const removed = prev[index];
      if (removed?.public_id) {
        setRemovedPhotos((ids) =>
          ids.includes(removed.public_id) ? ids : [...ids, removed.public_id],
        );
      } else if (removed?.url) {
        setRemovedPhotos((ids) =>
          ids.includes(removed.url) ? ids : [...ids, removed.url],
        );
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview('');
    setRemoveThumbnail(true);
  };

  const addColor = () => {
    const normalized = selectedColor.toLowerCase();
    if (!colors.includes(normalized)) {
      setColors((prev) => [...prev, normalized]);
    }
  };

  const removeColor = (color: string) => {
    setColors((prev) => prev.filter((c) => c !== color));
  };

  const selectedCategory = categories.find((cat: any) => cat._id === editForm.category);
  const subcategories = selectedCategory?.children || [];

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
                    <TableHead>Date</TableHead>
                    <TableHead>stock</TableHead>
                    <TableHead>Admin verifiend</TableHead>
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
                      
                      <TableCell className="text-sm">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                          {product.verified ? 'Verified' : 'Not Verified'}
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

      <UpdateProduct
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        updateMutation={updateMutation}
        handleEditSave={handleEditSave}
        categories={categories}
        subcategories={subcategories}
        isCountryOpen={isCountryOpen}
        setIsCountryOpen={setIsCountryOpen}
        countries={countries}
        isCountriesLoading={isCountriesLoading}
        isCountriesError={isCountriesError}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        colors={colors}
        addColor={addColor}
        removeColor={removeColor}
        handleThumbnailChange={handleThumbnailChange}
        removeThumbnail={handleRemoveThumbnail}
        thumbnailPreview={thumbnailPreview}
        handlePhotosChange={handlePhotosChange}
        photosPreview={photosPreview}
        removePhoto={removePhoto}
        removeExistingPhoto={removeExistingPhoto}
        existingPhotos={existingPhotos}
      />

     
    </div>
  );
}
