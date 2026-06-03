import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, Edit3, DollarSign, CalendarDays, TrendingUp,
  Building2, MapPin, Sun, AlertTriangle, X, Check,
} from "lucide-react";
import { pricingApi, hostApi } from "@/services/api";

function formatDate(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function HostPricingPage() {
  const { user } = useAppContext();
  const [, setLocation] = useLocation();
  const [hostProps, setHostProps] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [seasonalRates, setSeasonalRates] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Season dialog
  const [seasonDialog, setSeasonDialog] = useState({ open: false, edit: null });
  const [seasonForm, setSeasonForm] = useState({
    name: "", startDate: "", endDate: "", adjustmentType: "PERCENTAGE", adjustmentValue: "50",
  });
  const [applyToAll, setApplyToAll] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);
  const [savingSeason, setSavingSeason] = useState(false);

  const [actionMsg, setActionMsg] = useState("");

  const isHost = user?.role === "host" || user?.role === "admin";

  const fetchData = useCallback(() => {
    if (!isHost || !selectedPropertyId) return;
    setLoading(true);
    Promise.all([
      pricingApi.getSeasonalRates(Number(selectedPropertyId)),
      pricingApi.getConfig(Number(selectedPropertyId)),
    ])
      .then(([rates, cfg]) => {
        setSeasonalRates(rates || []);
        setConfig(cfg);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isHost, selectedPropertyId]);

  useEffect(() => {
    if (!isHost) return;
    hostApi.myProperties(0, 100)
      .then((res) => {
        const list = res?.content || [];
        setHostProps(list);
        if (list.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [isHost]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold mb-4">Host access required</h2>
          <Button onClick={() => setLocation("/")}>Go home</Button>
        </div>
      </div>
    );
  }

  const selectedProperty = hostProps.find((p) => String(p.id) === selectedPropertyId);

  // ── Season rate handlers ──

  const openAddSeason = () => {
    setSeasonForm({ name: "", startDate: "", endDate: "", adjustmentType: "PERCENTAGE", adjustmentValue: "50" });
    setApplyToAll(false);
    setSelectedPropertyIds([]);
    setSeasonDialog({ open: true, edit: null });
  };

  const openEditSeason = (rate) => {
    setSeasonForm({
      name: rate.name,
      startDate: rate.startDate,
      endDate: rate.endDate,
      adjustmentType: rate.adjustmentType || "PERCENTAGE",
      adjustmentValue: String(rate.adjustmentValue ?? 50),
    });
    setSeasonDialog({ open: true, edit: rate });
  };

  const handleSaveSeason = async () => {
    if (!seasonForm.name.trim() || !seasonForm.startDate || !seasonForm.endDate) return;
    setSavingSeason(true);
    try {
      if (seasonDialog.edit) {
        await pricingApi.updateSeasonalRate(seasonDialog.edit.id, {
          propertyId: Number(selectedPropertyId),
          name: seasonForm.name.trim(),
          startDate: seasonForm.startDate,
          endDate: seasonForm.endDate,
          adjustmentType: seasonForm.adjustmentType,
          adjustmentValue: Number(seasonForm.adjustmentValue),
        });
      } else {
        const payload = {
          name: seasonForm.name.trim(),
          startDate: seasonForm.startDate,
          endDate: seasonForm.endDate,
          adjustmentType: seasonForm.adjustmentType,
          adjustmentValue: Number(seasonForm.adjustmentValue),
        };
        if (applyToAll) {
          payload.propertyIds = hostProps.map((p) => Number(p.id));
        } else if (selectedPropertyIds.length > 0) {
          payload.propertyIds = selectedPropertyIds;
        } else {
          payload.propertyId = Number(selectedPropertyId);
        }
        await pricingApi.createSeasonalRate(payload);
      }
      setActionMsg(seasonDialog.edit ? "Season updated" : "Season created");
      setSeasonDialog({ open: false, edit: null });
      fetchData();
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save season");
    } finally {
      setSavingSeason(false);
    }
  };

  const handleDeleteSeason = async (id) => {
    if (!confirm("Delete this seasonal rate?")) return;
    try {
      await pricingApi.deleteSeasonalRate(id);
      setActionMsg("Season deleted");
      fetchData();
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      alert("Failed to delete season");
    }
  };

  // ── Config handlers ──

  const handleToggleDemand = async (enabled) => {
    try {
      const saved = await pricingApi.saveConfig({
        propertyId: Number(selectedPropertyId),
        enabled,
        minPriceMultiplier: Number(config?.minPriceMultiplier ?? 1),
        maxPriceMultiplier: Number(config?.maxPriceMultiplier ?? 2),
        demandThreshold: Number(config?.demandThreshold ?? 5),
        lookbackMonths: Number(config?.lookbackMonths ?? 3),
      });
      setConfig(saved);
      setActionMsg(enabled ? "Demand pricing enabled" : "Demand pricing disabled");
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      alert("Failed to update config");
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const saved = await pricingApi.saveConfig({
        propertyId: Number(selectedPropertyId),
        enabled: config.enabled,
        minPriceMultiplier: Number(config.minPriceMultiplier),
        maxPriceMultiplier: Number(config.maxPriceMultiplier),
        demandThreshold: Number(config.demandThreshold),
        lookbackMonths: Number(config.lookbackMonths),
      });
      setConfig(saved);
      setActionMsg("Pricing config saved");
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      alert("Failed to save config");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Pricing</h1>
            <p className="text-sm text-muted-foreground">Manage seasonal rates & demand-based pricing</p>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium text-center animate-in slide-in-from-top-2 duration-200">
            {actionMsg}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {hostProps.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-serif text-xl font-bold mb-2">No properties yet</p>
            <p className="text-muted-foreground mb-6">Add a property to configure pricing.</p>
            <Button onClick={() => setLocation("/host/add-property")} className="rounded-xl">
              Add property
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Property sidebar */}
            <aside className="w-full lg:w-72 shrink-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Properties
              </h2>
              <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 scrollbar-thin">
                {hostProps.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPropertyId(String(p.id))}
                    className={`w-full text-left rounded-xl p-3 transition-all duration-150 flex items-center gap-3 group
                      ${String(p.id) === selectedPropertyId
                        ? "bg-primary/10 border border-primary/30 shadow-sm"
                        : "bg-card border border-transparent hover:bg-muted/60 hover:border-border"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${p.imageUrls?.[0] ? "" : "bg-muted"}`}>
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-sm truncate ${String(p.id) === selectedPropertyId ? "text-primary" : ""}`}>
                        {p.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">${p.pricePerNight}/night</p>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 space-y-8">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading pricing…</div>
              ) : !selectedProperty ? (
                <div className="text-center py-12 text-muted-foreground">Select a property</div>
              ) : (
                <>
                  {/* Seasonal Rates */}
                  <section className="bg-card border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Sun className="w-5 h-5 text-amber-500" />
                        <h2 className="font-serif text-xl font-semibold">Seasonal Rates</h2>
                      </div>
                      <Button onClick={openAddSeason} className="gap-2 rounded-xl" size="sm">
                        <Plus className="w-4 h-4" /> Add Season
                      </Button>
                    </div>

                    {seasonalRates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                        <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No seasonal rates configured</p>
                        <p className="text-xs mt-1">Add rates for summer, holidays, wedding seasons, etc.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {seasonalRates.map((rate) => (
                          <div key={rate.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{rate.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {rate.adjustmentType === "PERCENTAGE"
                                    ? `+${rate.adjustmentValue}%`
                                    : `+$${rate.adjustmentValue}/night`}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(rate.startDate)} — {formatDate(rate.endDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditSeason(rate)}>
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => handleDeleteSeason(rate.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Demand-Based Pricing */}
                  <section className="bg-card border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h2 className="font-serif text-xl font-semibold">Demand-Based Pricing</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {config?.enabled ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          checked={config?.enabled || false}
                          onCheckedChange={handleToggleDemand}
                        />
                      </div>
                    </div>

                    <div className={`space-y-5 ${config?.enabled ? "" : "opacity-50 pointer-events-none"}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Min Price Multiplier</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              max="10"
                              value={config?.minPriceMultiplier ?? 1}
                              onChange={(e) => setConfig((prev) => ({ ...prev, minPriceMultiplier: e.target.value }))}
                              className="rounded-xl pl-7"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Default: 1.0x (base price)</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Max Price Multiplier</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              max="10"
                              value={config?.maxPriceMultiplier ?? 2}
                              onChange={(e) => setConfig((prev) => ({ ...prev, maxPriceMultiplier: e.target.value }))}
                              className="rounded-xl pl-7"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Default: 2.0x (max increase)</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Demand Threshold</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={config?.demandThreshold ?? 5}
                            onChange={(e) => setConfig((prev) => ({ ...prev, demandThreshold: e.target.value }))}
                            className="rounded-xl"
                          />
                          <p className="text-xs text-muted-foreground">Bookings/mo to trigger increase</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Lookback Period (months)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            value={config?.lookbackMonths ?? 3}
                            onChange={(e) => setConfig((prev) => ({ ...prev, lookbackMonths: e.target.value }))}
                            className="rounded-xl w-28"
                          />
                        </div>
                        <div className="pt-5">
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={handleSaveConfig}
                          >
                            Save Config
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">How it works</p>
                          <p>When bookings exceed the threshold in the lookback period, prices automatically increase between the min and max multipliers. Higher booking volume = higher price.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Pricing Summary */}
                  <section className="bg-card border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <h2 className="font-serif text-xl font-semibold">Current Pricing</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Base Price</p>
                        <p className="text-2xl font-bold mt-1">${selectedProperty?.pricePerNight}</p>
                        <p className="text-xs text-muted-foreground">per night</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Seasonal Rates</p>
                        <p className="text-2xl font-bold mt-1">{seasonalRates.length}</p>
                        <p className="text-xs text-muted-foreground">active seasons</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Demand Pricing</p>
                        <p className="text-2xl font-bold mt-1">{config?.enabled ? "ON" : "OFF"}</p>
                        <p className="text-xs text-muted-foreground">{config?.enabled ? "1.0x–" + config.maxPriceMultiplier + "x" : "Disabled"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Cleaning Fee</p>
                        <p className="text-2xl font-bold mt-1">${selectedProperty?.cleaningFee || 0}</p>
                        <p className="text-xs text-muted-foreground">one-time</p>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Season Dialog */}
      <Dialog open={seasonDialog.open} onOpenChange={(o) => { if (!o) setSeasonDialog({ open: false, edit: null }); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              {seasonDialog.edit ? "Edit Seasonal Rate" : "Add Seasonal Rate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Season Name</Label>
              <Input
                placeholder="e.g. Summer Vacation, Wedding Season"
                value={seasonForm.name}
                onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={seasonForm.startDate}
                  onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={seasonForm.endDate}
                  onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSeasonForm({ ...seasonForm, adjustmentType: "PERCENTAGE" })}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                    seasonForm.adjustmentType === "PERCENTAGE"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:border-primary/50"
                  }`}
                >
                  Percentage (+%)
                </button>
                <button
                  type="button"
                  onClick={() => setSeasonForm({ ...seasonForm, adjustmentType: "FIXED_AMOUNT" })}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                    seasonForm.adjustmentType === "FIXED_AMOUNT"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:border-primary/50"
                  }`}
                >
                  Fixed Amount (+$)
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{seasonForm.adjustmentType === "PERCENTAGE" ? "Percentage Increase" : "Fixed Amount per Night"}</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {seasonForm.adjustmentType === "PERCENTAGE" ? "+" : "$"}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step={seasonForm.adjustmentType === "PERCENTAGE" ? "1" : "0.01"}
                    value={seasonForm.adjustmentValue}
                    onChange={(e) => setSeasonForm({ ...seasonForm, adjustmentValue: e.target.value })}
                    className="rounded-xl pl-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {seasonForm.adjustmentType === "PERCENTAGE" ? "%" : ""}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground shrink-0">
                  {selectedProperty && seasonForm.adjustmentType === "PERCENTAGE"
                    ? `= $${(Number(selectedProperty.pricePerNight) * (1 + Number(seasonForm.adjustmentValue || 0) / 100)).toFixed(0)}/night`
                    : selectedProperty && seasonForm.adjustmentType === "FIXED_AMOUNT"
                    ? `= $${(Number(selectedProperty.pricePerNight) + Number(seasonForm.adjustmentValue || 0)).toFixed(0)}/night`
                    : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {seasonForm.adjustmentType === "PERCENTAGE"
                  ? "The price increases by this percentage above the base price"
                  : "This fixed amount is added to the base price per night"}
              </p>
            </div>
            {!seasonDialog.edit && (
              <div className="space-y-2 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => {
                      setApplyToAll(e.target.checked);
                      if (e.target.checked) setSelectedPropertyIds([]);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Apply to all properties</span>
                </label>
                {!applyToAll && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Or select specific properties:</p>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-sm">
                      {hostProps.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPropertyIds.includes(Number(p.id))}
                            onChange={(e) => {
                              setSelectedPropertyIds((prev) =>
                                e.target.checked
                                  ? [...prev, Number(p.id)]
                                  : prev.filter((id) => id !== Number(p.id))
                              );
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="truncate">{p.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSeasonDialog({ open: false, edit: null })}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleSaveSeason} disabled={savingSeason}>
                {savingSeason ? "Saving…" : seasonDialog.edit ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { HostPricingPage };
