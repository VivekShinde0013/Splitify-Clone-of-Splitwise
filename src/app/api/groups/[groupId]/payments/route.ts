import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ groupId: string }>;

// POST /api/groups/[groupId]/payments
// Body: { fromUserId, toUserId, amount }
export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId } = await params;
    const { fromUserId, toUserId, amount: rawAmount } = await req.json();

    if (!fromUserId || !toUserId || !rawAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const amount = Number(Number(rawAmount).toFixed(2));
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Settlement amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Verify both users are members of the group
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: [fromUserId, toUserId] },
      },
    });

    if (members.length < 2 && fromUserId !== toUserId) {
      return NextResponse.json(
        { error: "Both sender and receiver must be members of the group" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
