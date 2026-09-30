import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function preveriVodnikPin(
  vodnikId: number,
  pin: string
): Promise<boolean> {
  if (!pin || !Number.isInteger(vodnikId)) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("vodnik_pin")
    .select("pin_hash")
    .eq("vodnik_id", vodnikId)
    .single();

  if (error || !data?.pin_hash) {
    return false;
  }

  return bcrypt.compare(pin, data.pin_hash);
}
