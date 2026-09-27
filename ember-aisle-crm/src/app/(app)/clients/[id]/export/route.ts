import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/dal";
import { uuid } from "@/lib/validation";
import { exportClientData } from "@/server/queries";

/** GDPR subject access: everything we hold on a client, as JSON. */
export async function GET(_req: Request, ctx: RouteContext<"/clients/[id]/export">) {
  await requireUser();
  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) return new NextResponse("Not found", { status: 404 });
  const data = await exportClientData(id);
  if (!data) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="client-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
