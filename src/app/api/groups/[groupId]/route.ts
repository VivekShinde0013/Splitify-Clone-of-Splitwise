import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ groupId: string }>;

export async function GET(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId } = await params;

    // Fetch the group and its details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        expenses: {
          include: {
            splits: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            paidBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        payments: {
          include: {
            fromUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            toUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const members = group.members.map((m) => m.user);

    // Initialize balance tracking for each member
    const balanceMap: Record<
      string,
      {
        id: string;
        name: string;
        email: string;
        totalPaid: number;
        totalOwed: number;
        totalReceived: number;
        totalSettled: number;
        netBalance: number;
      }
    > = {};

    members.forEach((user) => {
      balanceMap[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        totalPaid: 0,
        totalOwed: 0,
        totalReceived: 0,
        totalSettled: 0,
        netBalance: 0,
      };
    });

    // 1. Calculate total paid by each user
    group.expenses.forEach((expense) => {
      if (balanceMap[expense.paidById]) {
        balanceMap[expense.paidById].totalPaid += expense.amount;
      }
      // Calculate total owed by each user from splits
      expense.splits.forEach((split) => {
        if (balanceMap[split.userId]) {
          balanceMap[split.userId].totalOwed += split.amount;
        }
      });
    });

    // 2. Calculate settlements (payments)
    group.payments.forEach((payment) => {
      if (balanceMap[payment.fromUserId]) {
        balanceMap[payment.fromUserId].totalSettled += payment.amount;
      }
      if (balanceMap[payment.toUserId]) {
        balanceMap[payment.toUserId].totalReceived += payment.amount;
      }
    });

    // 3. Compute netBalance
    members.forEach((user) => {
      const b = balanceMap[user.id];
      // Formula: Net Balance = Total Paid - Total Owed - Total Received + Total Settled
      b.netBalance = Number(
        (b.totalPaid - b.totalOwed - b.totalReceived + b.totalSettled).toFixed(2)
      );
    });

    // 4. Simplify Debts (Greedy Algorithm)
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    members.forEach((user) => {
      const bal = balanceMap[user.id].netBalance;
      if (bal < -0.005) {
        debtors.push({ id: user.id, amount: -bal });
      } else if (bal > 0.005) {
        creditors.push({ id: user.id, amount: bal });
      }
    });

    // Sort debtors and creditors descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplifiedDebts: {
      fromUser: { id: string; name: string; email: string };
      toUser: { id: string; name: string; email: string };
      amount: number;
    }[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmount = Number(
        Math.min(debtor.amount, creditor.amount).toFixed(2)
      );

      if (settleAmount > 0) {
        const dUser = balanceMap[debtor.id];
        const cUser = balanceMap[creditor.id];

        simplifiedDebts.push({
          fromUser: { id: dUser.id, name: dUser.name, email: dUser.email },
          toUser: { id: cUser.id, name: cUser.name, email: cUser.email },
          amount: settleAmount,
        });

        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;
      }

      if (debtor.amount < 0.005) {
        dIdx++;
      }
      if (creditor.amount < 0.005) {
        cIdx++;
      }
    }

    return NextResponse.json(
      {
        group,
        balances: Object.values(balanceMap),
        simplifiedDebts,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch group details error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
