import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ expenseId: string }>;

// GET /api/expenses/[expenseId]/chats
export async function GET(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { expenseId } = await params;

    const messages = await prisma.chatMessage.findMany({
      where: { expenseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    console.error("Fetch chats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/expenses/[expenseId]/chats
// Body: { userId, message }
export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { expenseId } = await params;
    const { userId, message } = await req.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: "User ID and message text are required" },
        { status: 400 }
      );
    }

    // Verify expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    // Create chat message
    const chatMsg = await prisma.chatMessage.create({
      data: {
        expenseId,
        userId,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(chatMsg, { status: 201 });
  } catch (error: any) {
    console.error("Post chat error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
