"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteButtonProps = {
  id: string;
  action: (formData: FormData) => Promise<void>;
  title: string;
  description: string;
  triggerLabel?: string;
};

export function DeleteButton({
  id,
  action,
  title,
  description,
  triggerLabel = "Delete",
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await action(formData);
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <form action={handleSubmit}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" /> Deleting…
                </>
              ) : (
                "Yes, delete"
              )}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
