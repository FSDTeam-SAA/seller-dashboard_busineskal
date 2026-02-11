'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PendingProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Product List</h1>
        <p className="text-slate-500 mt-1">Dashboard &gt; Pending Product &gt; List</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Products</CardTitle>
          <CardDescription>Products awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500">No pending products at this time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
