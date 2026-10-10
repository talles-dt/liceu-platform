import {NextResponse} from "next/server";
function retired(){return NextResponse.json({error:"Responda ao quiz do módulo. Uma lição sem questões não concede aprovação automática."},{status:410});}
export const GET=retired;
export const POST=retired;
