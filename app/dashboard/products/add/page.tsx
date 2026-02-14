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
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Upload, X } from 'lucide-react';

export default function AddProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stock: '',
    category: '',
    subcategory: '',
    country: '',
    description: '',
    sku: '',
  });
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [colors, setColors] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [photosPreview, setPhotosPreview] = useState<string[]>([]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const { data: categories } = useQuery({
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
      if (formData.subcategory) {
        fd.append('subcategory', formData.subcategory);
      }
      fd.append('country', formData.country);
      fd.append('detailedDescription', formData.description);
      fd.append('sku', formData.sku);
      if (colors.length > 0) {
        fd.append('colors', colors.join(','));
      }

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

  const addColor = () => {
    const normalized = selectedColor.toLowerCase();
    if (!colors.includes(normalized)) {
      setColors((prev) => [...prev, normalized]);
    }
  };

  const removeColor = (color: string) => {
    setColors((prev) => prev.filter((c) => c !== color));
  };

  const selectedCategory = categories?.find((cat: any) => cat._id === formData.category);
  const subcategories = selectedCategory?.children || [];

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

    if (subcategories.length > 0 && !formData.subcategory) {
      toast.error('Please select a subcategory');
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

                <div>
                  <Label htmlFor="colors" className="text-sm font-medium">
                    Colors
                  </Label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="colors"
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border-2 border-amber-300 bg-white p-1"
                      aria-label="Pick a color"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-amber-300"
                      onClick={addColor}
                    >
                      Add Color
                    </Button>
                  </div>

                  {colors.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <div
                          key={color}
                          className="flex items-center gap-2 rounded-full border border-amber-300 px-3 py-1"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-slate-300"
                            style={{ backgroundColor: color }}
                            aria-hidden="true"
                          />
                          <span className="text-sm">{color.toUpperCase()}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="text-slate-500 hover:text-slate-700"
                            aria-label={`Remove ${color}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    onValueChange={(val) =>
                      setFormData({ ...formData, category: val, subcategory: '' })
                    }
                  >
                    <SelectTrigger className="border-2 border-amber-300 mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.filter((cat: any) => !cat.parent)?.map((cat: any) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium">
                    Subcategory
                  </Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(val) => setFormData({ ...formData, subcategory: val })}
                    disabled={!formData.category || subcategories.length === 0}
                  >
                    <SelectTrigger className="border-2 border-amber-300 mt-2">
                      <SelectValue
                        placeholder={
                          !formData.category
                            ? 'Select a category first'
                            : subcategories.length === 0
                              ? 'No subcategories'
                              : 'Select a subcategory'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!formData.category && (
                        <SelectItem value="__no-category" disabled>
                          Select a category first
                        </SelectItem>
                      )}
                      {formData.category && subcategories.length === 0 && (
                        <SelectItem value="__no-sub" disabled>
                          No subcategories available
                        </SelectItem>
                      )}
                      {subcategories.map((sub: any) => (
                        <SelectItem key={sub._id} value={sub._id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCountryOpen}
                        className={cn(
                          'w-full justify-between border-2 border-amber-300 mt-2 bg-white',
                          !formData.country && 'text-slate-500',
                        )}
                      >
                        {formData.country || 'Select a country'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          {isCountriesLoading && (
                            <CommandEmpty>Loading countries...</CommandEmpty>
                          )}
                          {isCountriesError && (
                            <CommandEmpty>Failed to load countries</CommandEmpty>
                          )}
                          {!isCountriesLoading && !isCountriesError && (
                            <>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries?.map((country: any) => (
                                  <CommandItem
                                    key={country.alpha2Code || country.name}
                                    value={country.name}
                                    onSelect={() => {
                                      setFormData({ ...formData, country: country.name });
                                      setIsCountryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        formData.country === country.name ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                <div>
                  <Label htmlFor="stock" className="text-sm font-medium">
                    In Stock
                  </Label>
                  <Input
                    id="stock"
                    placeholder="Product Stock"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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
