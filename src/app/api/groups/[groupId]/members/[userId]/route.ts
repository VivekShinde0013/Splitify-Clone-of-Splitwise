import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ groupId: string; userId: string }>;

// DELETE /api/groups/[groupId]/members/[userId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId, userId } = await params;

    // 1. Calculate the user's net balance in this group
    // Fetch expenses paid by this user in this group
    const expensesPaid = await prisma.expense.findMany({
      where: { groupId, paidById: userId },
      select: { amount: true },
    });
    const totalPaid = expensesPaid.reduce((sum: number, e: any) => sum + e.amount, 0);

    // Fetch expense splits owed by this user in this group
    const splitsOwed = await prisma.expenseSplit.findMany({
      where: {
        userId,
        expense: {
          groupId,
        },
      },
      select: { amount: true },
    });
    const totalOwed = splitsOwed.reduce((sum: number, s: any) => sum + s.amount, 0);

    // Fetch settlements received by this user in this group
    const settlementsReceived = await prisma.payment.findMany({
      where: { groupId, toUserId: userId },
      select: { amount: true },
    });
    const totalReceived = settlementsReceived.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Fetch settlements made by this user in this group
    const settlementsMade = await prisma.payment.findMany({
      where: { groupId, fromUserId: userId },
      select: { amount: true },
    });
    const totalSettled = settlementsMade.reduce((sum: number, p: any) => sum + p.amount, 0);

    const netBalance = Number(
      (totalPaid - totalOwed - totalReceived + totalSettled).toFixed(2)
    );

    // Block deletion if balance is not zero
    if (Math.abs(netBalance) > 0.005) {
      return NextResponse.json(
        {
          error: `Cannot remove member. User has an outstanding balance of $${netBalance.toFixed(
            2
          )}. They must be settled up first.`,
        },
        { status: 400 }
      );
    }

    // Delete membership
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Member removed successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
