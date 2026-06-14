import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ groupId: string }>;

/*
Body: {
  entries: Array<{
    date: string,
    description: string,
    amount: number,
    payerId: string,
    participants: Array<{ id: string, name: string }>,
    splitType: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARE" | "SETTLEMENT",
    isSettlement: boolean,
    action: "KEEP" | "DELETE"
  }>,
  anomalies: Array<any>
}
*/
export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId } = await params;
    const { entries, anomalies } = await req.json();

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Valid entries array is required" },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Filter to only kept entries
    const keptEntries = entries.filter((e) => e.action === "KEEP");
    const importedExpenses: any[] = [];
    const importedPayments: any[] = [];

    // Run DB writes in a transaction
    await prisma.$transaction(async (tx: any) => {
      for (const entry of keptEntries) {
        const entryDate = new Date(entry.date);

        if (entry.isSettlement || entry.splitType === "SETTLEMENT") {
          // It's a payment settlement
          // PaidBy paid Participant[0] (or group default)
          const fromUserId = entry.payerId;
          const toUserId = entry.participants[0]?.id;

          if (!toUserId || fromUserId === toUserId) {
            // Cannot settle to oneself, skip or warn
            continue;
          }

          const payment = await tx.payment.create({
            data: {
              groupId,
              fromUserId,
              toUserId,
              amount: Math.abs(entry.amount), // Ensure positive settlement amount
              createdAt: entryDate,
            },
          });
          importedPayments.push(payment);
        } else {
          // It's a shared expense
          const splitType = entry.splitType === "SETTLEMENT" ? "EQUAL" : (entry.splitType || "EQUAL");
          
          const exp = await tx.expense.create({
            data: {
              groupId,
              description: entry.description,
              amount: entry.amount,
              paidById: entry.payerId,
              splitType,
              createdAt: entryDate,
            },
          });

          // Calculate equal splits
          const N = entry.participants.length;
          const baseVal = Number((entry.amount / N).toFixed(2));
          let sum = 0;

          for (let idx = 0; idx < N; idx++) {
            const part = entry.participants[idx];
            // Rounding adjustment on last participant
            const itemAmount = idx === N - 1 ? Number((entry.amount - sum).toFixed(2)) : baseVal;
            sum += itemAmount;

            await tx.expenseSplit.create({
              data: {
                expenseId: exp.id,
                userId: part.id,
                amount: itemAmount,
              },
            });
          }
          importedExpenses.push(exp);
        }
      }
    });

    return NextResponse.json({
      success: true,
      importedExpensesCount: importedExpenses.length,
      importedPaymentsCount: importedPayments.length,
      anomaliesProcessed: anomalies?.length || 0,
    });
  } catch (error: any) {
    console.error("Confirm import error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
