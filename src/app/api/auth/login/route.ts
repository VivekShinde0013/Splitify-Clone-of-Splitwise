import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
        },
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
