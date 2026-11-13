import { q, tx, MONTH_START_SQL } from "./db";
import type { Ctx } from "./auth";

// A firm member's allowance is spent when a NEW post is drafted, not when it is
// revised, so asking for "bolder" three times costs nothing but a fourth idea does.
//
// Counting and then inserting is not safe on its own: under READ COMMITTED two
// requests can both read "2 used", both pass, and both insert. So the member's
// own row is locked first. Their drafts queue behind that lock, each one sees the
// previous one's insert, and the limit holds however many arrive at once. Other
// members are unaffected, because the lock is per person.
//
// If the model then fails, the slot is given back: nobody pays an allowance for
// an error.

export type Reservation = { ok: true; id: number | null } | { ok: false; used: number; quota: number };

export async function reserveDraft(ctx: Ctx): Promise<Reservation> {
  const quota = ctx.firm.monthlyQuota;
  return tx(async (c) => {
    await c.query(`select 1 from members where id = $1 for update`, [ctx.member.id]);
    if (quota > 0) {
      const used = await c.query(
        `select count(*)::int as n from usage
          where member_id = $1 and kind = 'draft' and created_at >= ${MONTH_START_SQL}`,
        [ctx.member.id],
      );
      if (used.rows[0].n >= quota) return { ok: false as const, used: used.rows[0].n, quota };
    }
    // a quota of 0 means no limit, but the draft is still counted so usage is visible
    const ins = await c.query(`insert into usage (firm_id, member_id, kind) values ($1,$2,'draft') returning id`, [
      ctx.firm.id,
      ctx.member.id,
    ]);
    return { ok: true as const, id: ins.rows[0].id as number };
  });
}

export async function refundDraft(id: number | null) {
  if (id == null) return;
  await q(`delete from usage where id = $1`, [id]).catch(() => {});
}
