import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator_uuid, creator_color } = body;

    if (!creator_uuid) {
      return NextResponse.json(
        { error: "Creator UUID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create new room with UUID and color
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        creator_uuid,
        creator_color: creator_color || "#ff2d92",
        creator_ip: "uuid-based", // Keep for backwards compatibility
        status: "active",
        closes_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating room:", error);
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roomId: room.id, room });
  } catch (error) {
    console.error("Error in POST /api/rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("id");

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if room is expired
    if (room.closes_at && new Date(room.closes_at) < new Date()) {
      return NextResponse.json(
        { error: "Room has expired", code: "ROOM_EXPIRED" },
        { status: 410 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error in GET /api/rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, guest_uuid, guest_color } = body;

    if (!room_id || !guest_uuid) {
      return NextResponse.json(
        { error: "Room ID and Guest UUID are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First check if room exists
    const { data: existingRoom, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", room_id)
      .single();

    if (fetchError || !existingRoom) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if guest_uuid is same as creator (can't join own room as guest)
    if (existingRoom.creator_uuid === guest_uuid) {
      return NextResponse.json(existingRoom);
    }

    // Check if room already has a different guest
    if (existingRoom.guest_uuid && existingRoom.guest_uuid !== guest_uuid) {
      return NextResponse.json(
        { error: "Room is full", code: "ROOM_FULL" },
        { status: 403 }
      );
    }

    // Update room with guest UUID and color
    const { data: room, error } = await supabase
      .from("rooms")
      .update({
        guest_uuid,
        guest_color: guest_color || "#d426ff",
        guest_ip: "uuid-based", // Keep for backwards compatibility
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", room_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating room:", error);
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error in PATCH /api/rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
