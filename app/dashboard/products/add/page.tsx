'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productAPI, categoryAPI, userAPI } from '@/lib/api';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

export default function AddProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stock: '',
    category: '',
    country: '',
    description: '',
    sku: '',
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
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

  const addProductMutation = useMutation({
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
      fd.append('country', formData.country);
      fd.append('detailedDescription', formData.description);
      fd.append('sku', formData.sku);

      if (thumbnail) {
        fd.append('thumbnail', thumbnail);
      }

      photos.forEach((photo) => {
        fd.append('photos', photo);
      });

      return productAPI.addProduct(fd);
    },
    onSuccess: () => {
      toast.success('Product added successfully');
      router.push('/dashboard/products');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error?.message || 'Failed to add product';
      toast.error(message);
    },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos([...photos, ...files]);

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

    if (
      !formData.title ||
      !formData.price ||
      !formData.stock ||
      !formData.category ||
      !formData.country
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!profileData?.shopId) {
      toast.error('Shop not found. Please contact support.');
      return;
    }

    addProductMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; Product &gt; Add Product</p>
      </div>

      {/* Form */}
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
                    Add Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Add your title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border-2 border-amber-300 mt-2"
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
                      placeholder="Add price..."
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="border-2 border-amber-300 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium">
                      Quantity kg / per box
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="Add Quantity..."
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="border-2 border-amber-300 mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Description....."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="border-2 border-amber-300 mt-2 resize-none"
                    rows={8}
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
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
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
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Select value={formData.country} onValueChange={(val) => setFormData({ ...formData, country: val })}>
                    <SelectTrigger className="border-2 border-amber-300 mt-2">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BD">Bangladesh</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="US">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="PK">Pakistan</SelectItem>
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-6 cursor-pointer hover:border-amber-600">
                  <Upload className="w-8 h-8 text-amber-600 mb-2" />
                  <span className="text-sm text-slate-600">Upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
                {thumbnailPreview && (
                  <div className="mt-4">
                    <img
                      src={thumbnailPreview || "/placeholder.svg"}
                      alt="Thumbnail preview"
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photos Upload */}
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
                  />
                </label>

                {photosPreview.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {photosPreview.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview || "/placeholder.svg"}
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

                {photos.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-amber-600 text-amber-600 bg-transparent"
                  >
                    + Add more
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={addProductMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8"
          >
            {addProductMutation.isPending ? 'Publishing...' : 'Publish Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
