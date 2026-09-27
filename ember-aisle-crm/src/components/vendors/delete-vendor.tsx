"use client";

import { deleteVendor } from "@/actions/vendors";
import { useAction } from "@/components/use-action";
import { Button } from "@/components/ui";

export function DeleteVendorButton({ vendorId, name }: { vendorId: string; name: string }) {
  const del = useAction();
  return (
    <div>
      <Button
        variant="danger"
        disabled={del.pending}
        onClick={() => del.run(() => deleteVendor(vendorId), { confirm: `Permanently delete ${name}?` })}
      >
        Delete vendor
      </Button>
      {del.error && <p className="mt-2 text-sm text-over">{del.error}</p>}
    </div>
  );
}
