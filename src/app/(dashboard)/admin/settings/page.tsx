"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Store, Bell, Shield, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DEFAULTS = {
  storeName: "FirstLady Store",
  storeAddress: "123 Business Street, Lagos",
  storePhone: "+234 801 234 5678",
  storeEmail: "info@firstlady.com",
  taxRate: "7.5",
  currency: "NGN",
  lowStockThreshold: "10",
};

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your POS system</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="bg-white border border-gray-100 p-1 rounded-xl">
            <TabsTrigger value="store" className="rounded-lg"><Store className="w-4 h-4 mr-2" />Store</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg"><Shield className="w-4 h-4 mr-2" />Security</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Update your store details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Store Name" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
                  <Input label="Email" value={settings.storeEmail} onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })} />
                  <Input label="Phone" value={settings.storePhone} onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })} />
                  <Input label="Address" value={settings.storeAddress} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} />
                  <Input label="Tax Rate (%)" type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })} />
                  <Input label="Low Stock Threshold" type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Low Stock Alerts", description: "Get notified when products fall below minimum stock level", enabled: true },
                  { label: "Daily Sales Summary", description: "Receive end-of-day sales report", enabled: true },
                  { label: "New Order Notifications", description: "Alert for new sales orders", enabled: false },
                  { label: "Expense Approvals", description: "Notify when expenses need approval", enabled: true },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{n.label}</p>
                      <p className="text-sm text-gray-500">{n.description}</p>
                    </div>
                    <Badge variant={n.enabled ? "success" : "secondary"}>{n.enabled ? "Enabled" : "Disabled"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                  <Button variant="outline" className="mt-3" size="sm">Enable 2FA</Button>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="font-medium text-gray-900">Session Timeout</p>
                  <p className="text-sm text-gray-500 mt-1">Automatically log out after inactivity</p>
                  <Input type="number" value="30" className="mt-2 max-w-[200px]" label="Minutes" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
