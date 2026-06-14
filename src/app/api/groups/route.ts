import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/groups?userId=XYZ
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
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
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const groups = memberships.map((m: any) => m.group);

    return NextResponse.json(groups, { status: 200 });
  } catch (error: any) {
    console.error("Fetch groups error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/groups
// Request body: { name, userId }
export async function POST(req: NextRequest) {
  try {
    const { name, userId } = await req.json();

    if (!name || !userId) {
      return NextResponse.json(
        { error: "Group name and creator User ID are required" },
        { status: 400 }
      );
    }

    // Use transaction to create group and add creator as member
    const group = await prisma.$transaction(async (tx: any) => {
      const g = await tx.group.create({
        data: { name },
      });

      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: userId,
        },
      });

      return g;
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
