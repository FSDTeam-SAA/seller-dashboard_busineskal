'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Check, ChevronsUpDown, Upload, X } from 'lucide-react';

type EditForm = {
  title: string;
  price: string;
  stock: string;
  category: string;
  subcategory: string;
  country: string;
  sku: string;
  description: string;
};

type UpdateProductProps = {
  open: boolean;
  onClose: () => void;
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
  updateMutation: { isPending: boolean };
  handleEditSave: (e: React.FormEvent) => void;
  categories: any[];
  subcategories: any[];
  isCountryOpen: boolean;
  setIsCountryOpen: (open: boolean) => void;
  countries: any[];
  isCountriesLoading: boolean;
  isCountriesError: boolean;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  colors: string[];
  addColor: () => void;
  removeColor: (color: string) => void;
  handleThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  thumbnailPreview: string;
  handlePhotosChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photosPreview: string[];
  removePhoto: (index: number) => void;
  existingPhotos: string[];
};

export default function UpdateProduct({
  open,
  onClose,
  editForm,
  setEditForm,
  updateMutation,
  handleEditSave,
  categories,
  subcategories,
  isCountryOpen,
  setIsCountryOpen,
  countries,
  isCountriesLoading,
  isCountriesError,
  selectedColor,
  setSelectedColor,
  colors,
  addColor,
  removeColor,
  handleThumbnailChange,
  thumbnailPreview,
  handlePhotosChange,
  photosPreview,
  removePhoto,
  existingPhotos,
}: UpdateProductProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* ✅ Fixed: max height + scroll */}
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden">
        <div className="p-6 border-b">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
        </div>

        {/* ✅ scroll area */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <form onSubmit={handleEditSave} className="space-y-6">
            {/* ✅ Fixed: 2-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
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

              {/* Price */}
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

              {/* Stock */}
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

              {/* Category */}
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(val) =>
                    setEditForm({ ...editForm, category: val, subcategory: '' })
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="border-2 border-amber-300 mt-2">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat: any) => !cat.parent)
                      .map((cat: any) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              <div>
                <Label className="text-sm font-medium">Subcategory</Label>
                <Select
                  value={editForm.subcategory}
                  onValueChange={(val) => setEditForm({ ...editForm, subcategory: val })}
                  disabled={
                    updateMutation.isPending || !editForm.category || subcategories.length === 0
                  }
                >
                  <SelectTrigger className="border-2 border-amber-300 mt-2">
                    <SelectValue
                      placeholder={
                        !editForm.category
                          ? 'Select a category first'
                          : subcategories.length === 0
                            ? 'No subcategories'
                            : 'Select a subcategory'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub: any) => (
                      <SelectItem key={sub._id} value={sub._id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Country</Label>
                <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCountryOpen}
                      className={cn(
                        'w-full justify-between border-2 border-amber-300 mt-2 bg-white',
                        !editForm.country && 'text-slate-500',
                      )}
                      disabled={updateMutation.isPending}
                    >
                      {editForm.country || 'Select a country'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        {isCountriesLoading && <CommandEmpty>Loading countries...</CommandEmpty>}
                        {isCountriesError && <CommandEmpty>Failed to load countries</CommandEmpty>}
                        {!isCountriesLoading && !isCountriesError && (
                          <>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries?.map((country: any) => (
                                <CommandItem
                                  key={country.alpha2Code || country.name}
                                  value={country.name}
                                  onSelect={() => {
                                    setEditForm({ ...editForm, country: country.name });
                                    setIsCountryOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      editForm.country === country.name
                                        ? 'opacity-100'
                                        : 'opacity-0',
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

              {/* SKU */}
              <div>
                <Label className="text-sm font-medium">SKU</Label>
                <Input
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  className="mt-2 border-2 border-amber-300"
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Colors */}
              <div>
                <Label className="text-sm font-medium">Colors</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border-2 border-amber-300 bg-white p-1"
                    disabled={updateMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-amber-300"
                    onClick={addColor}
                    disabled={updateMutation.isPending}
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
                        />
                        <span className="text-sm">{color.toUpperCase()}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="text-slate-500 hover:text-slate-700"
                          disabled={updateMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-2 border-2 border-amber-300 resize-none"
                  rows={4}
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Thumbnail */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Thumbnail</Label>
                <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-6 cursor-pointer hover:border-amber-600">
                  <Upload className="w-8 h-8 text-amber-600 mb-2" />
                  <span className="text-sm text-slate-600">Upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    disabled={updateMutation.isPending}
                  />
                </label>

                {thumbnailPreview && (
                  <div className="mt-4 rounded-lg border overflow-hidden">
                    <img
                      src={thumbnailPreview || '/placeholder.svg'}
                      alt="Thumbnail preview"
                      className="w-full max-h-[260px] object-contain bg-white"
                    />
                  </div>
                )}
              </div>

              {/* More Images */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Upload more picture/video</Label>
                <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-6 cursor-pointer hover:border-amber-600">
                  <Upload className="w-8 h-8 text-amber-600 mb-2" />
                  <span className="text-sm text-slate-600">Upload images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotosChange}
                    className="hidden"
                    disabled={updateMutation.isPending}
                  />
                </label>

                {photosPreview.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photosPreview.map((preview, idx) => (
                      <div key={idx} className="relative rounded-lg border overflow-hidden bg-white">
                        <img
                          src={preview || '/placeholder.svg'}
                          alt={`Photo ${idx}`}
                          className="w-full h-36 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded"
                          disabled={updateMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {existingPhotos.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Current photos</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {existingPhotos.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="rounded-lg border overflow-hidden bg-white">
                          <img
                            src={url || '/placeholder.svg'}
                            alt={`Existing photo ${idx + 1}`}
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* ✅ Sticky footer */}
        <div className="border-t p-4 flex justify-end gap-2 bg-white">
          <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="__update_product_form__"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={updateMutation.isPending}
            onClick={(e) => {
              // trigger same form submit
              const form = (e.currentTarget.ownerDocument || document).querySelector('form');
              form?.requestSubmit();
            }}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
