import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, CreditCard, Donut } from "lucide-react";
import { hostApi } from "@/services/api";

const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function HostEarningsPage() {
  const { user } = useAppContext();
  const [, setLocation] = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "host") return;
    Promise.all([
      hostApi.dashboard(),
      hostApi.monthlyEarnings(),
    ])
      .then(([dashData, earningsData]) => {
        setDashboard(dashData);
        const earningsMap = {};
        (earningsData || []).forEach((item) => {
          earningsMap[item.month] = Number(item.amount);
        });
        const now = new Date();
        const currentMonth = now.getMonth();
        setMonthlyData(allMonths.slice(0, currentMonth + 1).map((month) => ({
          month,
          amount: earningsMap[month] || 0,
        })));
      })
      .catch(() => { setDashboard(null); setMonthlyData([]); })
      .finally(() => setLoading(false));
  }, [user]);

  const totalEarnings = dashboard?.totalEarnings ?? 0;
  const monthlyEarnings = dashboard?.monthlyEarnings ?? 0;
  const confirmedBookings = dashboard?.confirmedBookings ?? 0;
  const avgPerBooking = confirmedBookings > 0 ? Math.round(totalEarnings / confirmedBookings) : 0;

  if (!user || user.role !== "host") {
    return <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Host access required</h2>
        <Button onClick={() => setLocation("/")}>Go home</Button>
      </div>;
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading earnings…</div>;
  }

  return <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Earnings</h1>
          <p className="text-muted-foreground mt-1">Track your revenue and payouts</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
    { label: "Total Earnings", value: `$${Number(totalEarnings).toLocaleString()}`, icon: DollarSign, sub: "All time", color: "text-green-600" },
    { label: "This Month", value: `$${Number(monthlyEarnings).toLocaleString()}`, icon: TrendingUp, sub: "Last 30 days", color: "text-blue-600" },
    { label: "Confirmed Bookings", value: confirmedBookings, icon: CreditCard, sub: "Revenue generating", color: "text-primary" },
    { label: "Net Payout", value: `$${Number(totalEarnings * 0.97).toLocaleString()}`, icon: Donut, sub: "All time", color: "text-purple-600" },
    // { label: "N/A", value: `NA`, icon: ArrowUpRight, sub: "N/A", color: "text-amber-600" }
  ].map((stat) => <div key={stat.label} className="bg-card border rounded-2xl p-5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>)}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-serif text-xl font-semibold mb-2">Monthly Earnings</h2>
            <p className="text-sm text-muted-foreground mb-6">Revenue by month — 2026</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1e3}k`} className="text-muted-foreground" />
                <Tooltip
    formatter={(value) => [`$${value.toLocaleString()}`, "Earnings"]}
    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
  />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b">
            <h2 className="font-serif text-xl font-semibold">Earnings Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Month</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Gross</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Service Fee (3%)</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyData.slice().reverse().map((row, i) => <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium">{row.month} 2026</td>
                    <td className="p-4 text-sm text-right">${row.amount.toLocaleString()}</td>
                    <td className="p-4 text-sm text-right text-muted-foreground">-${Math.round(row.amount * 0.03).toLocaleString()}</td>
                    <td className="p-4 text-sm text-right font-semibold">${Math.round(row.amount * 0.97).toLocaleString()}</td>
                  </tr>)}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t">
                  <td className="p-4 font-semibold">Total</td>
                  <td className="p-4 font-semibold text-right">${Number(totalEarnings).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-right text-muted-foreground">-${Math.round(Number(totalEarnings) * 0.03).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-right">${Math.round(Number(totalEarnings) * 0.97).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>;
}
export {
  HostEarningsPage
};
