import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ groupId: string }>;

// POST /api/groups/[groupId]/expenses
/*
Body: {
  description: string,
  amount: number,
  paidById: string,
  splitType: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARE",
  splits: [
    { userId: string, value?: number } // value represents: amount for UNEQUAL, percentage for PERCENTAGE, shares for SHARE, unused for EQUAL
  ]
}
*/
export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId } = await params;
    const { description, amount: rawAmount, paidById, splitType, splits } = await req.json();

    if (!description || !rawAmount || !paidById || !splitType || !splits || splits.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const amount = Number(Number(rawAmount).toFixed(2));
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Verify group exists and payer is in the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: paidById,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Payer is not a member of this group" },
        { status: 400 }
      );
    }

    // Calculate splits
    const calculatedSplits: { userId: string; amount: number; ratioVal?: number }[] = [];
    const N = splits.length;

    if (splitType === "EQUAL") {
      // Split raw amount equally
      const baseVal = Number((amount / N).toFixed(2));
      let sum = 0;

      splits.forEach((s: any, idx: number) => {
        const itemAmount = idx === N - 1 ? Number((amount - sum).toFixed(2)) : baseVal;
        sum += itemAmount;
        calculatedSplits.push({
          userId: s.userId,
          amount: itemAmount,
        });
      });
    } else if (splitType === "UNEQUAL") {
      // Splits specified explicitly as currency amounts
      let sum = 0;
      splits.forEach((s: any) => {
        const val = Number(Number(s.value || 0).toFixed(2));
        sum += val;
        calculatedSplits.push({
          userId: s.userId,
          amount: val,
        });
      });

      // Validate sum matches total amount
      if (Math.abs(sum - amount) > 0.02) {
        return NextResponse.json(
          { error: `Sum of splits ($${sum}) must equal the total amount ($${amount})` },
          { status: 400 }
        );
      }
    } else if (splitType === "PERCENTAGE") {
      // Splits specified as percentages (e.g. 50, 25, 25)
      let percentSum = 0;
      splits.forEach((s: any) => {
        percentSum += Number(s.value || 0);
      });

      if (Math.abs(percentSum - 100) > 0.01) {
        return NextResponse.json(
          { error: `Sum of percentages (${percentSum}%) must equal 100%` },
          { status: 400 }
        );
      }

      let sum = 0;
      splits.forEach((s: any, idx: number) => {
        const pct = Number(s.value || 0);
        const itemAmount = idx === N - 1 
          ? Number((amount - sum).toFixed(2))
          : Number(((amount * pct) / 100).toFixed(2));
        sum += itemAmount;
        calculatedSplits.push({
          userId: s.userId,
          amount: itemAmount,
          ratioVal: pct,
        });
      });
    } else if (splitType === "SHARE") {
      // Splits specified as shares (e.g. 2, 1, 1)
      let totalShares = 0;
      splits.forEach((s: any) => {
        totalShares += Number(s.value || 0);
      });

      if (totalShares <= 0) {
        return NextResponse.json(
          { error: "Total shares must be greater than 0" },
          { status: 400 }
        );
      }

      let sum = 0;
      splits.forEach((s: any, idx: number) => {
        const sh = Number(s.value || 0);
        const itemAmount = idx === N - 1
          ? Number((amount - sum).toFixed(2))
          : Number(((amount * sh) / totalShares).toFixed(2));
        sum += itemAmount;
        calculatedSplits.push({
          userId: s.userId,
          amount: itemAmount,
          ratioVal: sh,
        });
      });
    } else {
      return NextResponse.json(
        { error: "Invalid split type" },
        { status: 400 }
      );
    }

    // Write to database in a transaction
    const expense = await prisma.$transaction(async (tx: any) => {
      const exp = await tx.expense.create({
        data: {
          groupId,
          description,
          amount,
          paidById,
          splitType,
        },
      });

      // Create splits
      for (const cs of calculatedSplits) {
        await tx.expenseSplit.create({
          data: {
            expenseId: exp.id,
            userId: cs.userId,
            amount: cs.amount,
            ratioVal: cs.ratioVal,
          },
        });
      }

      return exp;
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
