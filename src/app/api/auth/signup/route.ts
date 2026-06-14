import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "../login/route";
import dns from "dns";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailNorm = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    const domain = emailNorm.split("@")[1];
    try {
      const records = await dns.promises.resolveMx(domain);
      if (!records || records.length === 0) {
        return NextResponse.json(
          { error: "Email domain does not exist or cannot receive emails" },
          { status: 400 }
        );
      }
    } catch (dnsError: any) {
      return NextResponse.json(
        { error: "Email domain does not exist or cannot receive emails" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashed = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNorm,
        password: hashed,
      },
    });

    // Return user details without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
