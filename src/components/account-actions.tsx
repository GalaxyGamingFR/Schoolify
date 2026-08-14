"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserCog, Trash2 } from "lucide-react";

export function ManageAccountButton() {
  const { openUserProfile } = useClerk();
  return (
    <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
      <UserCog className="size-4" /> Manage name, email & password
    </Button>
  );
}

export function DeleteAccountButton() {
  const { user, signOut } = useClerk();
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={async () => {
        if (!user) return;
        const confirmed = confirm(
          "Delete your Schoolify account? This permanently removes your assignments, grades, messages, and every other record tied to your account. This can't be undone.",
        );
        if (!confirmed) return;
        const typed = prompt('Type "delete" to confirm.');
        if (typed?.toLowerCase() !== "delete") return;

        setIsPending(true);
        await user.delete();
        await signOut({ redirectUrl: "/" });
      }}
    >
      <Trash2 className="size-4" /> Delete account
    </Button>
  );
}
