import React, { useState } from "react";
import { eventManagementService } from "../../services/eventManagementService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { UserX, Save, ShieldAlert, Ban, Info } from "lucide-react";

export function UserRestrictions() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [restrictions, setRestrictions] = useState({
    can_create_events: true,
    max_visibility: "PRIVATE",
    restriction_reason: "",
    blocked_lifestyles: [] as number[],
    blocked_familyname8s: [] as number[],
    blocked_families: [] as number[],
    restricted_to_visibility: [1, 2],
  });

  const handleApply = async () => {
    if (!userId) {
      toast.error("Identity Verification Required", {
        description: "Please provide a valid User ID to proceed.",
        className:
          "bg-white text-gray-900 border border-red-50 shadow-xl rounded-2xl",
      });
      return;
    }
    setLoading(true);
    try {
      await eventManagementService.restrictUser({
        user_id: parseInt(userId),
        ...restrictions,
      });
      toast.success("Restriction Enforced", {
        description: `Successfully updated privileges for UID: ${userId}`,
        className:
          "bg-white text-gray-900 border border-gray-100 shadow-xl rounded-2xl",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Restriction deployment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="lg:col-span-3 bg-white border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden ring-1 ring-gray-100">
        <CardHeader className="bg-linear-to-r from-red-50/50 to-white border-b border-gray-50 px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-gray-900">
                User Enforcement
              </CardTitle>
              <CardDescription className="text-gray-500 font-medium mt-1">
                Implement behavioral restrictions on individual community
                members.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Target Account Identity
            </Label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Ban className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Member ID (e.g. 1042)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-white border-gray-100 text-gray-900 pl-11 h-14 rounded-2xl font-bold focus:ring-red-500 text-lg shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 shadow-sm group hover:border-red-100 transition-all">
            <div className="space-y-0.5">
              <Label className="text-base font-black text-gray-900">
                Revoke Creation Privileges
              </Label>
              <p className="text-sm text-gray-500 font-medium">
                Toggle user's ability to initiate new events.
              </p>
            </div>
            <Switch
              checked={!restrictions.can_create_events}
              onCheckedChange={(checked: boolean) =>
                setRestrictions({
                  ...restrictions,
                  can_create_events: !checked,
                })
              }
              className="data-[state=checked]:bg-red-500"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
              Visibility Ceiling for Account
            </Label>
            <Select
              value={restrictions.max_visibility}
              onValueChange={(value: string) =>
                setRestrictions({ ...restrictions, max_visibility: value })
              }
            >
              <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-900 h-14 rounded-2xl font-bold focus:ring-red-500">
                <SelectValue placeholder="Account limit..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 text-gray-900 rounded-2xl shadow-2xl">
                <SelectItem value="PUBLIC" className="font-bold">
                  🌍 Allowed Public
                </SelectItem>
                <SelectItem value="CONNECTED" className="font-bold">
                  🔗 Max Connected
                </SelectItem>
                <SelectItem value="FAMILY" className="font-bold">
                  🏠 Max Family
                </SelectItem>
                <SelectItem value="PRIVATE" className="font-bold">
                  🔒 Private Only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
              Enforcement Documentation
            </Label>
            <Textarea
              placeholder="Provide context for this restriction (e.g., guideline violation history)..."
              value={restrictions.restriction_reason}
              onChange={(e) =>
                setRestrictions({
                  ...restrictions,
                  restriction_reason: e.target.value,
                })
              }
              className="bg-gray-50 border-gray-100 text-gray-900 rounded-3xl p-6 min-h-[140px] font-medium focus:ring-red-500"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleApply}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-16 rounded-2xl font-black text-lg transition-all shadow-xl shadow-red-100 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Updating Database...
                </div>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6 mr-3" />
                  Deploy Restriction
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-gray-50/50 border-dashed border-2 border-gray-200 rounded-3xl overflow-hidden self-start sticky top-6">
        <CardHeader className="px-8 pt-8">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-red-500" />
            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Experimental
            </CardTitle>
          </div>
          <CardTitle className="text-xl font-bold text-gray-700">
            Granular Black-lists
          </CardTitle>
          <CardDescription className="text-gray-400 font-medium">
            Next-gen restrictions targeting specific demographic nodes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4 opacity-40">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">
                lifestyle Block-list
              </Label>
              <Input
                disabled
                className="bg-white border-gray-100 rounded-xl"
                placeholder="IDs: 1, 5..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">
                familyname8 Restraints
              </Label>
              <Input
                disabled
                className="bg-white border-gray-100 rounded-xl"
                placeholder="IDs: 2, 4..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">
                Lineage/Family Lock
              </Label>
              <Input
                disabled
                className="bg-white border-gray-100 rounded-xl"
                placeholder="IDs: 312..."
              />
            </div>
          </div>

          <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
              Coming Soon
            </p>
            <p className="text-xs text-red-900 font-bold leading-relaxed">
              These features are currently being beta-tested for large scale
              community management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
