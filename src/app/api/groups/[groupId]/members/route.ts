import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = Promise<{ groupId: string }>;

// POST /api/groups/[groupId]/members
// Body: { userId }
export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    // Check if member already exists
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Add user as member
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId,
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

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
