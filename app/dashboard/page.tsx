'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, Package } from 'lucide-react';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['dashboard-overview', period],
    queryFn: () => dashboardAPI.getOverview(period),
    select: (response) => response.data.data,
  });

  const overview = overviewData?.overview || { totalSell: 0, liveProductCount: 0 };
  const sellReport = overviewData?.sellReport || { thisMonth: [], lastMonth: [], period };
  const newProductsReport = overviewData?.newProductsReport || {
    thisDay: 0,
    thisWeek: 0,
    thisMonth: 0,
  };

  const reportPeriod = sellReport?.period || period;

  const formatSellLabel = (value: number) => {
    if (reportPeriod === 'day') {
      return `${String(value).padStart(2, '0')}:00`;
    }
    if (reportPeriod === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[value - 1] || `${value}`;
    }
    if (reportPeriod === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[value - 1] || `${value}`;
    }
    return `${value}`;
  };

  // Prepare chart data from backend aggregates
  const sellChartData = (() => {
    const thisMonth = Array.isArray(sellReport.thisMonth) ? sellReport.thisMonth : [];
    const lastMonth = Array.isArray(sellReport.lastMonth) ? sellReport.lastMonth : [];
    const thisMap = new Map(thisMonth.map((item: any) => [Number(item._id), Number(item.sales || 0)]));
    const lastMap = new Map(lastMonth.map((item: any) => [Number(item._id), Number(item.sales || 0)]));
    const keys = Array.from(new Set([...thisMap.keys(), ...lastMap.keys()]))
      .sort((a, b) => a - b);

    return keys.map((key) => ({
      label: formatSellLabel(key),
      thisMonth: thisMap.get(key) || 0,
      lastMonth: lastMap.get(key) || 0,
    }));
  })();

  const newProductsData = [
    { name: 'This Day', value: newProductsReport.thisDay, fill: '#3b82f6' },
    { name: 'This Week', value: newProductsReport.thisWeek, fill: '#10b981' },
    { name: 'This Month', value: newProductsReport.thisMonth, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="text-slate-500 mt-1">Dashboard</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((p) => (
            <Button
              key={p}
              onClick={() => setPeriod(p as any)}
              variant={period === p ? 'default' : 'outline'}
              className={period === p ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-medium">Total Sell</CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <p className="text-2xl font-bold mt-2">${overview.totalSell || 0}</p>
              )}
            </div>
            <DollarSign className="w-10 h-10 text-amber-600" />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-medium">Live Product</CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <p className="text-2xl font-bold mt-2">{overview.liveProductCount || 0}</p>
              )}
            </div>
            <Package className="w-10 h-10 text-amber-600" />
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sell Report */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sell Report</CardTitle>
            <CardDescription>Sales performance for {period}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : sellChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sellChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="thisMonth"
                    stroke="#3b82f6"
                    name="This Month"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="lastMonth"
                    stroke="#10b981"
                    name="Last Month"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Products Report */}
        <Card>
          <CardHeader>
            <CardTitle>Total New Products Report</CardTitle>
            <CardDescription>Product distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={newProductsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {newProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
