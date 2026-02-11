'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { categoryAPI, productAPI, userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    sku: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreview, setPhotosPreview] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getCategories(),
    select: (response) => response.data.data,
  });

  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userAPI.getProfile(),
    select: (response) => response.data.data,
  });

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productAPI.getProductById(productId),
    select: (response) => response.data.data,
    enabled: !!productId,
  });

  useEffect(() => {
    if (productData) {
      setFormData({
        title: productData.title || '',
        price: String(productData.price ?? ''),
        stock: String(productData.stock ?? ''),
        category: productData.category?._id || productData.category || '',
        description: productData.detailedDescription || productData.description || '',
        sku: productData.sku || '',
      });
    }
  }, [productData]);

  const updateProductMutation = useMutation({
    mutationFn: async () => {
      if (!profileData?.shopId) {
        throw new Error('Shop not found. Please contact support.');
      }
      const fd = new FormData();
      fd.append('shopId', profileData.shopId);
      fd.append('title', formData.title);
      fd.append('price', formData.price);
      fd.append('stock', formData.stock);
      fd.append('category', formData.category);
      fd.append('detailedDescription', formData.description);
      fd.append('sku', formData.sku);

      photos.forEach((photo) => {
        fd.append('photos', photo);
      });

      return productAPI.updateProduct(productId, fd);
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
      router.push('/dashboard/products');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error?.message || 'Failed to update product';
      toast.error(message);
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.stock || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!profileData?.shopId) {
      toast.error('Shop not found. Please contact support.');
      return;
    }

    updateProductMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; Product &gt; Edit Product</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Product Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="Product title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="border-2 border-amber-300 mt-2"
                      disabled={updateProductMutation.isPending}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium">
                        Price
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="Price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="border-2 border-amber-300 mt-2"
                        disabled={updateProductMutation.isPending}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock" className="text-sm font-medium">
                        Quantity kg / per box
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        placeholder="Quantity"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="border-2 border-amber-300 mt-2"
                        disabled={updateProductMutation.isPending}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border-2 border-amber-300 mt-2 resize-none"
                      rows={8}
                      disabled={updateProductMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Category & Images */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                      disabled={updateProductMutation.isPending}
                    >
                      <SelectTrigger className="border-2 border-amber-300 mt-2">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat: any) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sku" className="text-sm font-medium">
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      placeholder="Product SKU"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="border-2 border-amber-300 mt-2"
                      disabled={updateProductMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Existing Photos */}
              {productData?.photos?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Existing Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {productData.photos.map((photo: any) => (
                        <img
                          key={photo.public_id || photo.url}
                          src={photo.url || '/placeholder.svg'}
                          alt="Product"
                          className="h-20 w-full rounded object-cover"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upload more picture/video</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-6 cursor-pointer hover:border-amber-600">
                    <Upload className="w-8 h-8 text-amber-600 mb-2" />
                    <span className="text-sm text-slate-600">Upload images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosChange}
                      className="hidden"
                      disabled={updateProductMutation.isPending}
                    />
                  </label>

                  {photosPreview.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {photosPreview.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview || '/placeholder.svg'}
                            alt={`Photo ${idx}`}
                            className="w-full h-auto rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateProductMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
