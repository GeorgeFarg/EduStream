"use client";

import { Button } from "@/components/ui/button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Mail, Bell, Palette, LogOut, Trash2, GraduationCap, Copy, DoorOpen } from "lucide-react";
import { useClassContext } from "@/contexts/ClassContext";
import toast from "react-hot-toast";
import axiosClient from "@/util/axiosClient";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { currentClass, isTeacher, refreshClasses } = useClassContext() as any;
  const router = useRouter();

  const showJoinCode = currentClass && isTeacher(currentClass.id);

  const leaveClass = async () => {
    if (!currentClass) return;
    try {
      await axiosClient.delete(`/api/classes/${currentClass.id}/leave`);
      toast.success("Left class successfully");
      if (typeof refreshClasses === "function") {
        await refreshClasses();
      }
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to leave class"
      );
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Classroom Settings Section (Teacher Only) */}
      {showJoinCode && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Classroom Settings ({currentClass.name})
          </h2>
          <Separator />
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Classroom Join Code
              </Label>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="font-mono text-2xl font-bold bg-muted px-4 py-2 rounded-md tracking-widest border border-border select-all">
                  {currentClass.code}
                </span>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(currentClass.code);
                    toast.success("Join code copied to clipboard!");
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this 6-character code with students so they can join your classroom.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Profile
        </h2>
        <Separator />
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              defaultValue={(currentClass as any)?.currentUser?.name || ""}
              className="mt-1 bg-input"
            />

          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Your email"
              defaultValue={(currentClass as any)?.currentUser?.email || ""}
              className="mt-1 bg-input"
            />

          </div>
          <Button
            type="button"
            onClick={async () => {
              try {
                // Uses uncontrolled inputs; for now read values from DOM.
                const nameInput = document.getElementById('name') as HTMLInputElement | null;
                const emailInput = document.getElementById('email') as HTMLInputElement | null;
                const name = nameInput?.value;
                const email = emailInput?.value;

                await axiosClient.patch('/api/users/me', { name, email });
                toast.success('Profile updated');
                router.refresh?.();
              } catch (err: any) {
                toast.error(
                  err?.response?.data?.error?.message ||
                    err?.response?.data?.message ||
                    'Failed to update profile'
                );
              }
            }}
          >
            Save Changes
          </Button>


        </div>

      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <Separator className="bg-destructive/20" />
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold mb-1">Sign Out</h3>
            <p className="text-sm text-muted-foreground mb-3">
              You will be signed out from all devices
            </p>
            <Button variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
          <Separator className="bg-destructive/20" />
          <div>
            <h3 className="font-semibold mb-1">Leave Class</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Remove yourself from this classroom.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={leaveClass}
              disabled={!currentClass}
            >
              <DoorOpen className="w-4 h-4" />
              Leave Class
            </Button>
          </div>
          <Separator className="bg-destructive/20" />
          <div>
            <h3 className="font-semibold mb-1">Delete Account</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete your account and all associated data
            </p>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

