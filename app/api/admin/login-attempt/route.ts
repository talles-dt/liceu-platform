import {NextResponse} from "next/server";
// Supabase Auth is the source of authentication audit events; browser claims are not evidence.
export async function POST(){return NextResponse.json({error:"Client-reported authentication events are not accepted."},{status:410});}
