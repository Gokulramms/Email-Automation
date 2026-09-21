import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";

export async function GET() {
  try {
    const users = await db.libraryUser.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch library users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, assetId, department } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields (name, email)" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await db.libraryUser.upsert({
      where: { email: cleanEmail },
      update: {
        name,
        assetId: assetId || null,
        department: department || null,
      },
      create: {
        name,
        email: cleanEmail,
        assetId: assetId || null,
        department: department || null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save library user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    await db.libraryUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete library user" }, { status: 500 });
  }
}
