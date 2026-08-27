import { toggleSaved } from "@/app/actions/saved";
import { Button } from "@/components/ui/button";

export function SaveButton({
  itemType,
  itemId,
  path,
  saved,
}: {
  itemType: "event" | "opportunity";
  itemId: string;
  path: string;
  saved: boolean;
}) {
  return (
    <form action={toggleSaved}>
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="path" value={path} />
      <Button type="submit" variant={saved ? "default" : "outline"} size="sm">
        {saved ? "Saved" : "Save"}
      </Button>
    </form>
  );
}
