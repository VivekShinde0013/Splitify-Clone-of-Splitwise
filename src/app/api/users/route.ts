import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
