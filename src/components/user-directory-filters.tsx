"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_ITEMS = { ALL: "All roles", STUDENT: "Student", PARENT: "Parent", TEACHER: "Teacher", ADMIN: "Admin" };
const STATUS_ITEMS = { ALL: "All statuses", ACTIVE: "Active", SUSPENDED: "Suspended" };

export function UserDirectoryFilters({ q, role, status }: { q?: string; role?: string; status?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/users?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form
        className="flex min-w-[10rem] flex-1 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          updateParam("q", value || null);
        }}
      >
        <Input name="q" defaultValue={q} placeholder="Search name or email..." />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <Select value={role ?? "ALL"} onValueChange={(v) => updateParam("role", v === "ALL" ? null : v)} items={ROLE_ITEMS}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status ?? "ALL"} onValueChange={(v) => updateParam("status", v === "ALL" ? null : v)} items={STATUS_ITEMS}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
